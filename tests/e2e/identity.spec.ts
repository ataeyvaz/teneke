import { createServer, type IncomingHttpHeaders } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, test } from '@playwright/test'
import { contentPage, launchApp, tabUrl, typeAddress, uiPage } from './helpers'

// One consistent identity: headers agree with navigator.userAgentData, pages
// and workers send the same UA (with our own Teneke token), and the brand list
// is never "Google Chrome".
test('websites see one consistent Chromium identity', async () => {
  let headers: IncomingHttpHeaders = {}
  const workerUa: Record<string, string> = {}
  const server = createServer((req, res) => {
    const url = req.url ?? '/'
    if (url === '/') headers = req.headers
    if (url.startsWith('/probe-')) workerUa[url] = req.headers['user-agent'] ?? ''
    const js = (body: string): void => {
      res.writeHead(200, { 'Content-Type': 'text/javascript' }).end(body)
    }
    if (url === '/shared.js') {
      js("fetch('/probe-shared')")
      return
    }
    if (url === '/sw.js') {
      js("self.addEventListener('install', (e) => e.waitUntil(fetch('/probe-sw')))")
      return
    }
    if (url.startsWith('/probe-')) return void res.writeHead(204).end()
    res
      .writeHead(200, { 'Content-Type': 'text/html' })
      .end(
        "<title>id</title>ok<script>new SharedWorker('/shared.js'); navigator.serviceWorker.register('/sw.js')</script>"
      )
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`

  const app = await launchApp()
  try {
    const ui = await uiPage(app)
    const content = await contentPage(app)
    await typeAddress(ui, `${origin}/`)
    await expect.poll(() => headers['user-agent'] ?? '').not.toBe('')
    await expect.poll(() => tabUrl(app)).toBe(`${origin}/`)
    await expect(content).toHaveTitle('id')

    const page = await content.evaluate(() => {
      const data = (
        navigator as unknown as { userAgentData: { brands: { brand: string; version: string }[] } }
      ).userAgentData
      return { ua: navigator.userAgent, brands: data.brands, languages: [...navigator.languages] }
    })
    const expectedHeader = page.brands.map((b) => `"${b.brand}";v="${b.version}"`).join(', ')

    expect(headers['sec-ch-ua']).toBe(expectedHeader)
    expect(headers['sec-ch-ua']).not.toContain('Google Chrome')
    expect(headers['sec-ch-ua-mobile']).toBe('?0')
    expect(headers['sec-ch-ua-platform']).toBe('"Windows"')
    expect(headers['user-agent']).toBe(page.ua)
    // Own product token like Edge; no Electron token; reduced version.
    expect(page.ua).toMatch(/Chrome\/\d+\.0\.0\.0 Safari\/537\.36 Teneke\/\d+\.\d+\.\d+$/)
    // Shared and service workers must use the very same identity.
    await expect.poll(() => Object.keys(workerUa).sort()).toEqual(['/probe-shared', '/probe-sw'])
    expect(workerUa['/probe-shared']).toBe(page.ua)
    expect(workerUa['/probe-sw']).toBe(page.ua)
    const expectedLanguages = page.languages
      .map((tag, i) => (i === 0 ? tag : `${tag};q=${(1 - i / 10).toFixed(1)}`))
      .join(',')
    expect(headers['accept-language']).toBe(expectedLanguages)

    // No default Electron menu bar on Windows.
    expect(await app.evaluate(({ Menu }) => Menu.getApplicationMenu())).toBeNull()
  } finally {
    await app.close().catch(() => undefined)
    server.close()
  }
})
