import { describe, expect, it } from 'vitest'
import {
  classifyWebNavigation,
  isSafeExternalUrl,
  isSameOrigin,
  buildUserAgents
} from '../../src/main/app/url-policy'

describe('classifyWebNavigation', () => {
  it.each(['https://example.com', 'http://example.com/path?q=1', 'about:blank'])(
    'allows %s',
    (url) => {
      expect(classifyWebNavigation(url)).toBe('allow')
    }
  )

  it('sends mailto to the OS', () => {
    expect(classifyWebNavigation('mailto:someone@example.com')).toBe('external')
  })

  it.each([
    'file:///C:/Windows/System32/calc.exe',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'app://ui/index.html',
    'ms-settings:privacy',
    'chrome://settings',
    'vbscript:msgbox(1)',
    'tel:+905555555555',
    'not a url',
    ''
  ])('blocks %s', (url) => {
    expect(classifyWebNavigation(url)).toBe('block')
  })
})

describe('isSafeExternalUrl', () => {
  it.each(['https://example.com', 'http://example.com', 'mailto:a@b.com'])('accepts %s', (url) => {
    expect(isSafeExternalUrl(url)).toBe(true)
  })

  it.each([
    'file:///etc/passwd',
    'javascript:alert(1)',
    'smb://attacker/share',
    'ms-msdt:/id',
    'https://user:pass@example.com',
    'mailto:',
    'garbage'
  ])('rejects %s', (url) => {
    expect(isSafeExternalUrl(url)).toBe(false)
  })
})

describe('isSameOrigin', () => {
  it('matches the custom UI origin', () => {
    expect(isSameOrigin('app://ui/index.html', 'app://ui')).toBe(true)
    expect(isSameOrigin('app://ui/assets/x.js', 'app://ui')).toBe(true)
  })

  it('matches the dev server origin including the port', () => {
    expect(isSameOrigin('http://localhost:5173/src/main.tsx', 'http://localhost:5173')).toBe(true)
    expect(isSameOrigin('http://localhost:9999/', 'http://localhost:5173')).toBe(false)
  })

  it('rejects other origins and schemes', () => {
    expect(isSameOrigin('app://evil/index.html', 'app://ui')).toBe(false)
    expect(isSameOrigin('https://ui/index.html', 'app://ui')).toBe(false)
    expect(isSameOrigin('file:///C:/index.html', 'app://ui')).toBe(false)
    expect(isSameOrigin('not a url', 'app://ui')).toBe(false)
  })
})

describe('buildUserAgents', () => {
  const native =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) teneke/0.1.0 Chrome/156.0.8078.96 Electron/45.3.1 Safari/537.36'
  const chromeForm =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'

  it('own identity = reduced Chromium form + our product token (like Edge)', () => {
    expect(buildUserAgents(native, 'teneke', '0.1.0')).toEqual({
      own: `${chromeForm} Teneke/0.1.0`,
      chromeForm
    })
  })

  it('never contains the Electron token', () => {
    const agents = buildUserAgents(native, 'teneke', '1.2.3')
    expect(agents.own).not.toMatch(/Electron/)
    expect(agents.chromeForm).not.toMatch(/Electron|teneke/i)
  })
})
