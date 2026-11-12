import { WebContentsView, type BaseWindow, type Rectangle, type Session } from 'electron'
import { contentWebPreferences } from '../app/web-preferences'
import { guardWebContentNavigation } from '../app/navigation-guard'

interface Tab {
  id: number
  view: WebContentsView
}

/**
 * Owns the web content views. Phase 1 keeps a single tab; Phase 3 adds
 * multiple tabs, switching and shortcuts on top of this same structure.
 */
export class TabManager {
  private tabs: Tab[] = []
  private activeTabId: number | null = null
  private nextId = 1
  private contentBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }

  constructor(
    private readonly window: BaseWindow,
    private readonly contentSession: Session
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

    view.webContents.on('render-process-gone', (_event, details) => {
      console.error(`[tabs] Renderer of tab ${String(tab.id)} gone:`, details.reason)
    })

    this.tabs.push(tab)
    this.window.contentView.addChildView(view)
    this.activate(tab.id)
    this.load(view, url)
    return tab.id
  }

  /** Loads `url` in the active tab (navigation rules still apply). */
  navigateActive(url: string): void {
    const tab = this.activeTab()
    if (tab) this.load(tab.view, url)
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
  }

  private activeTab(): Tab | undefined {
    return this.tabs.find((tab) => tab.id === this.activeTabId)
  }

  private load(view: WebContentsView, url: string): void {
    view.webContents.loadURL(url).catch((error: unknown) => {
      // Aborted loads (user navigated again, blocked redirect) also reject; log only.
      console.warn('[tabs] Load did not complete:', url, error)
    })
  }
}
