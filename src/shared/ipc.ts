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
  tabState: 'tab:state'
} as const

/** Upper bound for anything typed into the address bar. */
export const MAX_ADDRESS_INPUT_LENGTH = 2048

/** State of the active tab, pushed from main to the UI. */
export interface TabState {
  id: number
  url: string
  title: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
}
