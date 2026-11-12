import {
  clipboard,
  dialog,
  Menu,
  WebContentsView,
  type BaseWindow,
  type Rectangle,
  type Session
} from 'electron'
import type { TabLoadError, TabState } from '@shared/ipc'
import { contentWebPreferences } from '../app/web-preferences'
import { buildContextMenu } from '../app/context-menu'
import { attachShortcuts, type ShortcutAction } from '../app/shortcuts'
import { guardWebContentNavigation } from '../app/navigation-guard'
import type { NavigationTarget } from '../ipc/IpcRouter'

interface Tab {
  id: number
  view: WebContentsView
  /** Set after a failed main-frame load; cleared by the next navigation. */
  error: TabLoadError | null
}

/**
 * Owns the web content views. Phase 1 keeps a single tab; Phase 3 adds
 * multiple tabs, switching and shortcuts on top of this same structure.
 */
export class TabManager implements NavigationTarget {
  private tabs: Tab[] = []
  private activeTabId: number | null = null
  /** Called once every tab has closed after requestCloseAll(). */
  private onAllClosed: (() => void) | null = null
  private nextId = 1
  private contentBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }

  constructor(
    private readonly window: BaseWindow,
    private readonly contentSession: Session,
    private readonly onActiveStateChange: (state: TabState) => void,
    /** A page entered/left HTML fullscreen (e.g. a video player). */
    private readonly onHtmlFullscreenChange: (fullscreen: boolean) => void = () => undefined,
    /** The active tab started/stopped showing the error page (layout changes). */
    private readonly onErrorPageChange: () => void = () => undefined,
    /** A shortcut asked to focus the address bar (a UI concern). */
    private readonly onFocusAddress: () => void = () => undefined,
    /** The user agent a site gets (SessionManager.userAgentFor). */
    private readonly userAgentFor: ((url: string) => string) | null = null
  ) {}

  /** Opens `url` in a new tab and makes it active. */
  openTab(url: string): number {
    const view = new WebContentsView({
      webPreferences: { ...contentWebPreferences(), session: this.contentSession }
    })
    const tab: Tab = { id: this.nextId++, view, error: null }

    // Phase 1: pop-ups load in the current tab. Phase 3: open a new tab instead.
    guardWebContentNavigation(view.webContents, (popupUrl) => {
      this.navigateActive(popupUrl)
    })

    const emit = (): void => {
      this.emitIfActive(tab)
    }
    view.webContents.on('did-start-loading', emit)
    view.webContents.on('did-stop-loading', emit)
    view.webContents.on('did-navigate', emit)
    view.webContents.on('did-navigate-in-page', emit)
    view.webContents.on('page-title-updated', emit)
    // A failed main-frame load shows our own error page (rendered by the
    // browser UI, never inside the web content view). ERR_ABORTED (-3) is not
    // an error: the user navigated again or a guard blocked a redirect.
    view.webContents.on('did-fail-load', (_event, code, description, failedUrl, isMainFrame) => {
      if (!isMainFrame || code === -3) return
      // Loads are aborted while the window closes; never touch dying views then.
      if (this.onAllClosed || this.window.isDestroyed() || view.webContents.isDestroyed()) return
      tab.error = { code, description, url: failedUrl }
      this.applyVisibility()
      emit()
    })
    // Any new main-frame navigation (retry, back, forward, typing) clears the
    // error. Chromium's own internal error document is not a "new" navigation.
    view.webContents.on('did-start-navigation', (details) => {
      if (!details.isMainFrame || details.isSameDocument) return
      if (details.url.startsWith('chrome-error://')) return
      if (tab.error === null) return
      tab.error = null
      this.applyVisibility()
    })
    view.webContents.on('render-process-gone', (_event, details) => {
      console.error(`[tabs] Renderer of tab ${String(tab.id)} gone:`, details.reason)
      emit()
    })
    // A page with a beforeunload handler ("unsaved changes") would otherwise
    // silently block closing or navigating. Ask the user, like Chrome does.
    view.webContents.on('will-prevent-unload', (event) => {
      if (this.window.isDestroyed()) return
      const choice = dialog.showMessageBoxSync(this.window, {
        type: 'question',
        buttons: ['Ayrıl', 'Kal'],
        defaultId: 0,
        cancelId: 1,
        title: 'Bu siteden ayrılmak istiyor musunuz?',
        message: 'Bu siteden ayrılmak istiyor musunuz?',
        detail: 'Yaptığınız değişiklikler kaydedilmemiş olabilir.'
      })
      if (choice === 0) event.preventDefault() // ignore beforeunload and leave
    })
    // Per-site identity: choose the site's user agent before each main-frame
    // navigation, so the page's navigator.userAgent matches its requests.
    view.webContents.on('will-navigate', (details) => {
      this.applyUserAgent(view.webContents, details.url)
    })
    view.webContents.on('did-start-navigation', (details) => {
      if (details.isMainFrame && !details.isSameDocument) {
        this.applyUserAgent(view.webContents, details.url)
      }
    })
    attachShortcuts(view.webContents, (action) => {
      this.runShortcut(action)
    })
    view.webContents.on('context-menu', (_event, params) => {
      if (this.window.isDestroyed()) return
      const contents = view.webContents
      const menu = Menu.buildFromTemplate(
        buildContextMenu(params, {
          canGoBack: contents.navigationHistory.canGoBack(),
          canGoForward: contents.navigationHistory.canGoForward(),
          goBack: () => {
            this.goBack()
          },
          goForward: () => {
            this.goForward()
          },
          reload: () => {
            contents.reload()
          },
          copyText: (text) => {
            clipboard.writeText(text).catch((error: unknown) => {
              console.warn('[tabs] Clipboard write failed:', error)
            })
          },
          saveImage: (url) => {
            contents.downloadURL(url)
          }
        })
      )
      menu.popup({ window: this.window })
    })
    view.webContents.on('enter-html-full-screen', () => {
      if (tab.id === this.activeTabId) this.onHtmlFullscreenChange(true)
    })
    view.webContents.on('leave-html-full-screen', () => {
      if (tab.id === this.activeTabId) this.onHtmlFullscreenChange(false)
    })

    view.webContents.once('destroyed', () => {
      this.removeTab(tab)
    })

    this.tabs.push(tab)
    this.window.contentView.addChildView(view)
    this.activate(tab.id)
    this.load(view, url)
    return tab.id
  }

  /** Loads an already-validated http(s) URL in the active tab. */
  navigateActive(url: string): void {
    const tab = this.activeTab()
    if (tab) this.load(tab.view, url)
  }

  /** Keyboard shortcut dispatch (from the page or from the toolbar). */
  runShortcut(action: ShortcutAction): void {
    switch (action) {
      case 'back':
        this.goBack()
        break
      case 'forward':
        this.goForward()
        break
      case 'reload':
        this.reload()
        break
      case 'reloadIgnoringCache':
        this.activeTab()?.view.webContents.reloadIgnoringCache()
        break
      case 'stop':
        this.stop()
        break
      case 'focusAddress':
        this.onFocusAddress()
        break
    }
  }

  goBack(): void {
    const history = this.activeTab()?.view.webContents.navigationHistory
    if (history?.canGoBack()) history.goBack()
  }

  goForward(): void {
    const history = this.activeTab()?.view.webContents.navigationHistory
    if (history?.canGoForward()) history.goForward()
  }

  reload(): void {
    this.activeTab()?.view.webContents.reload()
  }

  stop(): void {
    this.activeTab()?.view.webContents.stop()
  }

  /** True while the active tab shows the error page instead of the website. */
  activeHasError(): boolean {
    return this.activeTab()?.error != null
  }

  /** State of the active tab, or null when there is none. */
  activeState(): TabState | null {
    const tab = this.activeTab()
    return tab ? stateOf(tab) : null
  }

  /**
   * Closes every tab the way Chrome does when a window closes: each page gets
   * its beforeunload ("unsaved changes?") chance first. `onAllClosed` runs only
   * once all tabs are gone; if the user chooses to stay on a page, it never
   * runs and the window stays open.
   */
  requestCloseAll(onAllClosed: () => void): void {
    if (this.tabs.length === 0) {
      onAllClosed()
      return
    }
    this.onAllClosed = onAllClosed
    for (const tab of [...this.tabs]) {
      const contents = tab.view.webContents
      if (contents.isDestroyed()) continue
      // A crashed page cannot answer beforeunload; close it directly.
      contents.close({ waitForBeforeUnload: !contents.isCrashed() })
    }
  }

  setBounds(bounds: Rectangle): void {
    this.contentBounds = bounds
    for (const tab of this.tabs) tab.view.setBounds(bounds)
  }

  /**
   * Called from the window's 'closed' event. The window is already destroyed
   * at that point, so only the views' web contents are closed here (touching
   * window.contentView would throw "Object has been destroyed").
   */
  destroyAll(): void {
    for (const tab of this.tabs) {
      if (!tab.view.webContents.isDestroyed()) tab.view.webContents.close()
    }
    this.tabs = []
    this.activeTabId = null
  }

  /** Only the active tab is visible, and not while it shows the error page. */
  private applyVisibility(): void {
    for (const tab of this.tabs) {
      if (tab.view.webContents.isDestroyed()) continue
      tab.view.setVisible(tab.id === this.activeTabId && tab.error === null)
    }
    this.onErrorPageChange()
  }

  private activate(id: number): void {
    this.activeTabId = id
    for (const tab of this.tabs) tab.view.setBounds(this.contentBounds)
    this.applyVisibility()
    const active = this.activeTab()
    if (active) this.emitIfActive(active)
  }

  private removeTab(tab: Tab): void {
    this.tabs = this.tabs.filter((t) => t.id !== tab.id)
    if (!this.window.isDestroyed()) this.window.contentView.removeChildView(tab.view)
    if (this.activeTabId === tab.id) this.activeTabId = this.tabs[0]?.id ?? null
    if (this.tabs.length === 0 && this.onAllClosed) {
      const done = this.onAllClosed
      this.onAllClosed = null
      done()
    }
  }

  private activeTab(): Tab | undefined {
    return this.tabs.find((tab) => tab.id === this.activeTabId)
  }

  private emitIfActive(tab: Tab): void {
    if (tab.id !== this.activeTabId || tab.view.webContents.isDestroyed()) return
    this.onActiveStateChange(stateOf(tab))
  }

  private applyUserAgent(contents: Electron.WebContents, url: string): void {
    if (!this.userAgentFor || contents.isDestroyed() || url.startsWith('chrome-error://')) return
    const userAgent = this.userAgentFor(url)
    if (contents.getUserAgent() !== userAgent) contents.setUserAgent(userAgent)
  }

  private load(view: WebContentsView, url: string): void {
    this.applyUserAgent(view.webContents, url)
    view.webContents.loadURL(url).catch((error: unknown) => {
      // ERR_ABORTED (-3) is normal: the user navigated again before the load
      // finished, or a guard blocked a redirect. Anything else is logged.
      if (error instanceof Error && error.message.includes('ERR_ABORTED')) return
      console.warn('[tabs] Load failed:', url, error)
    })
  }
}

function stateOf(tab: Tab): TabState {
  const contents = tab.view.webContents
  const history = contents.navigationHistory
  return {
    id: tab.id,
    url: contents.getURL(),
    title: contents.getTitle(),
    isLoading: contents.isLoading(),
    canGoBack: history.canGoBack(),
    canGoForward: history.canGoForward(),
    error: tab.error
  }
}
