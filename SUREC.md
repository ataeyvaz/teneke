# SUREC.md — Yol Haritası ve İlerleme

Bu dosya projenin hafızasıdır. Claude her oturumun başında okur, her görev bitince günceller.

**Şu anki faz:** Faz 1 — Güvenli iskelet
**Sıradaki görev:** Faz 1 / Parça 3 — Güvenli pencere mimarisi (WebContentsView, güvenlik ayarları, app://, izin/gezinme kontrolü) 🔴 **Opus'a geç** (`/model`)

---

## Faz 0 — Hazırlık (kullanıcı yapar)

- [x] Node.js LTS kuruldu (`node -v` ile kontrol)
- [x] Git kuruldu (`git -v` ile kontrol)
- [ ] GitHub hesabı açıldı
- [x] VS Code + Claude Code eklentisi kuruldu
- [x] `Desktop/browser` klasörü VS Code'da açıldı, CLAUDE.md, SUREC.md ve `.claude/skills` içinde

## Faz 1 — Güvenli iskelet

Uygulama parçaları (model önerisi): 1 Git+iskelet 🟢 ✅ · 2 Araçlar 🟢 ✅ · 3 Güvenli pencere mimarisi 🔴 Opus · 4 IPC+preload 🔴 Opus · 5 Arayüz (adres çubuğu, gezinme düğmeleri) 🟢 · 6 Fuses+denetim+e2e 🔴 Opus

Hedef: Açılan, siteleri gösteren, güvenlik ayarları ilk günden doğru kurulmuş bir pencere.

- [x] Git deposu oluştur, `.gitignore` ekle (remote: github.com/ataeyvaz/teneke) — ilk commit kullanıcı onayıyla
- [x] electron-vite + React + TypeScript (strict) + Tailwind proje iskeleti
- [x] ESLint, Prettier, Vitest, Playwright kurulumu ve npm script'leri
- [x] CLAUDE.md "Komutlar" bölümünü gerçek komutlarla güncelle
- [ ] Ana pencere: arayüz için ayrı view, web içeriği için WebContentsView
- [ ] Tüm güvenlik ayarları (CLAUDE.md Bölüm 5) + Electron Fuses
- [ ] Adres çubuğu: URL'ye git, URL değilse arama yap (varsayılan arama motoru ayarlanabilir olacak şekilde)
- [ ] Geri, ileri, yenile, durdur
- [ ] Sayfa başlığı ve yükleniyor göstergesi
- [ ] Electronegativity taraması temiz
- [ ] İlk uçtan uca test: uygulama açılıyor, bir siteye gidiliyor

## Faz 2 — Erken uyumluluk testleri

Hedef: Büyük sorunları erken yakalamak.

- [ ] `uyumluluk-testi` skill'i ile site listesini test et
- [ ] Google hesabı ile giriş
- [ ] YouTube video oynatma, tam ekran
- [ ] Bir WebGL oyun sitesi
- [ ] Dosya indirme
- [ ] Bulunan sorunları "Bilinen Sorunlar" bölümüne yaz ve çöz

## Faz 3 — Temel tarayıcı

- [ ] Sekmeler (aç, kapat, sırala, kısayollar: Ctrl+T, Ctrl+W, Ctrl+Tab)
- [ ] Geçmiş (SQLite) ve geçmiş sayfası
- [ ] Yer imleri ve yer imi çubuğu
- [ ] İndirme yöneticisi (indirileni aç, klasörde göster)
- [ ] İzin yöneticisi arayüzü (site bazında izinler)
- [ ] Gizli mod (ayrı, kalıcı olmayan oturum)
- [ ] Ayarlar sayfası (arama motoru, ana sayfa, indirme klasörü)
- [ ] Sayfa içinde bul (Ctrl+F), yakınlaştırma, yazdırma / PDF kaydet
- [ ] Oturumu geri yükleme (kapanınca açık sekmeler)

## Faz 4 — Koruma ve performans

- [ ] Reklam ve izleyici engelleyici (açma/kapama, site bazında istisna)
- [ ] HTTPS-only modu
- [ ] DNS-over-HTTPS seçeneği
- [ ] Sertifika hatası uyarı sayfası
- [ ] Sekme uyutma (kullanılmayan sekmeleri bellekten boşaltma)
- [ ] Açılış süresi ve bellek ölçümü, iyileştirme

## Faz 5 — Dağıtım

- [ ] electron-builder ile Windows kurulum dosyası (NSIS)
- [ ] Kod imzalama (Azure Trusted Signing veya sertifika)
- [ ] Otomatik güncelleme (GitHub Releases üzerinden)
- [ ] GitHub Actions: her push'ta test + güvenlik taraması, sürümde Windows derlemesi
- [ ] Renovate: Electron güncellemelerini otomatik takip

## Faz 6 — Farklılaşma (bize özgü özellikler)

- [ ] Bölünmüş ekran
- [ ] Okuma listesi
- [ ] Ekran görüntüsü alma ve koleksiyonu
- [ ] Yapay zeka asistanı (sayfa özeti vb.)
- [ ] Tema ve görsel kimlik
- [ ] (Yeni fikirler buraya)

## Faz 7 — Uyumluluk genişletme ve platformlar

- [ ] DRM desteği (Netflix vb.) — castLabs Electron + Widevine
- [ ] Chrome eklenti desteği (kısmi)
- [ ] macOS sürümü (imzalama + notarization)
- [ ] Linux sürümü (AppImage / deb)

---

## Her oturumda çalışma şablonu

Claude Code'a her yeni oturumda şunu yazman yeterli:

> SUREC.md'yi oku ve sıradaki görevi yapalım.

Bir görev bitince:

1. Claude'un anlattığı adımlarla kendin test et.
2. Çalışıyorsa VS Code'da commit et (Claude'un önerdiği mesajla).
3. Çalışmıyorsa ne gördüğünü (hata mesajı, ekran görüntüsü) Claude'a ver.

