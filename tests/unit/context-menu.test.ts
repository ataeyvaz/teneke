import { describe, expect, it, vi } from 'vitest'
import {
  buildContextMenu,
  isWebUrl,
  type ContextMenuActions,
  type ContextMenuInput
} from '../../src/main/app/context-menu'

const base: ContextMenuInput = {
  isEditable: false,
  selectionText: '',
  linkURL: '',
  srcURL: '',
  mediaType: 'none',
  editFlags: { canCut: false, canCopy: false, canPaste: true, canSelectAll: true }
}

function actions(overrides: Partial<ContextMenuActions> = {}): ContextMenuActions {
  return {
    canGoBack: true,
    canGoForward: false,
    goBack: vi.fn(),
    goForward: vi.fn(),
    reload: vi.fn(),
    copyText: vi.fn(),
    saveImage: vi.fn(),
    ...overrides
  }
}

const labels = (input: Partial<ContextMenuInput>, a = actions()): (string | undefined)[] =>
  buildContextMenu({ ...base, ...input }, a).map((item) =>
    item.type === 'separator' ? '---' : item.label
  )

describe('isWebUrl', () => {
  it.each(['https://a.com/x.png', 'http://127.0.0.1:8080/'])('accepts %s', (url) => {
    expect(isWebUrl(url)).toBe(true)
  })
  it.each([
    'javascript:alert(1)',
    'file:///C:/x',
    'data:image/png;base64,AA',
    'blob:https://a/b',
    '',
    'x'
  ])('rejects %s', (url) => {
    expect(isWebUrl(url)).toBe(false)
  })
})

describe('context menu', () => {
  it('shows navigation on a plain page, with disabled entries when impossible', () => {
    const items = buildContextMenu(base, actions())
    expect(items.map((i) => i.label)).toEqual(['Geri', 'İleri', 'Yenile'])
    expect(items[0]?.enabled).toBe(true)
    expect(items[1]?.enabled).toBe(false)
  })

  it('offers copy for a text selection', () => {
    expect(
      labels({ selectionText: 'merhaba', editFlags: { ...base.editFlags, canCopy: true } })
    ).toEqual(['Kopyala'])
  })

  it('offers edit commands in editable fields', () => {
    expect(labels({ isEditable: true })).toEqual(['Kes', 'Kopyala', 'Yapıştır', 'Tümünü seç'])
  })

  it('offers link and image items only for web addresses', () => {
    expect(labels({ linkURL: 'https://a.com/' })).toEqual(['Bağlantı adresini kopyala'])
    expect(labels({ linkURL: 'javascript:alert(1)' })).toEqual(['Geri', 'İleri', 'Yenile'])
    expect(labels({ mediaType: 'image', srcURL: 'https://a.com/x.png' })).toEqual([
      'Resmi farklı kaydet…',
      'Resim adresini kopyala'
    ])
    expect(labels({ mediaType: 'image', srcURL: 'data:image/png;base64,AA' })).toEqual([
      'Geri',
      'İleri',
      'Yenile'
    ])
  })

  it('separates groups', () => {
    expect(
      labels({ linkURL: 'https://a.com/', mediaType: 'image', srcURL: 'https://a.com/x.png' })
    ).toEqual([
      'Bağlantı adresini kopyala',
      '---',
      'Resmi farklı kaydet…',
      'Resim adresini kopyala'
    ])
  })

  it('wires clicks to the browser actions', () => {
    const a = actions()
    const items = buildContextMenu({ ...base, linkURL: 'https://a.com/' }, a)
    ;(items[0]?.click as () => void)()
    expect(a.copyText).toHaveBeenCalledWith('https://a.com/')
    const nav = buildContextMenu(base, a)
    ;(nav[2]?.click as () => void)()
    expect(a.reload).toHaveBeenCalled()
  })
})
