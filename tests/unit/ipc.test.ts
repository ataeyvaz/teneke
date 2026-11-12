import { describe, expect, it } from 'vitest'
import { MAX_ADDRESS_INPUT_LENGTH } from '../../src/shared/ipc'
import { navigateArgs, noArgs } from '../../src/main/ipc/schemas'
import { isTrustedSender, type SenderInfo } from '../../src/main/ipc/sender'

const UI_ORIGIN = 'app://ui'
const trusted = new Set([7])
const uiSender: SenderInfo = {
  webContentsId: 7,
  frameUrl: 'app://ui/index.html',
  isMainFrame: true
}

describe('isTrustedSender', () => {
  it('accepts the registered UI view top frame on the UI origin', () => {
    expect(isTrustedSender(uiSender, trusted, UI_ORIGIN)).toBe(true)
  })

  it('accepts the dev server origin in development', () => {
    expect(
      isTrustedSender(
        { ...uiSender, frameUrl: 'http://localhost:5173/' },
        trusted,
        'http://localhost:5173'
      )
    ).toBe(true)
  })

  it('rejects a website (unregistered web contents)', () => {
    expect(
      isTrustedSender(
        { webContentsId: 12, frameUrl: 'https://evil.example/', isMainFrame: true },
        trusted,
        UI_ORIGIN
      )
    ).toBe(false)
  })

  it('rejects an iframe inside the UI view', () => {
    expect(isTrustedSender({ ...uiSender, isMainFrame: false }, trusted, UI_ORIGIN)).toBe(false)
  })

  it('rejects the UI view after it navigated to another origin', () => {
    expect(
      isTrustedSender({ ...uiSender, frameUrl: 'https://evil.example/' }, trusted, UI_ORIGIN)
    ).toBe(false)
  })

  it('rejects unknown senders and destroyed frames', () => {
    expect(isTrustedSender({ ...uiSender, webContentsId: null }, trusted, UI_ORIGIN)).toBe(false)
    expect(isTrustedSender({ ...uiSender, frameUrl: null }, trusted, UI_ORIGIN)).toBe(false)
  })
})

describe('IPC argument schemas', () => {
  it('accepts a normal address', () => {
    expect(navigateArgs.safeParse(['example.com']).success).toBe(true)
    expect(navigateArgs.safeParse(['kedi resimleri']).success).toBe(true)
  })

  it.each([
    ['no arguments', []],
    ['too many arguments', ['a', 'b']],
    ['a number', [42]],
    ['an object', [{ url: 'https://x.com' }]],
    ['an empty string', ['']],
    ['only spaces', ['   ']],
    ['control characters', ['https://x.com/\nSet-Cookie: a=b']],
    ['a NUL byte', ['x\u0000y']],
    ['an overly long string', ['a'.repeat(MAX_ADDRESS_INPUT_LENGTH + 1)]]
  ])('rejects navigate with %s', (_label, args) => {
    expect(navigateArgs.safeParse(args).success).toBe(false)
  })

  it('accepts no-argument calls and rejects extra arguments', () => {
    expect(noArgs.safeParse([]).success).toBe(true)
    expect(noArgs.safeParse(['unexpected']).success).toBe(false)
  })
})
