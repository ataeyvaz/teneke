/**
 * Which user agent a site gets (decision 2026-11-12, tested by the owner).
 *
 * Default: Teneke's own identity, Chromium form plus a "Teneke/x" token, like
 * Microsoft Edge's "Edg/x". Google sign-in and Cloudflare accept it; they
 * reject a UA that is indistinguishable from stock Chrome but is not Chrome.
 *
 * A few sites only accept browsers they know by name and reject the unknown
 * token. Only those get the plain Chromium form (the same string without our
 * token). Keep this list short; every entry needs a reason.
 */
export const CHROME_FORM_HOSTS: readonly string[] = [
  // "WhatsApp works with Google Chrome 100+": rejects unknown browser tokens.
  'web.whatsapp.com'
]

export interface UserAgents {
  /** Default: "... Chrome/156.0.0.0 Safari/537.36 Teneke/0.1.0". */
  own: string
  /** Plain Chromium form for CHROME_FORM_HOSTS. */
  chromeForm: string
}

/** True if `url` is on one of the hosts (or their subdomains). */
export function isOnHosts(url: string, hosts: readonly string[]): boolean {
  let hostname: string
  try {
    hostname = new URL(url).hostname.toLowerCase()
  } catch {
    return false
  }
  return hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))
}

export function userAgentFor(url: string, agents: UserAgents): string {
  return isOnHosts(url, CHROME_FORM_HOSTS) ? agents.chromeForm : agents.own
}
