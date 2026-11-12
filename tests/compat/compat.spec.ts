// Compatibility smoke test against real websites (needs internet).
// Run with: npm run test:compat   Report: test-results/compat/report.json (+ screenshots)
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { contentPage, launchApp, typeAddress, uiPage } from '../e2e/helpers'

const SITES = [
  'google.com',
  'youtube.com',
  'wikipedia.org',
  'github.com',
  'x.com',
  // Bare instagram.com times out in Chromium's network stack on the dev
  // machine (curl works); see SUREC.md "Bilinen Sorunlar".
  'www.instagram.com',
  'reddit.com',
  'amazon.com.tr',
  'trendyol.com',
  'hepsiburada.com',
  'sahibinden.com',
  'turkiye.gov.tr',
  'eksisozluk.com',
  'docs.google.com',
  'outlook.live.com',
  'web.whatsapp.com',
  'figma.com',
  'html5test.com'
]

const OUT_DIR = join('test-results', 'compat')

interface SiteResult {
  site: string
  finalUrl: string
  title: string
  httpStatus: number | null
  loadError: string | null
  crashed: boolean
  consoleErrors: number
  loadMs: number
}

const results: SiteResult[] = []
let app: ElectronApplication
let ui: Page
let content: Page

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  mkdirSync(OUT_DIR, { recursive: true })
  app = await launchApp()
  ui = await uiPage(app)
  content = await contentPage(app)
  // Record main-frame HTTP status and load failures in the main process.
  await app.evaluate(({ webContents }) => {
    const store = globalThis as unknown as {
      __compat: { status: number | null; error: string | null }
    }
    store.__compat = { status: null, error: null }
    const tab = webContents.getAllWebContents().find((w) => !w.getURL().startsWith('app://'))
    tab?.on('did-navigate', (_e, _url, code) => {
      store.__compat.status = code
    })
    tab?.on('did-fail-load', (_e, code, description, _url, isMainFrame) => {
      if (isMainFrame && code !== -3) store.__compat.error = `${String(code)} ${description}`
    })
  })
})

test.afterAll(async () => {
  writeFileSync(join(OUT_DIR, 'report.json'), JSON.stringify(results, null, 2))
  console.table(
    results.map((r) => ({
      site: r.site,
      status: r.httpStatus,
      title: r.title.slice(0, 40),
      error: r.loadError ?? '',
      crashed: r.crashed,
      consoleErrors: r.consoleErrors,
      seconds: (r.loadMs / 1000).toFixed(1)
    }))
  )
  // Never let a stuck shutdown hide the report; flag it instead.
  const started = Date.now()
  const closed = await Promise.race([
    app.close().then(() => true),
    new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(false)
      }, 20_000)
    })
  ])
  if (!closed) {
    console.warn('WARNING: app did not close within 20 s after the compat run; killing it.')
    const state = await Promise.race([
      app.evaluate(({ BaseWindow, webContents }) => ({
        windows: BaseWindow.getAllWindows().map((w) => ({
          visible: w.isVisible(),
          destroyed: w.isDestroyed()
        })),
        contents: webContents.getAllWebContents().map((w) => ({
          type: w.getType(),
          url: w.getURL().slice(0, 80),
          loading: w.isLoading(),
          crashed: w.isCrashed(),
          waitingForResponse: w.isWaitingForResponse()
        }))
      })),
      new Promise((resolve) => {
        setTimeout(() => {
          resolve('main process did not answer within 5 s')
        }, 5000)
      })
    ]).catch((error: unknown) => `evaluate failed: ${String(error)}`)
    console.warn('Main process state at timeout:', JSON.stringify(state, null, 2))
    app.process().kill()
  } else {
    console.log(`App closed in ${String(Date.now() - started)} ms`)
  }
})

for (const site of SITES) {
  test(site, async () => {
    test.setTimeout(60_000)
    let consoleErrors = 0
    const onConsole = (msg: { type: () => string }): void => {
      if (msg.type() === 'error') consoleErrors++
    }
    content.on('console', onConsole)

    await app.evaluate(() => {
      const store = globalThis as unknown as {
        __compat: { status: number | null; error: string | null }
      }
      store.__compat = { status: null, error: null }
    })
    const started = Date.now()
    await typeAddress(ui, site)

    // Wait until the tab stops loading (max 30 s), then give scripts a moment.
    await expect
      .poll(
        () =>
          app.evaluate(({ webContents }) => {
            const tab = webContents
              .getAllWebContents()
              .find((w) => !w.getURL().startsWith('app://'))
            return tab ? !tab.isLoading() && tab.getURL() !== '' : false
          }),
        { timeout: 30_000, intervals: [500] }
      )
      .toBe(true)
      .catch(() => undefined) // slow sites are reported, not fatal here
    const loadMs = Date.now() - started
    await content.waitForTimeout(2000)

    const info = await app.evaluate(({ webContents }) => {
      const tab = webContents.getAllWebContents().find((w) => !w.getURL().startsWith('app://'))
      const store = globalThis as unknown as {
        __compat: { status: number | null; error: string | null }
      }
      return {
        finalUrl: tab?.getURL() ?? '',
        title: tab?.getTitle() ?? '',
        crashed: tab?.isCrashed() ?? true,
        httpStatus: store.__compat.status,
        loadError: store.__compat.error
      }
    })
    content.off('console', onConsole)
    await content
      .screenshot({ path: join(OUT_DIR, `${site.replace(/[^a-z0-9]+/gi, '_')}.png`) })
      .catch(() => undefined)

    const result: SiteResult = { site, ...info, consoleErrors, loadMs }
    results.push(result)
  })
}

/** Problems for one site, or [] if it looks fine. */
function problemsOf(result: SiteResult): string[] {
  const problems: string[] = []
  if (result.crashed) problems.push('renderer crashed')
  if (result.loadError) problems.push(`load failed: ${result.loadError}`)
  if (result.title.trim() === '') problems.push('empty title')
  return problems
}

// Site tests only record results (serial mode stops at the first failure);
// this final test fails once, listing every broken site.
test('summary: every site loaded', () => {
  const failures = results
    .map((r) => ({ site: r.site, problems: problemsOf(r) }))
    .filter((r) => r.problems.length > 0)
  expect(failures).toEqual([])
})
