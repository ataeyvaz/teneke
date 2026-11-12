import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Guard: the browser UI must keep a strict Content-Security-Policy (CLAUDE.md section 5).
const html = readFileSync(resolve(__dirname, '../../src/renderer/index.html'), 'utf-8')
const cspMatch = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html)
const csp = cspMatch?.[1] ?? ''

function directive(name: string): string {
  const found = csp
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `))
  return found ?? ''
}

describe('browser UI Content-Security-Policy', () => {
  it('is present', () => {
    expect(csp).not.toBe('')
  })

  it('does not allow eval or inline/remote scripts', () => {
    const scriptSrc = directive('script-src')
    expect(scriptSrc).toBe("script-src 'self'")
    expect(csp).not.toContain('unsafe-eval')
    expect(scriptSrc).not.toMatch(/https?:|\*/)
  })

  it('denies everything by default and blocks plugins and framing', () => {
    expect(directive('default-src')).toBe("default-src 'self'")
    expect(directive('object-src')).toBe("object-src 'none'")
    expect(directive('frame-src')).toBe("frame-src 'none'")
  })
})
