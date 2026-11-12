import { expect, test } from '@playwright/test'
import { launchApp, uiPage } from './helpers'

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
