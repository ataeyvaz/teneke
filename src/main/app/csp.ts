/**
 * Content-Security-Policy for the browser UI (CLAUDE.md section 5).
 * Sent as an HTTP header by the app:// protocol handler (production) or
 * injected into dev-server responses (development). Never contains
 * 'unsafe-eval' or remote sources.
 */

const BASE_DIRECTIVES: Record<string, string> = {
  'default-src': "'none'",
  'script-src': "'self'",
  'style-src': "'self'",
  'img-src': "'self' data:",
  'font-src': "'self'",
  'connect-src': "'none'",
  'object-src': "'none'",
  'base-uri': "'none'",
  'form-action': "'none'",
  'frame-src': "'none'",
  'frame-ancestors': "'none'"
}

function serialize(directives: Record<string, string>): string {
  return Object.entries(directives)
    .map(([name, value]) => `${name} ${value}`)
    .join('; ')
}

/** Strict policy used for the packaged / production UI. */
export const UI_CSP_PRODUCTION = serialize(BASE_DIRECTIVES)

/**
 * Development only: Vite's dev server needs an inline React Fast Refresh
 * preamble, injected <style> tags and a WebSocket for hot reload.
 * Still no 'unsafe-eval' and no remote origins.
 */
export function buildDevCsp(devServerOrigin: string): string {
  const wsOrigin = devServerOrigin.replace(/^http/, 'ws')
  return serialize({
    ...BASE_DIRECTIVES,
    'script-src': "'self' 'unsafe-inline'",
    'style-src': "'self' 'unsafe-inline'",
    'connect-src': `'self' ${wsOrigin}`
  })
}
