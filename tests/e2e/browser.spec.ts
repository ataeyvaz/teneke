import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import {
  contentPage,
  launchApp,
  startTestSite,
  tabUrl,
  typeAddress,
  uiPage,
  type TestSite
} from './helpers'

let app: ElectronApplication
let site: TestSite
let ui: Page

test.beforeAll(async () => {
  site = await startTestSite()
  app = await launchApp()
  ui = await uiPage(app)
})

test.afterAll(async () => {
  await app.close()
  await site.close()
})

test('starts with the UI served from app:// and a web content view', async () => {
  expect(ui.url()).toBe('app://ui/index.html')
  await expect(ui.getByLabel('Adres çubuğu')).toBeVisible()
  await contentPage(app)
})

test('address bar navigates, shows the title, and back/forward work', async () => {
  const content = await contentPage(app)

  await typeAddress(ui, `${site.origin}/`)
  await expect(content).toHaveURL(`${site.origin}/`)
  await expect(ui.getByLabel('Adres çubuğu')).toHaveValue('Teneke Test Page')

  await typeAddress(ui, `${site.origin}/second`)
  await expect(content).toHaveURL(`${site.origin}/second`)
  await expect(ui.getByLabel('Adres çubuğu')).toHaveValue('Second Page')

  await ui.getByLabel('Geri').click()
  await expect(content).toHaveURL(`${site.origin}/`)
  await expect(ui.getByLabel('İleri')).toBeEnabled()

  await ui.getByLabel('İleri').click()
  await expect(content).toHaveURL(`${site.origin}/second`)
})

test.describe('security', () => {
  let content: Page

  test.beforeEach(async () => {
    content = await contentPage(app)
    await typeAddress(ui, `${site.origin}/`)
    await expect(content).toHaveURL(`${site.origin}/`)
  })

  test('websites cannot reach Node.js or the browser UI API', async () => {
    const globals = await content.evaluate(() => {
      const g = globalThis as Record<string, unknown>
      return {
        require: typeof g['require'],
        process: typeof g['process'],
        teneke: typeof g['teneke']
      }
    })
    expect(globals).toEqual({ require: 'undefined', process: 'undefined', teneke: 'undefined' })
  })

  test('websites cannot navigate to file:// or other local schemes', async () => {
    for (const target of ['file:///C:/Windows/win.ini', 'app://ui/index.html']) {
      await content.evaluate((url) => {
        window.location.href = url
      }, target)
      await content.waitForTimeout(500)
      expect(await tabUrl(app)).toBe(`${site.origin}/`)
    }
  })

  test('pop-ups never create new windows', async () => {
    const pagesBefore = app.windows().length
    await content.evaluate(() => {
      window.open('file:///C:/Windows/win.ini')
    })
    await content.waitForTimeout(500)
    expect(app.windows()).toHaveLength(pagesBefore)

    // Phase 1: an allowed pop-up opens in the current tab instead.
    await content.evaluate((url) => {
      window.open(url)
    }, `${site.origin}/second`)
    await expect(content).toHaveURL(`${site.origin}/second`)
    expect(app.windows()).toHaveLength(pagesBefore)
  })

  test('permissions are denied by default', async () => {
    const result = await content.evaluate(async () => {
      const geolocation = await new Promise<string>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            resolve('granted')
          },
          (error) => {
            resolve(`denied:${String(error.code)}`)
          }
        )
      })
      const notifications = await Notification.requestPermission()
      return { geolocation, notifications }
    })
    expect(result).toEqual({ geolocation: 'denied:1', notifications: 'denied' })
  })

  test('owner-approved low-risk permissions work after a click; reading the clipboard stays denied', async () => {
    // Note: this writes "teneke-e2e" to the system clipboard.
    await typeAddress(ui, `${site.origin}/permissions`)
    await expect.poll(() => tabUrl(app)).toBe(`${site.origin}/permissions`)
    const result = (key: string): Promise<unknown> =>
      content.evaluate((k) => (window as unknown as Record<string, unknown>)[k], key)

    await content.click('#copy')
    await expect.poll(() => result('copy')).toBe('ok')

    await content.click('#read')
    await expect.poll(() => result('read')).toBe('error:NotAllowedError')

    await content.click('#lock')
    await expect.poll(() => result('lock')).toBe('ok')
    await content.evaluate(() => {
      document.exitPointerLock()
    })
  })

  test('HTML fullscreen hides the toolbar and fills the window; leaving restores it', async () => {
    await typeAddress(ui, `${site.origin}/permissions`)
    await expect.poll(() => tabUrl(app)).toBe(`${site.origin}/permissions`)
    const windowState = (): Promise<{ fullscreen: boolean; contentTop: number }> =>
      app.evaluate(({ BaseWindow, webContents }) => {
        const win = BaseWindow.getAllWindows()[0]
        const tab = webContents.getAllWebContents().find((w) => !w.getURL().startsWith('app://'))
        const view = win?.contentView.children.find(
          (child) => 'webContents' in child && child.webContents === tab
        )
        return { fullscreen: win?.isFullScreen() ?? false, contentTop: view?.getBounds().y ?? -1 }
      })

    await content.click('#fullscreen')
    await expect.poll(windowState).toEqual({ fullscreen: true, contentTop: 0 })

    await content.evaluate(() => document.exitFullscreen())
    await expect.poll(windowState).toEqual({ fullscreen: false, contentTop: 48 })
    await expect(ui.getByLabel('Adres çubuğu')).toBeVisible()
  })
})
