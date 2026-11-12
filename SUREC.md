# SUREC.md — Yol Haritası ve İlerleme

Bu dosya projenin hafızasıdır. Claude her oturumun başında okur, her görev bitince günceller.

**Şu anki faz:** Faz 2 — Erken uyumluluk testleri
**Sıradaki görev:** Faz 2 — (küçük, onay bekliyor: adres çubuğu boştayken başlık yerine alan adı göstersin — başlık taklidi riski; şu an başlık gösteriliyor) ve C: Google/Cloudflare kimlik araştırması (Opus, önce araştırma), sonra D

---

## Faz 0 — Hazırlık (kullanıcı yapar)

- [x] Node.js LTS kuruldu (`node -v` ile kontrol)
- [x] Git kuruldu (`git -v` ile kontrol)
- [ ] GitHub hesabı açıldı
- [x] VS Code + Claude Code eklentisi kuruldu
- [x] `Desktop/browser` klasörü VS Code'da açıldı, CLAUDE.md, SUREC.md ve `.claude/skills` içinde

## Faz 1 — Güvenli iskelet

Uygulama parçaları (model önerisi): 1 Git+iskelet 🟢 ✅ · 2 Araçlar 🟢 ✅ · 3 Güvenli pencere mimarisi 🔴 Opus ✅ · 4 IPC+preload 🔴 Opus ✅ · 5 Arayüz (adres çubuğu, gezinme düğmeleri) 🟢 ✅ · 6 Fuses+denetim+e2e 🔴 Opus ✅

Hedef: Açılan, siteleri gösteren, güvenlik ayarları ilk günden doğru kurulmuş bir pencere.

- [x] Git deposu oluştur, `.gitignore` ekle (remote: github.com/ataeyvaz/teneke) — ilk commit kullanıcı onayıyla
- [x] electron-vite + React + TypeScript (strict) + Tailwind proje iskeleti
- [x] ESLint, Prettier, Vitest, Playwright kurulumu ve npm script'leri
- [x] CLAUDE.md "Komutlar" bölümünü gerçek komutlarla güncelle
- [x] Ana pencere: arayüz için ayrı view, web içeriği için WebContentsView
- [x] Tüm güvenlik ayarları (CLAUDE.md Bölüm 5) + Electron Fuses — webPreferences, app://, CSP başlığı, izinler (varsayılan red), gezinme/pop-up/webview koruması, openExternal filtresi ✅; IPC (Parça 4) ✅ (Parça 4: tek giriş noktası `IpcRouter`, gönderen doğrulama, zod şemaları); Fuses ✅ (Parça 6: `electron-builder.yml`, `npm run test:packaged` ile doğrulanıyor; asar kurcalama denemesi açılışı engelledi)
- [x] Adres çubuğu: URL'ye git, URL değilse arama yap (varsayılan arama motoru ayarlanabilir olacak şekilde) — ana süreç (`resolveAddressInput`) + arayüz (`AddressBar`, Ctrl+L) ✅
- [x] Geri, ileri, yenile, durdur
- [x] Sayfa başlığı ve yükleniyor göstergesi
- [x] Electronegativity taraması temiz — 3 TENTATIVE bulgu incelendi, gerekçeleri kodda yorum olarak
- [x] İlk uçtan uca test: uygulama açılıyor, bir siteye gidiliyor (+ güvenlik ve kapanış testleri, `tests/e2e/`)

## Faz 2 — Erken uyumluluk testleri

Hedef: Büyük sorunları erken yakalamak.

