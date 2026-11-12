import { expect, test } from '@playwright/test'
import type { ElectronApplication } from '@playwright/test'
import { contentPage, launchApp, startTestSite, tabUrl, typeAddress, uiPage } from './helpers'

/**
 * Real key presses into the website view, delivered like OS keyboard input.
 * (Playwright's own keyboard goes through CDP and skips Electron's
 * before-input-event, which is where our shortcuts are handled.)
 */
async function pressInPage(
  app: ElectronApplication,
  keyCode: string,
  modifiers: string[] = []
): Promise<void> {
  await app.evaluate(
    ({ webContents }, { keyCode, modifiers }) => {
      const tab = webContents.getAllWebContents().find((w) => !w.getURL().startsWith('app://'))
      if (!tab) throw new Error('no tab')
      tab.focus()
      tab.sendInputEvent({ type: 'keyDown', keyCode, modifiers } as never)
      tab.sendInputEvent({ type: 'keyUp', keyCode, modifiers } as never)
    },
    { keyCode, modifiers }
  )
}

test('keyboard shortcuts work from the page and the toolbar; Ctrl+Enter completes .com', async () => {
  const site = await startTestSite()
  const app = await launchApp()
  try {
    const ui = await uiPage(app)
    const content = await contentPage(app)
    const address = ui.getByLabel('Adres çubuğu')

    await typeAddress(ui, `${site.origin}/`)
    await expect.poll(() => tabUrl(app)).toBe(`${site.origin}/`)
    await typeAddress(ui, `${site.origin}/second`)
    await expect.poll(() => tabUrl(app)).toBe(`${site.origin}/second`)

    // Alt+Left / Alt+Right with the focus inside the website.
    await content.locator('body').click()
    await pressInPage(app, 'Left', ['alt'])
    await expect.poll(() => tabUrl(app)).toBe(`${site.origin}/`)
    await pressInPage(app, 'Right', ['alt'])
    await expect.poll(() => tabUrl(app)).toBe(`${site.origin}/second`)

    // F5 reloads the page (a marker set on window disappears).
    await content.evaluate(() => {
      ;(window as unknown as { marker: number }).marker = 1
    })
    await pressInPage(app, 'F5')
    await expect
      .poll(() =>
        content
          .evaluate(() => (window as unknown as { marker?: number }).marker)
          .catch(() => 'reloading')
      )
      .toBeUndefined()

    // Ctrl+L from inside the website focuses the address bar.
    await pressInPage(app, 'L', ['control'])
    await expect(address).toBeFocused()

    // Ctrl+Enter completes a bare word to www.<word>.com (this one cannot
    // resolve, so the error page shows which address was tried).
    await address.fill('tenekeortakyok')
    await address.press('Control+Enter')
    await expect(ui.getByRole('alert')).toContainText('www.tenekeortakyok.com')
  } finally {
    await app.close().catch(() => undefined)
    await site.close()
  }
})
