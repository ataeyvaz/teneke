import { extname, isAbsolute, join, normalize, relative } from 'node:path'
import { APP_SCHEME, UI_HOST } from '@shared/constants'

/**
 * Maps an app://ui/... request URL to a file inside `rootDir`.
 * Returns null for any request that is malformed, targets another host, or
 * would escape the root directory (path traversal). Pure: unit tested.
 */
export function resolveAppAssetPath(requestUrl: string, rootDir: string): string | null {
  let url: URL
  try {
    url = new URL(requestUrl)
  } catch {
    return null
  }
  if (url.protocol !== `${APP_SCHEME}:` || url.host !== UI_HOST) return null

  let pathname: string
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    return null
  }
  if (pathname.includes('\0') || pathname.includes('\\')) return null

  const relativePath = pathname === '/' || pathname === '' ? 'index.html' : pathname.slice(1)
  const root = normalize(rootDir)
  const target = normalize(join(root, relativePath))
  const rel = relative(root, target)
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return null
  return target
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
}

/** Content type for a served file; unknown types are sent as opaque bytes. */
export function mimeTypeFor(filePath: string): string {
  return MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}
