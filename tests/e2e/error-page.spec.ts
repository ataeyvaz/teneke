import { expect, test } from '@playwright/test'
import { launchApp, startTestSite, tabUrl, typeAddress, uiPage } from './helpers'

// A page that fails to load must show our own error page (drawn by the browser
// UI, not by the website) instead of a blank view, and recover on retry.
test('failed load shows the error page; retry and a new address recover', async () => {
  const live = await startTestSite()
  // A port nobody listens on: connection refused.
  const dead = await startTestSite()
  const deadOrigin = dead.origin
  await dead.close()

  const app = await launchApp()
  try {
    const ui = await uiPage(app)
    const toolbarHeight = await ui.evaluate(() => window.innerHeight)

    await typeAddress(ui, `${deadOrigin}/`)
    const alert = ui.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('ERR_CONNECTION_REFUSED')
    await expect(alert).toContainText(deadOrigin.replace('http://', ''))
    // The UI view grew to cover the window below the toolbar.
    expect(await ui.evaluate(() => window.innerHeight)).toBeGreaterThan(toolbarHeight)

    // Retry on a still-dead address keeps the error page.
    await alert.getByRole('button', { name: 'Tekrar dene' }).click()
    await expect(alert).toBeVisible()

    // Navigating somewhere that works clears it and restores the layout.
    await typeAddress(ui, `${live.origin}/`)
    await expect(alert).toBeHidden()
    await expect.poll(() => tabUrl(app)).toBe(`${live.origin}/`)
    await expect.poll(() => ui.evaluate(() => window.innerHeight)).toBe(toolbarHeight)
  } finally {
    await app.close().catch(() => undefined)
    await live.close()
  }
})
