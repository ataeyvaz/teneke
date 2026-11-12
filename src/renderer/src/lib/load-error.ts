/** Turkish, plain-language explanation of Chromium network errors. Unit tested. */

export interface LoadErrorText {
  title: string
  hint: string
}

const KNOWN: Record<string, LoadErrorText> = {
  ERR_NAME_NOT_RESOLVED: {
    title: 'Bu sitenin adresi bulunamadı',
    hint: 'Adresi doğru yazdığınızdan ve internete bağlı olduğunuzdan emin olun.'
  },
  ERR_INTERNET_DISCONNECTED: {
    title: 'İnternet bağlantısı yok',
    hint: 'Ağ bağlantınızı kontrol edip tekrar deneyin.'
  },
  ERR_CONNECTION_TIMED_OUT: {
    title: 'Siteye bağlanılamadı: yanıt vermedi',
    hint: 'Site yanıt vermiyor ya da ağınız bu adrese erişimi engelliyor olabilir. Bir süre sonra tekrar deneyin.'
  },
  ERR_CONNECTION_REFUSED: {
    title: 'Site bağlantıyı reddetti',
    hint: 'Sunucu şu anda bağlantı kabul etmiyor olabilir.'
  },
  ERR_CONNECTION_RESET: {
    title: 'Bağlantı kesildi',
    hint: 'Sayfa yüklenirken bağlantı sıfırlandı. Tekrar deneyin.'
  },
  ERR_CONNECTION_CLOSED: {
    title: 'Bağlantı kapandı',
    hint: 'Sunucu bağlantıyı beklenmedik şekilde kapattı. Tekrar deneyin.'
  },
  ERR_ADDRESS_UNREACHABLE: {
    title: 'Bu adrese ulaşılamıyor',
    hint: 'Ağınız bu adrese giden bir yol bulamıyor.'
  },
  ERR_NETWORK_CHANGED: {
    title: 'Ağ bağlantısı değişti',
    hint: 'Ağ değişikliği sayfayı yarıda kesti. Tekrar deneyin.'
  },
  ERR_TOO_MANY_REDIRECTS: {
    title: 'Çok fazla yönlendirme',
    hint: 'Site sizi sürekli başka bir adrese yönlendiriyor. Çerezleri temizlemek yardımcı olabilir.'
  },
  ERR_TUNNEL_CONNECTION_FAILED: {
    title: 'Proxy üzerinden bağlanılamadı',
    hint: 'Proxy ayarlarınızı kontrol edin.'
  },
  ERR_BLOCKED_BY_CLIENT: {
    title: 'Sayfa engellendi',
    hint: 'Bu istek Teneke tarafından engellendi.'
  }
}

/** Certificate problems all start with ERR_CERT_; they are never bypassed. */
const CERTIFICATE: LoadErrorText = {
  title: 'Bağlantı güvenli değil',
  hint: 'Sitenin güvenlik sertifikası doğrulanamadı. Güvenliğiniz için sayfa açılmadı.'
}

const FALLBACK: LoadErrorText = {
  title: 'Bu sayfa açılamadı',
  hint: 'Sayfa yüklenirken bir sorun oluştu. Tekrar deneyin.'
}

export function describeLoadError(description: string): LoadErrorText {
  const known = KNOWN[description]
  if (known) return known
  if (description.startsWith('ERR_CERT_') || description === 'ERR_SSL_PROTOCOL_ERROR')
    return CERTIFICATE
  return FALLBACK
}
