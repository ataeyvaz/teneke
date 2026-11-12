/**
 * Pure URL rules for navigation and external links. No Electron imports, so
 * everything here is unit tested.
 */

export type NavigationDecision = 'allow' | 'external' | 'block'

const WEB_PROTOCOLS = new Set(['http:', 'https:'])
const EXTERNAL_PROTOCOLS = new Set(['mailto:'])

function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

/**
 * Decides what to do when web content tries to navigate (link click, redirect,
 * window.open). Only http(s) and about:blank are loaded in a tab; mailto: goes
 * to the OS mail client; everything else (file:, javascript:, data:, custom
 * app protocols, ...) is blocked.
 */
export function classifyWebNavigation(raw: string): NavigationDecision {
  if (raw === 'about:blank') return 'allow'
  const url = parseUrl(raw)
  if (!url) return 'block'
  if (WEB_PROTOCOLS.has(url.protocol)) return url.hostname ? 'allow' : 'block'
  if (isSafeExternalUrl(raw)) return 'external'
  return 'block'
}

/**
 * The only URLs allowed to reach shell.openExternal (CLAUDE.md section 5):
 * well-formed http/https with a host, or mailto. No embedded credentials.
 */
export function isSafeExternalUrl(raw: string): boolean {
  const url = parseUrl(raw)
  if (!url) return false
  if (url.username || url.password) return false
  if (WEB_PROTOCOLS.has(url.protocol)) return url.hostname.length > 0
  if (EXTERNAL_PROTOCOLS.has(url.protocol)) return url.pathname.length > 0
  return false
}

/**
 * True when `raw` has the same scheme and host (incl. port) as `allowedOrigin`.
 * Compared by parts because URL.origin is "null" for custom schemes like app://.
 */
export function isSameOrigin(raw: string, allowedOrigin: string): boolean {
  const url = parseUrl(raw)
  const allowed = parseUrl(allowedOrigin)
  if (!url || !allowed || allowed.host === '') return false
  return url.protocol === allowed.protocol && url.host === allowed.host
}

/**
 * Removes the "Electron/x.y.z" and app name tokens from the default user agent
 * so sites treat us as a regular Chromium browser (Google sign-in and others
 * block embedded-browser user agents).
 */
export function sanitizeUserAgent(userAgent: string, appName: string): string {
  const escaped = appName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return userAgent
    .replace(/\sElectron\/\S+/g, '')
    .replace(new RegExp(`\\s${escaped}/\\S+`, 'gi'), '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
