import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'

/**
 * Creates the main browser window that hosts the browser UI.
 *
 * NOTE (Phase 1, step 1): temporary scaffold. Step 3 replaces it with the final
 * architecture (separate WebContentsView for web content, app:// protocol,
 * permission and navigation handlers). The UI is already fully isolated.
 */
export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 480,
    minHeight: 360,
    show: false,
    title: 'Teneke',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      nodeIntegrationInSubFrames: false,
      nodeIntegrationInWorker: false,
      webviewTag: false
    }
  })

  win.once('ready-to-show', () => win.show())

  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  const load =
    !app.isPackaged && devServerUrl
      ? win.loadURL(devServerUrl)
      : win.loadFile(join(__dirname, '../renderer/index.html'))

  load.catch((error: unknown) => {
    console.error('[window] Failed to load browser UI:', error)
  })

  return win
}
