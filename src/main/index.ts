import { join } from 'node:path'
import { app, BaseWindow, Menu } from 'electron'
import { DEFAULT_SEARCH_TEMPLATE, UI_ORIGIN } from '@shared/constants'
import { buildDevCsp } from './app/csp'
import { registerAppProtocol, registerAppSchemePrivileges } from './app/protocol'
import { createMainWindow, type UiSource } from './app/window'
import { IpcRouter } from './ipc/IpcRouter'
import { PermissionManager } from './permissions/PermissionManager'
import { SessionManager } from './sessions/SessionManager'

// --- Must happen before 'ready' -------------------------------------------
// Every renderer is sandboxed, even if a view forgets to ask for it.
app.enableSandbox()
registerAppSchemePrivileges()

// Safety net for ANY web contents (including ones we did not create on purpose):
// no <webview> tags, no native pop-up windows. Views override the window
// open handler with their own (stricter or tab-opening) rules.
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => {
    event.preventDefault()
    console.warn('[security] Blocked <webview> attachment')
  })
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
})

// Certificate errors are NOT overridden: without preventDefault Electron
// rejects the connection. We only log it. (Warning page: Phase 4.)
// Electronegativity CERTIFICATE_ERROR_EVENT_JS_CHECK: reviewed - nothing is trusted here.
app.on('certificate-error', (_event, _contents, url, error) => {
  console.warn(`[security] Certificate error for ${url}: ${error}`)
})

const sessions = new SessionManager(new PermissionManager())

function resolveUiSource(): UiSource {
  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (!app.isPackaged && devServerUrl) {
    return { url: devServerUrl, origin: new URL(devServerUrl).origin, isDev: true }
  }
  return { url: `${UI_ORIGIN}/index.html`, origin: UI_ORIGIN, isDev: false }
}

function prepareUiSession(ui: UiSource): void {
  if (ui.isDev) {
    // Dev server responses get the (slightly relaxed) dev CSP as a header.
    // Electronegativity CSP_GLOBAL_CHECK: reviewed - dev server only; packaged builds
    // use UI_CSP_PRODUCTION (no inline, no eval). See tests/unit/csp.test.ts.
    const csp = buildDevCsp(ui.origin)
    sessions.uiSession.webRequest.onHeadersReceived(
      { urls: [`${ui.origin}/*`] },
      (details, callback) => {
        callback({
          responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [csp] }
        })
      }
    )
  } else {
    registerAppProtocol(sessions.uiSession, join(__dirname, '../renderer'))
  }
}

// --- Single instance --------------------------------------------------------
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BaseWindow.getAllWindows()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app
    .whenReady()
    .then(() => {
      sessions.init()
      // No default Electron menu bar (File/Edit/View/Window): its shortcuts
      // (reload, DevTools) would bypass ours. macOS needs a menu for
      // copy/paste, so it gets its own one later (Phase 7).
      if (process.platform !== 'darwin') Menu.setApplicationMenu(null)
      const ui = resolveUiSource()
      prepareUiSession(ui)
      const ipc = new IpcRouter(ui.origin, DEFAULT_SEARCH_TEMPLATE)
      ipc.register()
      createMainWindow(sessions, ipc, ui)

      // macOS: re-create a window when the dock icon is clicked.
      app.on('activate', () => {
        if (BaseWindow.getAllWindows().length === 0) createMainWindow(sessions, ipc, ui)
      })
    })
    .catch((error: unknown) => {
      console.error('[app] Startup failed:', error)
      app.quit()
    })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
