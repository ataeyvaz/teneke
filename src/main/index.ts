import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './app/window'

// Only one browser instance at a time; a second launch focuses the first window.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app
    .whenReady()
    .then(() => {
      createMainWindow()

      // macOS: re-create a window when the dock icon is clicked.
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
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
