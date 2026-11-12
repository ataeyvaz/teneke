import { describe, expect, it } from 'vitest'
import {
  brandListSchema,
  buildClientHintHeaders,
  formatBrandHeader,
  isTrustworthyUrl,
  platformHint,
  withClientHints
} from '../../src/main/sessions/client-hints'
import { buildAcceptLanguages } from '../../src/main/app/url-policy'

const BRANDS = [
  { brand: 'Not:A-Brand', version: '8' },
  { brand: 'Chromium', version: '156' }
]

describe('client hints', () => {
  it('formats the brand list like Chromium', () => {
    expect(formatBrandHeader(BRANDS)).toBe('"Not:A-Brand";v="8", "Chromium";v="156"')
  })

  it('never lets a quote or backslash break the header', () => {
    expect(formatBrandHeader([{ brand: 'A"B\\C', version: '1' }])).toBe('"ABC";v="1"')
  })

  it('maps platforms', () => {
    expect(platformHint('win32')).toBe('"Windows"')
    expect(platformHint('darwin')).toBe('"macOS"')
    expect(platformHint('linux')).toBe('"Linux"')
  })

  it('builds the three default hints, never claiming Google Chrome', () => {
    const headers = buildClientHintHeaders(BRANDS, 'win32')
    expect(headers).toEqual({
      'sec-ch-ua': '"Not:A-Brand";v="8", "Chromium";v="156"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    })
    expect(headers['sec-ch-ua']).not.toContain('Google Chrome')
  })

  it.each(['https://a.com/', 'http://localhost:3000/', 'http://127.0.0.1/', 'wss://a.com/'])(
    'treats %s as trustworthy',
    (url) => {
      expect(isTrustworthyUrl(url)).toBe(true)
    }
  )

  it.each(['http://example.com/', 'file:///C:/', 'data:text/html,x', 'not a url'])(
    'does not send hints to %s',
    (url) => {
      expect(isTrustworthyUrl(url)).toBe(false)
    }
  )

  it('adds missing hints to secure requests only and keeps existing ones', () => {
    const hints = buildClientHintHeaders(BRANDS, 'win32')
    expect(withClientHints('http://example.com/', { A: '1' }, hints)).toEqual({ A: '1' })
    const added = withClientHints('https://a.com/', { 'Sec-CH-UA-Mobile': '?1' }, hints)
    expect(added['Sec-CH-UA-Mobile']).toBe('?1')
    expect(added['sec-ch-ua-mobile']).toBeUndefined()
    expect(added['sec-ch-ua']).toBe(hints['sec-ch-ua'])
  })

  it('validates the brand list read from the UI', () => {
    expect(brandListSchema.safeParse(BRANDS).success).toBe(true)
    expect(brandListSchema.safeParse(null).success).toBe(false)
    expect(brandListSchema.safeParse([]).success).toBe(false)
    expect(brandListSchema.safeParse([{ brand: 'x', version: '1.2' }]).success).toBe(false)
  })
})

describe('buildAcceptLanguages', () => {
  it('mirrors navigator.languages (Chromium adds the q= weights itself)', () => {
    expect(buildAcceptLanguages(['tr', 'en-US'])).toBe('tr,en-US')
    expect(buildAcceptLanguages(['tr-TR', 'tr', 'en-US', 'en'])).toBe('tr-TR,tr,en-US,en')
  })

  it('drops duplicates and invalid tags, and has a fallback', () => {
    expect(buildAcceptLanguages(['tr', 'tr', 'bad tag;q=1'])).toBe('tr')
    expect(buildAcceptLanguages([])).toBe('en-US')
  })
})
