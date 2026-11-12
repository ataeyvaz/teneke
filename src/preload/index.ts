import { contextBridge } from 'electron'

/**
 * Narrow, typed API exposed to the browser UI only.
 * Never expose ipcRenderer itself. Real functions are added in Phase 1, step 4.
 */
const api = {
  platform: process.platform
} as const

export type TenekeApi = typeof api

contextBridge.exposeInMainWorld('teneke', api)
