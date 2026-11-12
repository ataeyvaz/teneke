import { app, session, type Session } from 'electron'
import { CONTENT_PARTITION, UI_PARTITION } from '@shared/constants'
import type { PermissionManager } from '../permissions/PermissionManager'
import { sanitizeUserAgent } from '../app/url-policy'

/**
 * Owns the Electron sessions. The browser UI and web content never share a
 * session (cookies, cache, storage, permissions are fully separate).
 * Incognito (in-memory partition) is added in Phase 3.
 */
export class SessionManager {
  private ui: Session | null = null
  private content: Session | null = null

  constructor(private readonly permissions: PermissionManager) {}

  /** Call once after app 'ready'. */
  init(): void {
    this.ui = session.fromPartition(UI_PARTITION)
    this.content = session.fromPartition(CONTENT_PARTITION)

    for (const ses of [this.ui, this.content]) {
      this.permissions.apply(ses)
    }

    // Present ourselves as a regular Chromium browser to websites.
    this.content.setUserAgent(sanitizeUserAgent(this.content.getUserAgent(), app.getName()))
  }

  get uiSession(): Session {
    if (!this.ui) throw new Error('SessionManager.init() has not been called')
    return this.ui
  }

  get contentSession(): Session {
    if (!this.content) throw new Error('SessionManager.init() has not been called')
    return this.content
  }
}
