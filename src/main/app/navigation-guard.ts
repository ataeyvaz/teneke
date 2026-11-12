import { shell, type WebContents } from 'electron'
import { classifyWebNavigation, isSafeExternalUrl, isSameOrigin } from './url-policy'

/** Opens a pre-validated URL in the OS (mail client, etc.). Never trusts input. */
export function openExternalSafely(url: string): void {
  if (!isSafeExternalUrl(url)) {
    console.warn('[navigation] Refused to open external URL:', url)
    return
  }
  shell.openExternal(url).catch((error: unknown) => {
    console.error('[navigation] openExternal failed:', url, error)
  })
}

/**
 * Web content: only http(s)/about:blank load in the tab, mailto: goes to the
 * OS, everything else is blocked. Pop-ups never create native windows; they
 * are handed to `onOpenRequest` (opened as a tab).
 */
export function guardWebContentNavigation(
  contents: WebContents,
  onOpenRequest: (url: string) => void
): void {
  const onNavigate = (event: Electron.Event, url: string): void => {
    const decision = classifyWebNavigation(url)
    if (decision === 'allow') return
    event.preventDefault()
    if (decision === 'external') openExternalSafely(url)
    else console.warn('[navigation] Blocked web navigation to:', url)
  }

  contents.on('will-navigate', onNavigate)
  contents.on('will-redirect', onNavigate)

  contents.setWindowOpenHandler(({ url }) => {
    const decision = classifyWebNavigation(url)
    if (decision === 'allow') onOpenRequest(url)
    else if (decision === 'external') openExternalSafely(url)
    else console.warn('[navigation] Blocked pop-up to:', url)
    return { action: 'deny' }
  })
}

/**
 * Browser UI: pinned to its own origin. It can never navigate away, open
 * windows, or be redirected (e.g. by a dropped file or a malicious link).
 */
export function guardUiNavigation(contents: WebContents, uiOrigin: string): void {
  const onNavigate = (event: Electron.Event, url: string): void => {
    if (isSameOrigin(url, uiOrigin)) return
    event.preventDefault()
    console.warn('[navigation] Blocked UI navigation to:', url)
  }
  contents.on('will-navigate', onNavigate)
  contents.on('will-redirect', onNavigate)
  contents.setWindowOpenHandler(({ url }) => {
    console.warn('[navigation] Blocked UI pop-up to:', url)
    return { action: 'deny' }
  })
}
