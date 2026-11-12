import { expect, test } from '@playwright/test'
import { contentPage, launchApp, startTestSite, tabUrl, typeAddress, uiPage } from './helpers'

// Regression: closing the window used to throw "Object has been destroyed",
// which shows a blocking error dialog and keeps the process alive.
test('closing the window quits the app without errors', async () => {
  const app = await launchApp()
  const errors: string[] = []
  app.process().stderr?.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    if (/Uncaught|A JavaScript error occurred|Object has been destroyed/i.test(text)) {
      errors.push(text)
    }
  })
  await uiPage(app)

  const exited = app.waitForEvent('close', { timeout: 10_000 })
  await app.evaluate(({ BaseWindow }) => {
    BaseWindow.getAllWindows()[0]?.close()
  })
  await exited

  expect(errors).toEqual([])
})

// A site with "unsaved changes" (beforeunload) must not silently block closing:
// the user is asked, like in Chrome. The native dialog is stubbed in the main process.
for (const [answer, label, expectExit] of [
  [0, 'Ayrıl (leave)', true],
  [1, 'Kal (stay)', false]
] as const) {
  test(`beforeunload asks the user; answering "${label}" ${expectExit ? 'closes' : 'keeps'} the window`, async () => {
    const site = await startTestSite()
    const app = await launchApp()
    let dialogShown = false
    app.process().stdout?.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('E2E_DIALOG_ASKED')) dialogShown = true
    })
    try {
      const ui = await uiPage(app)
      const content = await contentPage(app)
      await typeAddress(ui, `${site.origin}/unsaved`)
      await expect.poll(() => tabUrl(app)).toBe(`${site.origin}/unsaved`)
      // beforeunload only fires after the user interacted with the page.
      await content.click('#field')
      await content.keyboard.type('x')

      await app.evaluate(({ dialog }, choice) => {
        const store = globalThis as unknown as { __asked: number }
        store.__asked = 0
        dialog.showMessageBoxSync = () => {
          store.__asked++
          console.log('E2E_DIALOG_ASKED')
          return choice
        }
      }, answer)

      const exited = app.waitForEvent('close', { timeout: 10_000 }).then(
        () => true,
        () => false
      )
      await app.evaluate(({ BaseWindow }) => {
        BaseWindow.getAllWindows()[0]?.close()
      })

      if (expectExit) {
        expect(await exited).toBe(true)
        expect(dialogShown).toBe(true)
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        const state = await app.evaluate(({ BaseWindow }) => ({
          windows: BaseWindow.getAllWindows().length,
          asked: (globalThis as unknown as { __asked: number }).__asked
        }))
        expect(state).toEqual({ windows: 1, asked: 1 })
      }
    } finally {
      // Cleanup: answer "leave" from now on, otherwise "stay" would (correctly)
      // keep the app open and block closing it.
      await app
        .evaluate(({ dialog }) => {
          dialog.showMessageBoxSync = () => 0
        })
        .catch(() => undefined)
      await app.close().catch(() => undefined)
      await site.close()
    }
  })
}
