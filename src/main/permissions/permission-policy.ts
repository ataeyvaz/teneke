/**
 * Permission decisions. Pure, no Electron imports.
 *
 * Phase 1: every permission is DENIED by default (CLAUDE.md section 5).
 * Phase 3 adds a prompt UI and per-site storage; this module is where the
 * stored decision will be looked up.
 */

export interface PermissionQuery {
  permission: string
  requestingOrigin: string
}

export function decidePermission(_query: PermissionQuery): boolean {
  return false
}
