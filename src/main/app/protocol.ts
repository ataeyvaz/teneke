import { readFile } from 'node:fs/promises'
import { protocol, type Session } from 'electron'
import { APP_SCHEME } from '@shared/constants'
import { mimeTypeFor, resolveAppAssetPath } from './app-path'
import { UI_CSP_PRODUCTION } from './csp'

/**
 * Must run before app 'ready'. Makes app:// behave like a secure, standard
 * origin so 'self' in the CSP and relative asset URLs work.
 */
export function registerAppSchemePrivileges(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true }
    }
  ])
}

/**
 * Serves the built UI (out/renderer) on app://ui/ for the given session only,
 * with a strict CSP header and no directory listing or path traversal.
 */
export function registerAppProtocol(ses: Session, rendererDir: string): void {
  ses.protocol.handle(APP_SCHEME, async (request) => {
    const filePath = resolveAppAssetPath(request.url, rendererDir)
    if (!filePath) {
      console.warn('[protocol] Rejected app:// request:', request.url)
      return new Response('Not found', { status: 404 })
    }
    try {
      const body = await readFile(filePath)
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': mimeTypeFor(filePath),
          'Content-Security-Policy': UI_CSP_PRODUCTION,
          'X-Content-Type-Options': 'nosniff'
        }
      })
    } catch (error: unknown) {
      console.warn('[protocol] Missing app:// asset:', request.url, error)
      return new Response('Not found', { status: 404 })
    }
  })
}