Her fazın sonunda:

> guvenlik-denetimi skill'ini kullanarak tüm projeyi denetle.

---

## Bilinen Sorunlar

- Parça 1 iskeletindeki CSP (`src/renderer/index.html`) geçici: `style-src 'unsafe-inline'` ve geliştirme modu için `ws://localhost`. Parça 3'te `app://` protokolü ve başlık tabanlı CSP ile sıkılaştırılacak.
- `src/main/app/window.ts` geçici tek pencere; Parça 3'te ayrı WebContentsView mimarisiyle değişecek.

- Electronegativity taraması şu an 5 bulgu veriyor (gezinme sınırı, izin işleyicisi, preload incelemesi, CSP, auxclick). Hepsi Parça 3–4'te çözülecek; Faz 1 sonunda temiz olmalı.
- Electronegativity bakımı yavaş (son sürüm 2023-03) ve kurulum bağımlılığı `tar` için `npm audit` "critical" gösteriyor. Yalnızca geliştirme aracı, uygulamaya girmiyor. `npm audit fix --force` ÇALIŞTIRMA. Alternatif ileride değerlendirilebilir.
- `npm audit` ayrıca eslint/typescript-eslint zincirinde `minimatch` kaynaklı orta seviye uyarılar veriyor (yalnızca geliştirme aracı).

## Karar Günlüğü

| Tarih      | Karar                                                                                                  | Neden                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| —          | Electron + TypeScript seçildi                                                                          | Chromium uyumluluğu, güvenlik yamalarının hızlı gelmesi, çapraz platform, yapay zekayla geliştirmeye uygunluk            |
| —          | `<webview>` yerine `WebContentsView`                                                                   | Daha güvenli ve Electron'un önerdiği modern API                                                                          |
| 2026-11-12 | Proje adı **Teneke**, GitHub: ataeyvaz/teneke                                                          | Kullanıcı belirledi                                                                                                      |
| 2026-11-12 | TypeScript 6.0 (7.0 değil)                                                                             | typescript-eslint henüz TS < 6.1 destekliyor                                                                             |
| 2026-11-12 | Electron 45, electron-vite 6, Vite 8, React 19, Tailwind 4                                             | Kurulum anındaki en güncel kararlı sürümler                                                                              |
| 2026-11-12 | Faz 1 altı parçaya bölündü; güvenlik parçaları (3, 4, 6) Opus ile, diğerleri Sonnet ile                | Maliyet/kalite dengesi                                                                                                   |
| 2026-11-12 | Araçlar: ESLint 10 (strictTypeChecked), Prettier, Vitest 5, Playwright, Electronegativity              | CLAUDE.md yığın listesi; kurallar `eslint.config.mjs` içinde (renderer'da Node/electron import yasak, test atlama yasak) |
| 2026-11-12 | E2E testler `npm run test:e2e` ile önce derlenir; `--pass-with-no-tests` ilk e2e test Parça 6'ya kadar | Boş test klasörü hata vermesin                                                                                           |
