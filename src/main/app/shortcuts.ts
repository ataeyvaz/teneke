import type { Input, WebContents } from 'electron'

/** Browser actions reachable by keyboard, whichever view has the focus. */
export type ShortcutAction =
  'back' | 'forward' | 'reload' | 'reloadIgnoringCache' | 'stop' | 'focusAddress'

/** The parts of Electron's keyboard Input we look at (keeps this testable). */
export type ShortcutInput = Pick<Input, 'type' | 'key' | 'control' | 'alt' | 'shift' | 'meta'>

/** Maps a key press to a browser action, or null if it is not one of ours. */
export function shortcutOf(input: ShortcutInput): ShortcutAction | null {
  if (input.type !== 'keyDown' || input.meta) return null
  const key = input.key.toLowerCase()

  if (input.alt && !input.control && !input.shift) {
    if (key === 'arrowleft') return 'back'
    if (key === 'arrowright') return 'forward'
    if (key === 'd') return 'focusAddress'
    return null
  }
  if (input.alt) return null

  if (input.control) {
    if (key === 'r' || key === 'f5')
      return input.shift || key === 'f5' ? 'reloadIgnoringCache' : 'reload'
    if (key === 'l' && !input.shift) return 'focusAddress'
    return null
  }

  if (input.shift) return null
  if (key === 'f5') return 'reload'
  if (key === 'f6') return 'focusAddress'
  if (key === 'escape') return 'stop'
  return null
}

/**
 * Handles shortcuts for a view before the page sees the key. Keys that are not
 * ours pass through untouched. Esc only counts while a page is loading, so
 * pages (and fullscreen exit) keep their own Esc behaviour otherwise.
 */
export function attachShortcuts(
  contents: WebContents,
  run: (action: ShortcutAction) => void
): void {
  contents.on('before-input-event', (event, input) => {
    const action = shortcutOf(input)
    if (!action) return
    if (action === 'stop' && !contents.isLoading()) return
    event.preventDefault()
    run(action)
  })
}
