import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IpcChannel, type TabState } from '@shared/ipc'

/**
 * Narrow, typed API exposed to the browser UI only (never to websites:
 * web content views get no preload at all).
 *
 * Rules (CLAUDE.md section 5):
 *  - ipcRenderer itself is never exposed;
 *  - each function sends to exactly one fixed channel;
 *  - the main process re-validates the sender and every argument.
 */
function invoke(channel: string, ...args: unknown[]): Promise<void> {
  return ipcRenderer.invoke(channel, ...args).then(() => undefined)
}

const api = {
  platform: process.platform,

  /** Go to a URL or search for the text typed in the address bar. */
  navigate: (input: string): Promise<void> => invoke(IpcChannel.navigate, input),
  back: (): Promise<void> => invoke(IpcChannel.back),
  forward: (): Promise<void> => invoke(IpcChannel.forward),
  reload: (): Promise<void> => invoke(IpcChannel.reload),
  stop: (): Promise<void> => invoke(IpcChannel.stop),

  /** Subscribe to active tab updates. Returns an unsubscribe function. */
  onTabState: (listener: (state: TabState) => void): (() => void) => {
    // Strip the Electron event object: the UI only ever receives plain data.
    const handler = (_event: IpcRendererEvent, state: TabState): void => {
      listener(state)
    }
    ipcRenderer.on(IpcChannel.tabState, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannel.tabState, handler)
    }
  }
}

export type TenekeApi = typeof api

contextBridge.exposeInMainWorld('teneke', api)
