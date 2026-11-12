/**
 * Runs a preload API call from an event handler. IPC calls can be rejected by
 * the main process (validation, sender checks); those errors are logged, never
 * swallowed or left as unhandled rejections.
 */
export function run(action: string, call: Promise<void>): void {
  call.catch((error: unknown) => {
    console.error(`[ui] ${action} failed:`, error)
  })
}