- [x] `uyumluluk-testi` skill'i ile site listesini test et — 18/18 site açılıyor (`npm run test:compat`), html5test 523/555
- [ ] Google hesabı ile giriş — ❌ "Bu tarayıcı güvenli olmayabilir" (2026-11-12 elle test)
- [x] YouTube video oynatma, tam ekran, kalite — ✅ (elle test)
- [~] Bir WebGL oyun sitesi — poki.com oyunu oynanıyor ✅; reklamda "geç" düğmesi çıkmıyor ⚠️; krunker.io Cloudflare doğrulaması "security check failed" ❌
- [x] Dosya indirme (kaydetme yeri soruluyor) ve yükleme — ✅
- [x] WhatsApp Web QR girişi ✅, e-Devlet sayfası ✅, kopyala/yapıştır ✅, kapanışta kalan süreç yok ✅ (elle test)
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
- [ ] **İkili arama** (kullanıcı isteği 2026-11-12, sekmelerin hemen ardından): adres çubuğunda arama yapılınca içerik alanı ikiye bölünür, solda DuckDuckGo, sağda Google sonuçları. Ayarlarda **açma/kapama düğmesi** (toggle) olacak; varsayılan kapalı (gizlilik: aramalar Google'a da gider). Bölünmüş ekran altyapısı bununla birlikte gelir.

## Faz 4 — Koruma ve performans

- [ ] Reklam ve izleyici engelleyici (açma/kapama, site bazında istisna)
- [ ] HTTPS-only modu
- [ ] DNS-over-HTTPS seçeneği
- [ ] Sertifika hatası uyarı sayfası
- [ ] Sekme uyutma (kullanılmayan sekmeleri bellekten boşaltma)
- [ ] Açılış süresi ve bellek ölçümü, iyileştirme

## Faz 5 — Dağıtım

- [ ] electron-builder ile Windows kurulum dosyası (NSIS) — electron-builder Faz 1'de kuruldu (`win: dir` + Fuses); NSIS hedefi eklenecek
- [ ] Kod imzalama (Azure Trusted Signing veya sertifika)
- [ ] Otomatik güncelleme (GitHub Releases üzerinden)
- [ ] GitHub Actions: her push'ta test + güvenlik taraması, sürümde Windows derlemesi
- [ ] Renovate: Electron güncellemelerini otomatik takip
- [ ] **Güncelleme + geri alma düzeni** (kullanıcı isteği 2026-11-12): periyodik kontrol (Electron haftalık/güvenlikte hemen, diğerleri aylık), her güncelleme öncesi `pre-update-<tarih>` etiketi, ayrı dalda CI testleri, hata çıkarsa `git revert` + `npm ci`; dağıtılmış sürümde daha yüksek sürüm numarasıyla eski kodu yeniden yayınlama + kademeli dağıtım. Ayrıntı: `electron-guncelleme` skill'i

## Faz 6 — Farklılaşma (bize özgü özellikler)

- [ ] DuckDuckGo tarayıcısındaki özelliklerden esinlenenler (kullanıcı isteği 2026-11-12; hangileri olacağı netleştirilecek)
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

- Electronegativity: 3 "TENTATIVE / incelenmeli" bulgu kaldı, hepsi incelendi ve kabul edildi: (1) CSP_GLOBAL_CHECK `src/main/index.ts` — geliştirme CSP'sindeki `unsafe-inline` (yalnızca dev; üretim CSP'si sıkı), (2) CERTIFICATE_ERROR_EVENT — handler sadece logluyor, `preventDefault` yok → bağlantı reddediliyor, (3) OPEN_EXTERNAL — `isSafeExternalUrl` ile doğrulanıyor.
- İzinler: tam ekran, panoya yazma, fare kilidi sormadan veriliyor (Faz 2 kararı); diğer tüm izinler (kamera, mikrofon, konum, bildirim, panoyu okuma...) reddediliyor. İzin sorma arayüzü Faz 3.
- Açılır pencereler (`target=_blank`, `window.open`) şimdilik aynı sekmede açılıyor; Faz 3'te yeni sekmede açılacak.
- Playwright: engellenen bir gezinmeden sonra `page.url()`/`toHaveURL` boş ("") okuyabiliyor. Gezinme testlerinde adres ana süreçten okunur (`tabUrl()` — `tests/e2e/helpers.ts`).
- e2e testleri paketlenmiş `.exe` ile çalışmaz (Fuses hata ayıklama kapısını kapatıyor, bilerek). Paketlenmiş uygulama `npm run test:packaged` ile CDP üzerinden denetlenir.
- Sertifika hatası olan sitelerde bağlantı reddediliyor ama kullanıcıya uyarı sayfası yok (Faz 4).
- ~~Pencere kapanırken "Object has been destroyed" hata kutusu~~ — düzeltildi (2026-11-12): `TabManager.destroyAll()` artık yok edilmiş pencereye dokunmuyor. Kapanış e2e testi eklendi (`tests/e2e/lifecycle.spec.ts`); bu test ikinci bir kapanış hatasını da yakaladı (yüklenmeden kapanınca `win.show()`), düzeltildi.
- Electronegativity bakımı yavaş (son sürüm 2023-03) ve kurulum bağımlılığı `tar` için `npm audit` "critical" gösteriyor. Yalnızca geliştirme aracı, uygulamaya girmiyor. `npm audit fix --force` ÇALIŞTIRMA. Alternatif ileride değerlendirilebilir.
- `npm audit` ayrıca eslint/typescript-eslint zincirinde `minimatch` kaynaklı orta seviye uyarılar veriyor (yalnızca geliştirme aracı).

