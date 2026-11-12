/** Pure helpers for what the toolbar shows. Unit tested. */

export type Security = 'secure' | 'insecure' | 'none'

function parse(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

/** Connection state shown next to the address: https = secure, http = not secure. */
export function securityOf(url: string): Security {
  const parsed = parse(url)
  if (!parsed) return 'none'
  if (parsed.protocol === 'https:') return 'secure'
  if (parsed.protocol === 'http:') return 'insecure'
  return 'none'
}

/** Short, readable form of a URL: no scheme, no trailing slash on bare hosts. */
export function formatDisplayUrl(url: string): string {
  const parsed = parse(url)
  if (!parsed || (parsed.protocol !== 'https:' && parsed.protocol !== 'http:')) return url
  const rest = `${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`
  return rest.endsWith('/') && parsed.pathname === '/' && !parsed.search && !parsed.hash
    ? rest.slice(0, -1)
    : rest
}

/** Text shown in the address bar while the user is NOT typing. */
export function addressBarLabel(url: string, title: string): string {
  const trimmedTitle = title.trim()
  return trimmedTitle !== '' ? trimmedTitle : formatDisplayUrl(url)
}

/** Window title: "Page title — Teneke". */
export function windowTitle(title: string): string {
  const trimmedTitle = title.trim()
  return trimmedTitle !== '' ? `${trimmedTitle} — Teneke` : 'Teneke'
}
