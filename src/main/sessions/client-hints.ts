import type { Session } from 'electron'
import { z } from 'zod'

/**
 * Browser identity consistency (Phase 2, option 1, approved 2026-11-12).
 *
 * Electron exposes `navigator.userAgentData` to pages but never sends the
 * matching low-entropy `Sec-CH-UA*` request headers that every Chromium
 * browser sends. That mismatch looks like an embedded browser or a bot to
 * Google sign-in and Cloudflare. We send exactly what the page itself reports
 * (the "Chromium" brand list, never "Google Chrome"): no impersonation.
 */

export const brandListSchema = z
  .array(z.object({ brand: z.string().min(1).max(64), version: z.string().regex(/^\d{1,4}$/) }))
  .min(1)
  .max(5)

export type BrandList = z.infer<typeof brandListSchema>

/** What our UI renderer reports about itself (see SessionManager). */
export const pageIdentitySchema = z.object({
  brands: brandListSchema,
  languages: z.array(z.string().max(35)).min(1).max(20)
})

/** Structured-header form used by Chromium: `"Brand";v="1", "Other";v="2"`. */
export function formatBrandHeader(brands: BrandList): string {
  return brands
    .map(({ brand, version }) => `"${brand.replace(/["\\]/g, '')}";v="${version}"`)
    .join(', ')
}

/** Value of Sec-CH-UA-Platform for a Node.js platform name. */
export function platformHint(platform: NodeJS.Platform): string {
  const names: Partial<Record<NodeJS.Platform, string>> = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux'
  }
  return `"${names[platform] ?? 'Unknown'}"`
}

/** The three hints Chromium sends by default on every secure request. */
export function buildClientHintHeaders(
  brands: BrandList,
  platform: NodeJS.Platform
): Record<string, string> {
  return {
    'sec-ch-ua': formatBrandHeader(brands),
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': platformHint(platform)
  }
}

/** Chromium only sends client hints to potentially trustworthy origins. */
export function isTrustworthyUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol === 'https:' || protocol === 'wss:') return true
    if (protocol !== 'http:' && protocol !== 'ws:') return false
    return (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '[::1]' ||
      /^127(?:\.\d{1,3}){3}$/.test(hostname)
    )
  } catch {
    return false
  }
}

/** Adds the hints to a request unless Chromium already set them itself. */
export function withClientHints(
  url: string,
  requestHeaders: Record<string, string>,
  hints: Record<string, string>
): Record<string, string> {
  if (!isTrustworthyUrl(url)) return requestHeaders
  const present = new Set(Object.keys(requestHeaders).map((name) => name.toLowerCase()))
  const result = { ...requestHeaders }
  for (const [name, value] of Object.entries(hints)) {
    if (!present.has(name)) result[name] = value
  }
  return result
}

/**
 * Installs the header hook on a session: client hints + per-site user agent. Note: Electron allows one
 * onBeforeSendHeaders listener per session; a later feature that needs this
 * hook (e.g. the ad blocker in Phase 4) must be chained through here.
 */
export function installRequestHeaders(
  ses: Session,
  hints: Record<string, string>,
  userAgentFor: (url: string) => string
): void {
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = withClientHints(details.url, details.requestHeaders, hints)
    // Per-site identity (site-identity.ts) for every request to that site,
    // including ones from its service workers.
    headers['User-Agent'] = userAgentFor(details.url)
    callback({ requestHeaders: headers })
  })
}
