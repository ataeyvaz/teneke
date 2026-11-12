/**
 * IPC contract between the browser UI (via preload) and the main process.
 * Types and channel names only: no runtime dependencies, so the sandboxed
 * preload can bundle it. Validation lives in src/main/ipc (zod).
 */

export const IpcChannel = {
  navigate: 'nav:navigate',
  back: 'nav:back',
  forward: 'nav:forward',
  reload: 'nav:reload',
  stop: 'nav:stop',
  tabState: 'tab:state',
  /** main -> UI: focus and select the address bar (Ctrl+L, F6, Alt+D). */
  focusAddress: 'ui:focus-address'
} as const

/** Upper bound for anything typed into the address bar. */
export const MAX_ADDRESS_INPUT_LENGTH = 2048

/** Why the main page of a tab failed to load (Chromium net error). */
export interface TabLoadError {
  /** Chromium net error code, e.g. -105. */
  code: number
  /** Chromium error name, e.g. "ERR_NAME_NOT_RESOLVED". */
  description: string
  /** The address that failed (shown to the user). */
  url: string
}

/** State of the active tab, pushed from main to the UI. */
export interface TabState {
  id: number
  url: string
  title: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  /** Set while the page failed to load; the UI then shows an error page. */
  error: TabLoadError | null
}
