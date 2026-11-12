import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'

/** Tiny local website so tests never depend on the internet. */
export interface TestSite {
  origin: string
  close: () => Promise<void>
}

const PAGES: Record<string, { title: string; body: string }> = {
  '/': { title: 'Teneke Test Page', body: '<h1>first</h1>' },
  '/second': { title: 'Second Page', body: '<h1>second</h1>' },
  '/unsaved': {
    title: 'Unsaved',
    body: `<script>addEventListener('beforeunload', (e) => { e.preventDefault(); e.returnValue = '' })</script>
      <input id="field"><p>has unsaved changes</p>`
  },
  // Buttons give Chromium a real user gesture (required by these permissions).
  '/permissions': {
    title: 'Permissions',
    body: `
      <button id="copy">copy</button><button id="read">read</button>
      <button id="fullscreen">fullscreen</button><button id="lock">lock</button>
      <script>
        const done = (key) => (value) => { window[key] = value }
        document.getElementById('copy').onclick = () =>
          navigator.clipboard.writeText('teneke-e2e').then(() => 'ok', (e) => 'error:' + e.name).then(done('copy'))
        document.getElementById('read').onclick = () =>
          navigator.clipboard.readText().then(() => 'ok', (e) => 'error:' + e.name).then(done('read'))
        document.getElementById('fullscreen').onclick = () =>
          document.documentElement.requestFullscreen().then(() => 'ok', (e) => 'error:' + e.name).then(done('fullscreen'))
        document.addEventListener('pointerlockchange', () => done('lock')(document.pointerLockElement ? 'ok' : 'released'))
        document.addEventListener('pointerlockerror', () => done('lock')('error'))
        document.getElementById('lock').onclick = () => document.body.requestPointerLock()
      </script>`
  }
}

export async function startTestSite(): Promise<TestSite> {
  const server: Server = createServer((req, res) => {
    const page = PAGES[req.url ?? '/']
    if (!page) {
      res.writeHead(404).end('not found')
      return
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`<!doctype html><title>${page.title}</title>${page.body}`)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${String(port)}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })
  }
}

/** Launches the built app (run `electron-vite build` first; `npm run test:e2e` does). */
export async function launchApp(): Promise<ElectronApplication> {
  return electron.launch({ args: ['.'], timeout: 20_000 })
}

/** Waits until a page matching `predicate` exists and returns it. */
async function findPage(
  app: ElectronApplication,
  predicate: (url: string) => boolean
): Promise<Page> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const page = app.windows().find((p) => predicate(p.url()))
    if (page) return page
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Expected page did not appear')
}

export function uiPage(app: ElectronApplication): Promise<Page> {
  return findPage(app, (url) => url.startsWith('app://ui/'))
}

/** The (single, Phase 1) web content tab. */
export function contentPage(app: ElectronApplication): Promise<Page> {
  return findPage(app, (url) => url !== '' && !url.startsWith('app://'))
}

/**
 * URL of the web content tab as the main process sees it (source of truth).
 * Playwright's own page URL can read "" after a navigation was blocked.
 */
export function tabUrl(app: ElectronApplication): Promise<string> {
  return app.evaluate(({ webContents }) => {
    const tab = webContents.getAllWebContents().find((w) => !w.getURL().startsWith('app://'))
    return tab?.getURL() ?? ''
  })
}

/** Types into the address bar like a user and presses Enter. */
export async function typeAddress(ui: Page, text: string): Promise<void> {
  const input = ui.getByLabel('Adres çubuğu')
  await input.click()
  await input.fill(text)
  await input.press('Enter')
}
