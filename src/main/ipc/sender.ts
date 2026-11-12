import { isSameOrigin } from '../app/url-policy'

/** What we know about the sender of an IPC message. */
export interface SenderInfo {
  /** webContents id of the sender, or null if unknown. */
  webContentsId: number | null
  /** URL of the sending frame, or null if the frame is gone. */
  frameUrl: string | null
  /** True when the sending frame is the top-level frame (not an iframe). */
  isMainFrame: boolean
}

/**
 * CLAUDE.md section 5: only our own browser UI may talk to the main process.
 * Accepts a message only if it comes from a registered UI view, from its top
 * frame, and from the UI origin (app://ui or the dev server). Pure: unit tested.
 */
export function isTrustedSender(
  sender: SenderInfo,
  trustedWebContentsIds: ReadonlySet<number>,
  uiOrigin: string
): boolean {
  if (sender.webContentsId === null || !trustedWebContentsIds.has(sender.webContentsId)) {
    return false
  }
  if (!sender.isMainFrame || sender.frameUrl === null) return false
  return isSameOrigin(sender.frameUrl, uiOrigin)
}
