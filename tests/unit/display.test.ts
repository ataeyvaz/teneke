import { describe, expect, it } from 'vitest'
import {
  addressBarLabel,
  formatDisplayUrl,
  securityOf,
  windowTitle
} from '../../src/renderer/src/lib/display'

describe('securityOf', () => {
  it('marks https secure, http insecure, everything else neutral', () => {
    expect(securityOf('https://example.com/')).toBe('secure')
    expect(securityOf('http://example.com/')).toBe('insecure')
    expect(securityOf('about:blank')).toBe('none')
    expect(securityOf('')).toBe('none')
    expect(securityOf('not a url')).toBe('none')
  })
})

describe('formatDisplayUrl', () => {
  it.each([
    ['https://example.com/', 'example.com'],
    ['https://example.com/a/b?x=1#top', 'example.com/a/b?x=1#top'],
    ['http://localhost:3000/', 'localhost:3000'],
    ['https://duckduckgo.com/?q=kedi', 'duckduckgo.com/?q=kedi'],
    ['about:blank', 'about:blank'],
    ['', '']
  ])('formats %s', (input, expected) => {
    expect(formatDisplayUrl(input)).toBe(expected)
  })
})

describe('addressBarLabel', () => {
  it('prefers the page title, falls back to the short URL', () => {
    expect(addressBarLabel('https://example.com/', 'Example Domain')).toBe('Example Domain')
    expect(addressBarLabel('https://example.com/', '   ')).toBe('example.com')
    expect(addressBarLabel('', '')).toBe('')
  })
})

describe('windowTitle', () => {
  it('appends the app name, or shows just the app name without a title', () => {
    expect(windowTitle('Example Domain')).toBe('Example Domain — Teneke')
    expect(windowTitle('  ')).toBe('Teneke')
  })
})
