import { join } from 'node:path'
import { BaseWindow, Menu, WebContentsView } from 'electron'
import { DEFAULT_HOMEPAGE, TOOLBAR_HEIGHT } from '@shared/constants'
import { IpcChannel, type TabState } from '@shared/ipc'
import type { IpcRouter } from '../ipc/IpcRouter'
import type { SessionManager } from '../sessions/SessionManager'
import { TabManager } from '../tabs/TabManager'
import { buildContextMenu } from './context-menu'
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
  // Right-click in the address bar: cut / copy / paste / select all.
  uiView.webContents.on('context-menu', (_event, params) => {
    if (!params.isEditable || win.isDestroyed()) return
    const noop = (): void => undefined
    Menu.buildFromTemplate(
      buildContextMenu(params, {
        canGoBack: false,
        canGoForward: false,
        goBack: noop,
        goForward: noop,
        reload: noop,
        copyText: noop,
        saveImage: noop
      })
    ).popup({ window: win })
  })
  win.contentView.addChildView(uiView)

  const sendTabState = (state: TabState): void => {
    if (win.isDestroyed()) return
    win.setTitle(state.title.trim() !== '' ? `${state.title.trim()} — Teneke` : 'Teneke')
    if (!uiView.webContents.isDestroyed()) uiView.webContents.send(IpcChannel.tabState, state)
  }
  // HTML fullscreen (video players, games): the page covers the whole screen
  // and the toolbar is hidden. Esc (handled by Chromium) leaves it again.
  let htmlFullscreen = false
  const setHtmlFullscreen = (fullscreen: boolean): void => {
    if (win.isDestroyed() || htmlFullscreen === fullscreen) return
    htmlFullscreen = fullscreen
    uiView.setVisible(!fullscreen)
    win.setFullScreen(fullscreen)
    layout()
  }

  const tabs = new TabManager(win, sessions.contentSession, sendTabState, setHtmlFullscreen, () => {
    layout()
  })
  ipc.attach(uiView.webContents, tabs)

  const layout = (): void => {
    const { width, height } = win.getContentBounds()
    if (htmlFullscreen) {
      tabs.setBounds({ x: 0, y: 0, width, height })
      return
    }
    // While a page failed to load, the UI view covers the whole window and
    // draws the error page below the toolbar (the tab view is hidden).
    const uiHeight = tabs.activeHasError() ? height : TOOLBAR_HEIGHT
    uiView.setBounds({ x: 0, y: 0, width, height: uiHeight })
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
  // Closing the window first closes the tabs (giving pages their beforeunload
  // chance); the window itself only closes once every tab agreed.
  let tabsClosed = false
  win.on('close', (event) => {
    if (tabsClosed) return
    event.preventDefault()
    tabs.requestCloseAll(() => {
      tabsClosed = true
      if (!win.isDestroyed()) win.close()
    })
  })

  win.on('closed', () => {
    tabs.destroyAll()
    if (!uiView.webContents.isDestroyed()) uiView.webContents.close()
  })

  return win
}
