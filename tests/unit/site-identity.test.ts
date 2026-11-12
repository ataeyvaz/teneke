import { describe, expect, it } from 'vitest'
import { isOnHosts, userAgentFor } from '../../src/main/sessions/site-identity'

const agents = { own: 'UA Teneke/0.1.0', chromeForm: 'UA' }

describe('per-site identity', () => {
  it('uses our own identity by default (Google, Cloudflare sites, ...)', () => {
    for (const url of ['https://accounts.google.com/', 'https://krunker.io/', 'https://a.com/']) {
      expect(userAgentFor(url, agents)).toBe(agents.own)
    }
  })

  it('uses the plain Chromium form only on listed hosts', () => {
    expect(userAgentFor('https://web.whatsapp.com/', agents)).toBe(agents.chromeForm)
  })

  it('matches hosts and subdomains exactly, not look-alikes', () => {
    expect(isOnHosts('https://web.whatsapp.com/x', ['web.whatsapp.com'])).toBe(true)
    expect(isOnHosts('https://a.web.whatsapp.com/', ['web.whatsapp.com'])).toBe(true)
    expect(isOnHosts('https://web.whatsapp.com.evil.io/', ['web.whatsapp.com'])).toBe(false)
    expect(isOnHosts('https://evilweb.whatsapp.com/', ['web.whatsapp.com'])).toBe(false)
    expect(isOnHosts('not a url', ['web.whatsapp.com'])).toBe(false)
  })
})
