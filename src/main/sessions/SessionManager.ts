import { app, session, type Session, type WebContents } from 'electron'
import { CONTENT_PARTITION, UI_PARTITION } from '@shared/constants'
import type { PermissionManager } from '../permissions/PermissionManager'
import { buildAcceptLanguages, buildUserAgents } from '../app/url-policy'
import { userAgentFor, type UserAgents } from './site-identity'
import { buildClientHintHeaders, installRequestHeaders, pageIdentitySchema } from './client-hints'

/**
 * Owns the Electron sessions. The browser UI and web content never share a
 * session (cookies, cache, storage, permissions are fully separate).
 * Incognito (in-memory partition) is added in Phase 3.
 */
export class SessionManager {
  private ui: Session | null = null
  private content: Session | null = null
  private clientHints: Promise<void> | null = null
  private agents: UserAgents = { own: '', chromeForm: '' }

  constructor(private readonly permissions: PermissionManager) {}

  /** Call once after app 'ready'. */
  init(): void {
    this.ui = session.fromPartition(UI_PARTITION)
    this.content = session.fromPartition(CONTENT_PARTITION)

    for (const ses of [this.ui, this.content]) {
      this.permissions.apply(ses)
    }

    // One identity everywhere: app.userAgentFallback also covers service and
    // shared workers, which session.setUserAgent alone misses (a page/worker
    // mismatch is what Cloudflare Turnstile rejects). See buildUserAgent().
    this.agents = buildUserAgents(app.userAgentFallback, app.getName(), app.getVersion())
    app.userAgentFallback = this.agents.own
    this.content.setUserAgent(this.agents.own)
  }

  /**
   * Makes the request headers agree with what pages see in JavaScript, using
   * our own (trusted) UI renderer as the source: Sec-CH-UA from
   * navigator.userAgentData.brands, Accept-Language from navigator.languages.
   * Runs once; failures are logged and only mean the defaults stay in place.
   */
  applyBrowserIdentity(uiContents: WebContents): Promise<void> {
    this.clientHints ??= uiContents
      .executeJavaScript(
        `({
          brands: navigator.userAgentData
            ? navigator.userAgentData.brands.map(({ brand, version }) => ({ brand, version }))
            : null,
          languages: [...navigator.languages]
        })`
      )
      .then((raw: unknown) => {
        const identity = pageIdentitySchema.safeParse(raw)
        if (!identity.success) {
          console.warn('[sessions] Unusable page identity; headers unchanged:', raw)
          return
        }
        this.contentSession.setUserAgent(
          this.agents.own,
          buildAcceptLanguages(identity.data.languages)
        )
        installRequestHeaders(
          this.contentSession,
          buildClientHintHeaders(identity.data.brands, process.platform),
          (url) => this.userAgentFor(url)
        )
      })
      .catch((error: unknown) => {
        console.warn('[sessions] Could not read the page identity:', error)
      })
    return this.clientHints
  }

  /** The user agent a site gets (see site-identity.ts). */
  userAgentFor(url: string): string {
    return userAgentFor(url, this.agents)
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
