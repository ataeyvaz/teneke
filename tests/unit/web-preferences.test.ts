import { describe, expect, it } from 'vitest'
import { contentWebPreferences, uiWebPreferences } from '../../src/main/app/web-preferences'
import { decidePermission } from '../../src/main/permissions/permission-policy'

// CLAUDE.md section 5: these values must never change.
const REQUIRED = {
  nodeIntegration: false,
  nodeIntegrationInSubFrames: false,
  nodeIntegrationInWorker: false,
  contextIsolation: true,
  sandbox: true,
  webSecurity: true,
  allowRunningInsecureContent: false,
  experimentalFeatures: false,
  webviewTag: false
}

describe('web content preferences', () => {
  const prefs = contentWebPreferences()

  it('has every required isolation setting', () => {
    expect(prefs).toMatchObject(REQUIRED)
  })

  it('never gets a preload script', () => {
    expect(prefs.preload).toBeUndefined()
  })
})

describe('browser UI preferences', () => {
  it('has every required isolation setting and the given preload', () => {
    const prefs = uiWebPreferences({ preloadPath: '/x/preload.js', isDev: false })
    expect(prefs).toMatchObject(REQUIRED)
    expect(prefs.preload).toBe('/x/preload.js')
  })

  it('disables DevTools in production and allows them in development', () => {
    expect(uiWebPreferences({ preloadPath: 'p', isDev: false }).devTools).toBe(false)
    expect(uiWebPreferences({ preloadPath: 'p', isDev: true }).devTools).toBe(true)
  })
})

describe('permission policy', () => {
  it.each([
    'media',
    'geolocation',
    'notifications',
    'clipboard-read',
    'openExternal',
    'usb',
    'hid',
    'serial',
    'display-capture',
    'midiSysex',
    'keyboardLock',
    'window-management',
    'unknown',
    ''
  ])('denies %s by default', (permission) => {
    expect(decidePermission({ permission, requestingOrigin: 'https://example.com' })).toBe(false)
  })

  it.each(['fullscreen', 'clipboard-sanitized-write', 'pointerLock'])(
    'grants low-risk %s to websites (owner-approved exception)',
    (permission) => {
      expect(decidePermission({ permission, requestingOrigin: 'https://example.com' })).toBe(true)
      expect(decidePermission({ permission, requestingOrigin: 'http://127.0.0.1:8080' })).toBe(true)
    }
  )

  it.each(['app://ui', 'file:///C:/', 'chrome://settings', 'null', ''])(
    'never grants exceptions to non-web origin %s',
    (requestingOrigin) => {
      expect(decidePermission({ permission: 'fullscreen', requestingOrigin })).toBe(false)
    }
  )
})
