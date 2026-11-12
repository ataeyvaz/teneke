import type { WebPreferences } from 'electron'

/**
 * Isolation settings shared by every renderer (CLAUDE.md section 5).
 * These values are not negotiable and are asserted by unit tests.
 */
const ISOLATION = {
  nodeIntegration: false,
  nodeIntegrationInSubFrames: false,
  nodeIntegrationInWorker: false,
  contextIsolation: true,
  sandbox: true,
  webSecurity: true,
  allowRunningInsecureContent: false,
  experimentalFeatures: false,
  webviewTag: false,
  navigateOnDragDrop: false,
  safeDialogs: true
} as const satisfies WebPreferences

/**
 * Web content (sites). No preload, ever. The caller adds the `session`
 * (never shared with the UI).
 */
export function contentWebPreferences(): WebPreferences {
  return {
    ...ISOLATION,
    spellcheck: true
  }
}

/** Browser UI. Narrow preload only; DevTools only in development. */
export function uiWebPreferences(options: { preloadPath: string; isDev: boolean }): WebPreferences {
  return {
    ...ISOLATION,
    preload: options.preloadPath,
    devTools: options.isDev,
    spellcheck: false
  }
}
