/**
 * Permission decisions. Pure, no Electron imports.
 *
 * Default: DENY (CLAUDE.md section 5). The only exceptions are permissions
 * that Chrome also grants without asking, that need a user gesture and that
 * the user can always leave with Esc / that are write-only. Approved by the
 * project owner on 2026-11-12 (see SUREC.md "Karar Günlüğü").
 * Phase 3 adds a prompt UI and per-site storage for everything else.
 */

export interface PermissionQuery {
  permission: string
  requestingOrigin: string
}

/** Granted to websites without a prompt. Never extend without owner approval. */
export const AUTO_GRANTED_PERMISSIONS: ReadonlySet<string> = new Set([
  'fullscreen', // video players; user gesture required, Esc exits
  'clipboard-sanitized-write', // "Copy" buttons; write-only, reading stays denied
  'pointerLock' // games; user gesture required, Esc exits
])

function isWebOrigin(origin: string): boolean {
  try {
    const { protocol } = new URL(origin)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

export function decidePermission({ permission, requestingOrigin }: PermissionQuery): boolean {
  return AUTO_GRANTED_PERMISSIONS.has(permission) && isWebOrigin(requestingOrigin)
}