- `instagram.com` (www'suz): **ağ sorunu, Teneke hatası değil.** 2026-11-12'de `curl -4` de aynı IP'ye (31.13.65.174) zaman aşımı veriyor; IPv6 yok. Kullanıcının Chrome'u açıyor çünkü büyük olasılıkla önbellekteki kalıcı yönlendirme (301 → www) ile hiç bağlanmadan www'ya gidiyor. **Teneke eksiği düzeltildi (2026-11-12):** yükleme başarısız olunca artık "Tekrar dene" düğmeli hata sayfası çıkıyor.
- Google girişi "Bu tarayıcı güvenli olmayabilir" diyor; krunker.io'da Cloudflare doğrulaması başarısız. Olası neden: Electron'un tarayıcı kimliği (UA + `Sec-CH-UA` istemci ipuçları) gerçek Chrome ile tutarsız ve gömülü tarayıcı gibi görünüyor. Araştırılacak (taklit/kimlik konusu güvenlik ve dürüstlük açısından ayrıca değerlendirilecek).
- ~~Sağ tık menüsü yok~~ — eklendi (2026-11-12): sayfa (Geri/İleri/Yenile), seçili metin, bağlantı adresini kopyala, resmi kaydet/adresini kopyala, düzenlenebilir alanlar ve adres çubuğu. "Bağlantıyı yeni sekmede aç" Faz 3'te.
- Instagram girişi (`accounts.meta.com`) Windows Güvenliği "geçiş anahtarı / güvenlik anahtarı" penceresi açıyor (WebAuthn). Teneke bunu Windows'a iletiyor; İptal denebilir. Geçiş anahtarının izinli olup olmayacağına Faz 3 izin yöneticisinde karar verilecek.
- ~~Temel kısayollar~~ — eklendi (2026-11-12): F5/Ctrl+R yenile, Ctrl+Shift+R/Ctrl+F5 önbelleksiz yenile, Alt+←/→ geri/ileri, Esc (yüklenirken) durdur, Ctrl+L/F6/Alt+D adres çubuğu; sayfa odaktayken de çalışır. Ctrl+Enter: "google" → www.google.com. Sekme/arama kısayolları (Ctrl+T/W/Tab/Shift+T/F) Faz 3'te.
- Düzeltildi (2026-11-12): pencere, arayüz yüklenmeden (gizliyken) kapanırsa `win.show()` yok edilmiş pencereye dokunup "Object has been destroyed" hata kutusu çıkarıyordu (yalnızca testlerde, program kapatınca). Korumalar eklendi.
- Kamera/mikrofon reddediliyor (WhatsApp görüntülü arama "izin verin" diyor) — beklenen, izin sorma arayüzü Faz 3.
- krunker.io'da yükleme çubuğu durmadan dönüyor (sayfa sürekli yeniden yükleniyor olabilir — Cloudflare döngüsü); poki.com'da reklamın "geç" düğmesi görünmüyor. İncelenecek.
- Uyumluluk testinde 18 ağır site sonrası kapanış 20 sn'yi aşabiliyor (test uyarı verip süreci sonlandırıyor). Elle kullanımda kalan süreç **yok** (kullanıcı Görev Yöneticisi'nde doğruladı, 2026-11-12) — yalnızca test ortamına özgü görünüyor.
- Uyumluluk testinin ekran görüntüsü bazen bir önceki siteyi gösterebiliyor (ör. `web_whatsapp_com.png`'de Outlook); başlık/durum kodu doğru. Ekran görüntüsü zamanlaması iyileştirilebilir.
- sahibinden.com bir çalıştırmada 403 + "Bir dakika lütfen..." (bot kontrolü), diğerinde 200 verdi. Elle kullanımda kontrol edilmeli.
- ~~Pencere kapatılırken "kaydedilmemiş değişiklik" (beforeunload) olan siteler hiç sorulmadan kapanıyordu~~ — düzeltildi: pencere önce sekmeleri beforeunload'a sorarak kapatır, Chrome gibi "Bu siteden ayrılmak istiyor musunuz?" sorusu çıkar; "Kal" denirse pencere açık kalır (e2e testli).

## Karar Günlüğü

| Tarih      | Karar                                                                                                                                                          | Neden                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| —          | Electron + TypeScript seçildi                                                                                                                                  | Chromium uyumluluğu, güvenlik yamalarının hızlı gelmesi, çapraz platform, yapay zekayla geliştirmeye uygunluk            |
| —          | `<webview>` yerine `WebContentsView`                                                                                                                           | Daha güvenli ve Electron'un önerdiği modern API                                                                          |
| 2026-11-12 | Proje adı **Teneke**, GitHub: ataeyvaz/teneke                                                                                                                  | Kullanıcı belirledi                                                                                                      |
| 2026-11-12 | TypeScript 6.0 (7.0 değil)                                                                                                                                     | typescript-eslint henüz TS < 6.1 destekliyor                                                                             |
| 2026-11-12 | Electron 45, electron-vite 6, Vite 8, React 19, Tailwind 4                                                                                                     | Kurulum anındaki en güncel kararlı sürümler                                                                              |
| 2026-11-12 | Faz 1 altı parçaya bölündü; güvenlik parçaları (3, 4, 6) Opus ile, diğerleri Sonnet ile                                                                        | Maliyet/kalite dengesi                                                                                                   |
| 2026-11-12 | Araçlar: ESLint 10 (strictTypeChecked), Prettier, Vitest 5, Playwright, Electronegativity                                                                      | CLAUDE.md yığın listesi; kurallar `eslint.config.mjs` içinde (renderer'da Node/electron import yasak, test atlama yasak) |
| 2026-11-12 | E2E testler `npm run test:e2e` ile önce derlenir; `--pass-with-no-tests` ilk e2e test Parça 6'ya kadar                                                         | Boş test klasörü hata vermesin                                                                                           |
| 2026-11-12 | Arayüz `app://ui` özel protokolünden, CSP HTTP başlığıyla (`src/main/app/csp.ts`); dev modda gevşetilmiş dev CSP (unsafe-inline, eval yok)                     | Vite/React hızlı yenileme inline betik gerektiriyor; üretim CSP'si sıkı kalıyor                                          |
| 2026-11-12 | BaseWindow + ayrı WebContentsView'lar; arayüz `teneke-ui` (bellekte), siteler `persist:default` oturumunda                                                     | Arayüz ve web içeriği hiçbir şey paylaşmasın                                                                             |
| 2026-11-12 | Sitelere giden User-Agent'tan `Electron/x` ve `teneke/x` çıkarıldı                                                                                             | Uyumluluk: Google girişi vb. gömülü tarayıcıları engelliyor                                                              |
| 2026-11-12 | Varsayılan açılış sayfası DuckDuckGo                                                                                                                           | Kullanıcı onayladı; Faz 3'te ayarlanabilir olacak                                                                        |
| 2026-11-12 | Bağımlılıklar periyodik güncellenecek ve her güncelleme geri alınabilir olacak (etiket + ayrı dal + revert/`npm ci` + yüksek sürümle geri yayın)               | Kullanıcı isteği; güvenlik yamaları hızlı alınmalı ama hata halinde güvenle geri dönülmeli                               |
| 2026-11-12 | `zod` eklendi (yalnızca ana süreçte)                                                                                                                           | IPC girdi doğrulaması; kullanıcı onayladı. Sandbox'lı preload'a girmez (preload yalnızca `electron` require eder)        |
| 2026-11-12 | Tüm IPC tek kapıdan: `src/main/ipc/IpcRouter.ts` (gönderen = kayıtlı arayüz view'ı + ana çerçeve + arayüz kökeni; argümanlar zod tuple şemasıyla)              | Yeni kanal eklerken bu kalıp dışına çıkılmaz                                                                             |
| 2026-11-12 | Adres çubuğu girdisi hiçbir zaman çalıştırılmaz: http(s) ya da alan adı değilse aramaya gider (`javascript:`, `file:` dahil)                                   | Güvenlik                                                                                                                 |
| 2026-11-12 | Araç şeridi tek satır, 48 px (`TOOLBAR_HEIGHT`); arayüzde satır içi `style` yok (CSP `style-src 'self'`), yalnızca Tailwind sınıfları + CSS dosyası            | CSP sıkı kalsın                                                                                                          |
| 2026-11-12 | Adres çubuğu boştayken sayfa başlığını, odaklanınca tam URL'yi gösterir; arayüz URL üretmez, metni ana sürece yollar                                           | Güvenlik: tek karar noktası `resolveAddressInput`                                                                        |
| 2026-11-12 | `electron-builder` Faz 5'ten öne alındı (sadece `dir` hedefi) + `@electron/fuses`, `@electron/asar`                                                            | Fuses yalnızca paketlenmiş uygulamada çevrilir; kullanıcı onayladı                                                       |
| 2026-11-12 | Fuses: RunAsNode, NODE_OPTIONS, inspect kapalı; asar bütünlüğü + yalnızca asar açık; ek olarak çerez şifreleme açık, file:// ek yetkileri kapalı               | CLAUDE.md Bölüm 5 + Electron önerileri                                                                                   |
| 2026-11-12 | Tüm bağımlılıklar devDependencies; `zod` ana sürece gömülü (`externalizeDeps.exclude`)                                                                         | Paket `node_modules` içermez; `app.asar` ~750 KB                                                                         |
| 2026-11-12 | İzin istisnaları: tam ekran (`fullscreen`), panoya yazma (`clipboard-sanitized-write`), fare kilidi (`pointerLock`) sormadan verilir; diğer her şey reddedilir | Kullanıcı onayladı; Chrome da bunları sormadan verir, düşük risk. Varsayılan RED kuralı değişmedi                        |
| 2026-11-12 | İkili arama (DDG + Google yan yana) Faz 3 sekmelerinin hemen ardından; ayarlarda açma/kapama düğmesi                                                           | Kullanıcı isteği; gizlilik nedeniyle isteğe bağlı                                                                        |
| 2026-11-12 | Gerçek site testleri ayrı: `npm run test:compat` (internet gerekir), `test:e2e` internetsiz kalır                                                              | Testler tekrarlanabilir olsun                                                                                            |
| 2026-11-12 | Pencere kapanışı: önce sekmeler `close({ waitForBeforeUnload: true })`, sonra pencere                                                                          | BaseWindow alt view'lara beforeunload sormuyor; veri kaybını önlemek için Chrome davranışı                               |
| 2026-11-12 | Yükleme hatası sayfası tarayıcı arayüzü (UI view) tarafından çiziliyor; hata varken UI view tüm pencereyi kaplar, sekme view'ı gizlenir                        | Web içeriğine yeni origin/kapı açmamak; siteler hata sayfasını taklit edemez                                             |
