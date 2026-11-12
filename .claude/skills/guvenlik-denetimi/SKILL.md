---
name: guvenlik-denetimi
description: Electron tarayıcı projesinin güvenlik denetimi. Güvenlik ayarlarına, webPreferences'a, IPC kanallarına, preload dosyalarına, izinlere, gezinme kontrollerine, oturumlara, paketleme ayarlarına veya Electron Fuses'a dokunan her değişiklikten sonra MUTLAKA kullan. Ayrıca her fazın sonunda, sürüm çıkmadan önce ve kullanıcı "güvenlik", "denetim", "audit", "açık var mı" dediğinde kullan.
---

# Güvenlik Denetimi

Amaç: CLAUDE.md Bölüm 5'teki kuralların koda gerçekten uygulandığını kanıtlamak. Varsayım yapma; her maddeyi koddan doğrula ve dosya/satır göster.

## Adımlar

1. CLAUDE.md Bölüm 5'i yeniden oku.
2. Otomatik taramaları çalıştır ve çıktıyı oku:
   - `npm run security` (Electronegativity)
   - `npm run lint`
   - `npm audit --omit=dev`
3. Aşağıdaki kontrol listesini koddan tek tek doğrula.
4. Raporu aşağıdaki formatta yaz.
5. Kritik veya yüksek bulgu varsa düzeltmeyi öner, ama kullanıcı onayı olmadan büyük değişiklik yapma.

## Kontrol listesi

**webPreferences (tüm BrowserWindow / WebContentsView oluşturma yerlerini grep ile bul)**
- [ ] nodeIntegration false, contextIsolation true, sandbox true, webSecurity true
- [ ] allowRunningInsecureContent false, experimentalFeatures false
- [ ] nodeIntegrationInSubFrames / nodeIntegrationInWorker yok
- [ ] Web içeriği view'larında preload yok (ya da gerekçeli ve minimal)
- [ ] `<webview>` kullanımı yok, `will-attach-webview` engelli

**Preload ve IPC**
- [ ] contextBridge sadece tek tek tanımlı fonksiyonlar açıyor; ipcRenderer doğrudan açılmıyor
- [ ] Her `ipcMain.handle/on` gönderen frame'i doğruluyor
- [ ] Her IPC girdisi şema ile doğrulanıyor
- [ ] Dosya yolu / URL içeren girdiler temizleniyor

**Gezinme ve dış bağlantılar**
- [ ] setWindowOpenHandler tanımlı
- [ ] will-navigate kontrollü
- [ ] shell.openExternal sadece izinli protokollerle
- [ ] Sertifika hataları sessizce kabul edilmiyor (`certificate-error` handler'ını kontrol et)

**Oturum ve izinler**
- [ ] Her session'da setPermissionRequestHandler ve setPermissionCheckHandler var, varsayılan reddet
- [ ] Gizli mod kalıcı olmayan partition kullanıyor

**Arayüz**
- [ ] Content-Security-Policy tanımlı, unsafe-eval yok, uzak script yok
- [ ] Arayüz özel protokolden yükleniyor

**Paketleme**
- [ ] Electron Fuses CLAUDE.md'deki gibi
- [ ] Üretimde arayüz için DevTools kapalı
- [ ] Depoda gizli anahtar/token yok (`git grep -i -E "api[_-]?key|secret|token|password"`)
- [ ] Electron sürümü desteklenen güncel sürümlerden biri

## Rapor formatı

Kullanıcıya Türkçe ve sade yaz:

```
## Güvenlik Denetimi — [tarih]

Genel durum: ✅ Temiz / ⚠️ Dikkat gereken noktalar var / ❌ Kritik sorun var

### Bulgular
| Önem | Sorun | Dosya:satır | Ne anlama geliyor (sade dille) | Önerilen düzeltme |

### Otomatik tarama sonuçları
(kısa özet)

### Kontrol listesi
(geçen / geçmeyen maddeler)
```

Önem seviyeleri: Kritik (web sitesi bilgisayara erişebilir), Yüksek (veri sızabilir), Orta (savunma katmanı eksik), Düşük (iyileştirme önerisi).
