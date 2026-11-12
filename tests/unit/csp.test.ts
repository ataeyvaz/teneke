import { describe, expect, it } from 'vitest'
import { buildDevCsp, UI_CSP_PRODUCTION } from '../../src/main/app/csp'

function directives(csp: string): Map<string, string> {
  return new Map(
    csp.split(';').map((part) => {
      const [name = '', ...values] = part.trim().split(/\s+/)
      return [name, values.join(' ')] as const
    })
  )
}

describe('UI Content-Security-Policy (production)', () => {
  const csp = directives(UI_CSP_PRODUCTION)

  it('denies everything by default', () => {
    expect(csp.get('default-src')).toBe("'none'")
  })

  it('only allows our own scripts: no eval, no inline, no remote', () => {
    expect(csp.get('script-src')).toBe("'self'")
    expect(UI_CSP_PRODUCTION).not.toContain('unsafe-eval')
    expect(UI_CSP_PRODUCTION).not.toContain('unsafe-inline')
    expect(UI_CSP_PRODUCTION).not.toMatch(/https?:|\*/)
  })

  it('blocks plugins, framing, base and form hijacking', () => {
    expect(csp.get('object-src')).toBe("'none'")
    expect(csp.get('frame-src')).toBe("'none'")
    expect(csp.get('frame-ancestors')).toBe("'none'")
    expect(csp.get('base-uri')).toBe("'none'")
    expect(csp.get('form-action')).toBe("'none'")
    expect(csp.get('connect-src')).toBe("'none'")
  })
})

describe('UI Content-Security-Policy (development)', () => {
  const dev = buildDevCsp('http://localhost:5173')
  const csp = directives(dev)

  it('never allows eval or remote scripts', () => {
    expect(dev).not.toContain('unsafe-eval')
    expect(csp.get('script-src')).toBe("'self' 'unsafe-inline'")
  })

  it('only connects to the dev server websocket', () => {
    expect(csp.get('connect-src')).toBe("'self' ws://localhost:5173")
  })
})
