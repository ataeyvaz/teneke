import { defineConfig } from '@playwright/test'

// End-to-end tests launch the built Electron app (run `npm run build` first;
// `npm run test:e2e` does this for you). One worker: RAM is limited on dev machines.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  workers: 1,
  retries: 0,
  reporter: [['list']]
})
