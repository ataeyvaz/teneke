import { describe, expect, it } from 'vitest'
import { shortcutOf, type ShortcutInput } from '../../src/main/app/shortcuts'
import { completeWithCom } from '../../src/renderer/src/lib/address'

function press(key: string, mods: Partial<ShortcutInput> = {}): ReturnType<typeof shortcutOf> {
  return shortcutOf({
    type: 'keyDown',
    key,
    control: false,
    alt: false,
    shift: false,
    meta: false,
    ...mods
  })
}

describe('shortcutOf', () => {
  it.each([
    ['F5', {}, 'reload'],
    ['r', { control: true }, 'reload'],
    ['R', { control: true, shift: true }, 'reloadIgnoringCache'],
    ['F5', { control: true }, 'reloadIgnoringCache'],
    ['ArrowLeft', { alt: true }, 'back'],
    ['ArrowRight', { alt: true }, 'forward'],
    ['l', { control: true }, 'focusAddress'],
    ['L', { control: true }, 'focusAddress'],
    ['d', { alt: true }, 'focusAddress'],
    ['F6', {}, 'focusAddress'],
    ['Escape', {}, 'stop']
  ] as const)('%s with %j -> %s', (key, mods, action) => {
    expect(press(key, mods)).toBe(action)
  })

  it.each([
    ['a', {}],
    ['r', {}],
    ['ArrowLeft', {}],
    ['ArrowLeft', { alt: true, control: true }],
    ['l', { control: true, shift: true }],
    ['F5', { alt: true }],
    ['r', { control: true, meta: true }],
    ['Escape', { shift: true }]
  ] as const)('ignores %s with %j', (key, mods) => {
    expect(press(key, mods)).toBeNull()
  })

  it('ignores key releases', () => {
    expect(press('F5', { type: 'keyUp' })).toBeNull()
  })
})

describe('completeWithCom', () => {
  it.each([
    ['google', 'www.google.com'],
    ['  youtube ', 'www.youtube.com'],
    ['türkiye', 'www.türkiye.com'],
    ['my-site', 'www.my-site.com']
  ])('completes %j', (input, expected) => {
    expect(completeWithCom(input)).toBe(expected)
  })

  it.each([
    ['github.com', 'github.com'],
    ['https://a.com', 'https://a.com'],
    ['hava durumu', 'hava durumu'],
    ['localhost:3000', 'localhost:3000'],
    ['a/b', 'a/b'],
    ['', '']
  ])('leaves %j alone', (input, expected) => {
    expect(completeWithCom(input)).toBe(expected)
  })
})
