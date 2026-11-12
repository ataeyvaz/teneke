import { describe, expect, it } from 'vitest'
import { describeLoadError } from '../../src/renderer/src/lib/load-error'

describe('describeLoadError', () => {
  it('explains well-known network errors in plain Turkish', () => {
    expect(describeLoadError('ERR_NAME_NOT_RESOLVED').title).toContain('adresi bulunamadı')
    expect(describeLoadError('ERR_CONNECTION_TIMED_OUT').title).toContain('yanıt vermedi')
    expect(describeLoadError('ERR_INTERNET_DISCONNECTED').title).toContain('İnternet')
  })

  it('treats certificate errors as a security problem', () => {
    for (const name of ['ERR_CERT_DATE_INVALID', 'ERR_CERT_AUTHORITY_INVALID']) {
      expect(describeLoadError(name).title).toBe('Bağlantı güvenli değil')
    }
  })

  it('falls back to a generic message for unknown errors', () => {
    expect(describeLoadError('ERR_SOMETHING_NEW').title).toBe('Bu sayfa açılamadı')
    expect(describeLoadError('').title).toBe('Bu sayfa açılamadı')
  })
})
