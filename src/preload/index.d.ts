import type { TenekeApi } from './index'

declare global {
  interface Window {
    teneke: TenekeApi
  }
}

export {}
