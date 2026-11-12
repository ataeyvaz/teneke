import { defineConfig } from '@playwright/test'

// Real-website compatibility smoke test (needs internet). Not part of
// `npm run test:e2e`, which must stay offline and deterministic.
export default defineConfig({
  testDir: './tests/compat',
  timeout: 60_000,
  workers: 1,
  retries: 0,
  reporter: [['list']]
})
