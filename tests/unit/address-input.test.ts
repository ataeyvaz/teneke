import { describe, expect, it } from 'vitest'
import { resolveAddressInput } from '../../src/main/app/url-policy'

const SEARCH = 'https://search.example/?q=%s'
const resolve = (input: string): string => resolveAddressInput(input, SEARCH)
const searchFor = (query: string): string => SEARCH.replace('%s', encodeURIComponent(query))

describe('resolveAddressInput', () => {
  it.each([
    ['https://example.com', 'https://example.com/'],
    ['http://example.com/a?b=1#c', 'http://example.com/a?b=1#c'],
    ['HTTPS://Example.COM/Path', 'https://example.com/Path'],
    ['  https://example.com  ', 'https://example.com/']
  ])('keeps full web URL %s', (input, expected) => {
    expect(resolve(input)).toBe(expected)
  })

  it.each([
    ['example.com', 'https://example.com/'],
    ['www.example.com/path?x=1', 'https://www.example.com/path?x=1'],
    ['sub.example.co.uk', 'https://sub.example.co.uk/'],
    ['türkçe.com.tr', 'https://xn--trke-2oa7j.com.tr/'],
    ['localhost', 'http://localhost/'],
    ['localhost:3000/app', 'http://localhost:3000/app'],
    ['127.0.0.1:8080', 'http://127.0.0.1:8080/'],
    ['192.168.1.1', 'http://192.168.1.1/']
  ])('adds a scheme to host-like input %s', (input, expected) => {
    expect(resolve(input)).toBe(expected)
  })

  it.each(['kedi resimleri', 'hava durumu istanbul', 'what is 1.5 + 2', 'electron', '1.5'])(
    'searches for plain text %s',
    (input) => {
      expect(resolve(input)).toBe(searchFor(input))
    }
  )

  it.each([
    'javascript:alert(document.cookie)',
    'JaVaScRiPt:alert(1)',
    'file:///C:/Windows/win.ini',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'app://ui/index.html',
    'chrome://settings',
    'ms-settings:privacy',
    'http://',
    'https://user:pass@'
  ])('never navigates to dangerous or broken input %s (searches instead)', (input) => {
    expect(resolve(input)).toBe(searchFor(input))
  })

  it('encodes the query so it cannot break out of the search URL', () => {
    const result = resolve('a&b=c #x')
    expect(result).toBe('https://search.example/?q=a%26b%3Dc%20%23x')
    expect(new URL(result).searchParams.get('q')).toBe('a&b=c #x')
  })

  it('keeps about:blank', () => {
    expect(resolve('about:blank')).toBe('about:blank')
  })
})
