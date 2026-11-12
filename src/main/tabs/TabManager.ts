import { WebContentsView, type BaseWindow, type Rectangle, type Session } from 'electron'
import type { TabState } from '@shared/ipc'
import { contentWebPreferences } from '../app/web-preferences'
import { guardWebContentNavigation } from '../app/navigation-guard'
import type { NavigationTarget } from '../ipc/IpcRouter'

interface Tab {
  id: number
  view: WebContentsView
}

/**
 * Owns the web content views. Phase 1 keeps a single tab; Phase 3 adds
 * multiple tabs, switching and shortcuts on top of this same structure.
 */
export class TabManager implements NavigationTarget {
  private tabs: Tab[] = []
  private activeTabId: number | null = null
  private nextId = 1
  private contentBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }

  constructor(
    private readonly window: BaseWindow,
    private readonly contentSession: Session,
    private readonly onActiveStateChange: (state: TabState) => void
  ) {}

  /** Opens `url` in a new tab and makes it active. */
  openTab(url: string): number {
    const view = new WebContentsView({
      webPreferences: { ...contentWebPreferences(), session: this.contentSession }
    })
    const tab: Tab = { id: this.nextId++, view }

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
    view.webContents.on('render-process-gone', (_event, details) => {
      console.error(`[tabs] Renderer of tab ${String(tab.id)} gone:`, details.reason)
      emit()
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

  /** State of the active tab, or null when there is none. */
  activeState(): TabState | null {
    const tab = this.activeTab()
    return tab ? stateOf(tab) : null
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

  private activate(id: number): void {
    this.activeTabId = id
    for (const tab of this.tabs) {
      tab.view.setVisible(tab.id === id)
      tab.view.setBounds(this.contentBounds)
    }
    const active = this.activeTab()
    if (active) this.emitIfActive(active)
  }

  private activeTab(): Tab | undefined {
    return this.tabs.find((tab) => tab.id === this.activeTabId)
  }

  private emitIfActive(tab: Tab): void {
    if (tab.id !== this.activeTabId || tab.view.webContents.isDestroyed()) return
    this.onActiveStateChange(stateOf(tab))
  }

  private load(view: WebContentsView, url: string): void {
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
    canGoForward: history.canGoForward()
  }
}
