import { join } from 'node:path'
import { BaseWindow, WebContentsView } from 'electron'
import { DEFAULT_HOMEPAGE, TOOLBAR_HEIGHT } from '@shared/constants'
import { IpcChannel, type TabState } from '@shared/ipc'
import type { IpcRouter } from '../ipc/IpcRouter'
import type { SessionManager } from '../sessions/SessionManager'
import { TabManager } from '../tabs/TabManager'
import { guardUiNavigation } from './navigation-guard'
import { uiWebPreferences } from './web-preferences'

export interface UiSource {
  /** URL the UI is loaded from (app://ui/index.html or the Vite dev server). */
  url: string
  /** Origin the UI view is pinned to. */
  origin: string
  isDev: boolean
}

/**
 * Main browser window: a BaseWindow holding two kinds of isolated views.
 *  - one UI view (toolbar strip at the top, our own React app, own session)
 *  - web content views (sites, managed by TabManager, separate session)
 * Web content never runs in the UI renderer (CLAUDE.md section 4).
 */
export function createMainWindow(
  sessions: SessionManager,
  ipc: IpcRouter,
  ui: UiSource
): BaseWindow {
  const win = new BaseWindow({
    width: 1280,
    height: 800,
    minWidth: 480,
    minHeight: 360,
    show: false,
    title: 'Teneke',
    backgroundColor: '#171717'
  })

  const uiView = new WebContentsView({
    webPreferences: {
      ...uiWebPreferences({ preloadPath: join(__dirname, '../preload/index.js'), isDev: ui.isDev }),
      session: sessions.uiSession
    }
  })
  uiView.setBackgroundColor('#171717')
  guardUiNavigation(uiView.webContents, ui.origin)
  win.contentView.addChildView(uiView)

  const sendTabState = (state: TabState): void => {
    if (win.isDestroyed()) return
    win.setTitle(state.title.trim() !== '' ? `${state.title.trim()} — Teneke` : 'Teneke')
    if (!uiView.webContents.isDestroyed()) uiView.webContents.send(IpcChannel.tabState, state)
  }
  const tabs = new TabManager(win, sessions.contentSession, sendTabState)
  ipc.attach(uiView.webContents, tabs)

  const layout = (): void => {
    const { width, height } = win.getContentBounds()
    uiView.setBounds({ x: 0, y: 0, width, height: TOOLBAR_HEIGHT })
    tabs.setBounds({
      x: 0,
      y: TOOLBAR_HEIGHT,
      width,
      height: Math.max(0, height - TOOLBAR_HEIGHT)
    })
  }
  layout()
  win.on('resize', layout)

  uiView.webContents.once('did-finish-load', () => {
    win.show()
  })
  // The UI may (re)load after the first tab already reported its state.
  uiView.webContents.on('did-finish-load', () => {
    const state = tabs.activeState()
    if (state) sendTabState(state)
  })
  uiView.webContents.on('render-process-gone', (_event, details) => {
    console.error('[window] UI renderer gone:', details.reason)
  })
  uiView.webContents.loadURL(ui.url).catch((error: unknown) => {
    // The window may already be closed (load aborted); never touch it then.
    if (win.isDestroyed()) return
    console.error('[window] Failed to load browser UI:', error)
    win.show()
  })

  tabs.openTab(DEFAULT_HOMEPAGE)

  // WebContentsViews are not destroyed with their window; close them explicitly.
  win.on('closed', () => {
    tabs.destroyAll()
    if (!uiView.webContents.isDestroyed()) uiView.webContents.close()
  })

  return win
}
