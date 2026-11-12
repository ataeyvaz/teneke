# CLAUDE.md — Proje Anayasası

Bu dosya her oturumun başında okunur. Buradaki kurallar, kullanıcının o anki isteğinden önce gelir. Bir istek bu kurallarla çelişirse, uygulamadan önce kullanıcıya çelişkiyi açıkla ve onay iste.

## 1. Proje

Windows için güvenli, uyumlu ve hızlı bir masaüstü web tarayıcısı. İleride macOS ve Linux'a taşınacak, bu yüzden her karar çapraz platform düşünülerek verilir.

Öncelik sırası (çatışma olursa bu sırayla karar ver):

1. **Güvenlik** — kullanıcının bilgisayarı ve verisi
2. **Uyumluluk** — neredeyse tüm web sitelerinin sorunsuz açılması
3. **Performans** — hızlı açılış, akıcı sekmeler, kontrollü bellek
4. Görünüm ve ekstra özellikler

## 2. Kullanıcı hakkında (önemli)

- Proje sahibinin yazılım bilgisi düşük. Kodu sen yazıyorsun; o ürün sahibi ve test eden kişi.
- **Kullanıcıyla her zaman Türkçe konuş.** Kod, değişken adları, kod yorumları ve commit mesajları İngilizce olsun.
- Her işin sonunda neyi değiştirdiğini teknik olmayan, kısa bir dille anlat: "Ne yaptım, neden yaptım, nasıl test edersin."
- Kullanıcının terminalde çalıştırması gereken her komutu tam olarak, kopyalanabilir şekilde ver.
- Belirsiz bir istekte tahmin yürütme; tek, net bir soru sor.

## 3. Teknoloji yığını (değiştirmeden önce kullanıcıya sor)

- Electron (en güncel kararlı sürüm) + TypeScript (`strict: true`)
- electron-vite (derleme), React + Tailwind CSS (arayüz)
- SQLite / better-sqlite3 (geçmiş, yer imleri, ayarlar — sadece main process'te)
- @ghostery/adblocker-electron (reklam ve izleyici engelleme)
- electron-builder + electron-updater (Windows NSIS kurulum dosyası, otomatik güncelleme)
- Vitest (birim test), Playwright (Electron uçtan uca test)
- ESLint + Prettier, Electronegativity (güvenlik taraması)
- GitHub Actions (CI), Renovate (bağımlılık güncellemeleri)
- Paket yöneticisi: npm

Yeni bir bağımlılık (npm paketi) eklemeden önce: neden gerektiğini, bakımının aktif olup olmadığını ve alternatifini kullanıcıya açıkla. Gereksiz paket ekleme.

## 4. Mimari

```
src/
  main/            # Electron ana süreç (Node erişimi burada)
    app/           # uygulama yaşam döngüsü, pencere oluşturma
    tabs/          # TabManager — WebContentsView ile sekmeler
    sessions/      # SessionManager — normal ve gizli oturumlar
    permissions/   # PermissionManager — kamera, mikrofon, konum, bildirim...
    downloads/     # DownloadManager
    blocker/       # reklam/izleyici engelleme servisi
    storage/       # SQLite erişimi (geçmiş, yer imleri, ayarlar)
    updater/       # otomatik güncelleme
    ipc/           # tüm IPC kanalları ve doğrulama
  preload/         # SADECE arayüz (browser UI) için dar, tipli API
  renderer/        # tarayıcının kendi arayüzü (React)
  shared/          # ortak tipler ve IPC sözleşmeleri
tests/
  unit/
  e2e/
```

Kurallar:

- Her modülün tek bir sorumluluğu var. Modüller birbirine doğrudan değil, açık arayüzler üzerinden bağlanır.
- Motora (Electron) özgü kod `main/` içinde kalır; ileride motor değişirse sadece bu katman değişmeli.
- Web sitelerinin içeriği **asla** arayüzle aynı renderer'da çalışmaz. Siteler `WebContentsView` içinde, arayüz ayrı bir view'da.
- `<webview>` etiketi kullanılmaz.

## 5. Güvenlik kuralları — DEĞİŞTİRİLEMEZ

Bu kurallar bir hatayı çözmek, bir özelliği çalıştırmak ya da "geçici olarak" bile gevşetilemez. Bir sorun bu kuralları gevşetmeden çözülemiyorsa DUR, kullanıcıya durumu açıkla ve alternatif öner.

**Web içeriği (sitelerin açıldığı her WebContentsView):**

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- `webSecurity: true`
- `allowRunningInsecureContent: false`
- `experimentalFeatures: false`
- Web içeriğine **preload verilmez**. Gerekirse sadece güvenlik incelemesinden geçmiş, minimal bir preload.
- `nodeIntegrationInSubFrames`, `nodeIntegrationInWorker` asla açılmaz.

**Arayüz (browser UI) renderer'ı:**

- Aynı izolasyon ayarları (`contextIsolation`, `sandbox`, `nodeIntegration: false`).
- Sıkı bir Content-Security-Policy; `unsafe-eval` yok, uzak script yok.
- Preload'da `contextBridge` ile sadece tek tek tanımlanmış fonksiyonlar açılır. `ipcRenderer`'ın kendisi asla açılmaz.

**IPC:**

- Her IPC mesajında gönderenin (`event.senderFrame`) arayüz olduğu doğrulanır; web içeriğinden gelen mesajlar reddedilir.
- Her girdi tip ve değer olarak doğrulanır (ör. zod ile).
- Dosya yolu, URL ya da komut içeren girdiler ayrıca temizlenir.

**Gezinme ve izinler:**

- `setPermissionRequestHandler` ve `setPermissionCheckHandler` her oturumda tanımlı; varsayılan cevap REDDET. İzinler kullanıcıya sorulur ve site bazında saklanır.
- `shell.openExternal` sadece doğrulanmış `http`, `https`, `mailto` adreslerine; diğer protokoller reddedilir.
- `will-navigate`, `setWindowOpenHandler` ve `will-attach-webview` kontrol altında. Açılır pencereler sekme olarak açılır.
- `file://` ve özel protokoller kontrollüdür; arayüz kendi özel protokolünden (`app://`) yüklenir.
- Sertifika hataları sessizce geçilmez; kullanıcıya açık bir uyarı sayfası gösterilir.

**Paketleme:**

- Electron Fuses: `RunAsNode` kapalı, `EnableNodeOptionsEnvironmentVariable` kapalı, `EnableNodeCliInspectArguments` kapalı, `EnableEmbeddedAsarIntegrityValidation` açık, `OnlyLoadAppFromAsar` açık.
- DevTools üretim sürümünde arayüz için kapalı.
- Gizli anahtar, token, şifre asla koda veya depoya yazılmaz.

**Gizlilik:**

- Telemetri yok (kullanıcı açıkça istemedikçe).
- Gizli mod: kalıcı olmayan ayrı bir `session` partition; kapanınca her şey silinir.

## 6. Çalışma düzeni

1. Her oturumun başında `SUREC.md` dosyasını oku; hangi fazda olduğumuzu ve sıradaki görevi oradan öğren.
2. **Küçük adımlar:** Bir seferde tek bir özellik veya düzeltme. Büyük bir iş varsa önce plan yaz, kullanıcıdan onay al, sonra parça parça uygula.
3. Kod yazmadan önce kısa bir plan sun (hangi dosyalar, ne değişecek).
4. Her özellik testle gelir. Test yazılmadan bir görev "bitti" sayılmaz.
5. İş bitince sırayla çalıştır: `npm run typecheck`, `npm run lint`, `npm test`. Hepsi geçmeden "bitti" deme.
6. Güvenlik ayarlarına, IPC'ye, izinlere veya gezinmeye dokunan her değişiklikten sonra `guvenlik-denetimi` skill'ini uygula.
7. Bitirince `SUREC.md` içinde ilgili görevi işaretle ve "Karar Günlüğü"ne önemli kararları ekle.
8. Kullanıcıya commit için hazır kısa bir İngilizce commit mesajı öner (Conventional Commits: `feat:`, `fix:`, `chore:`...).
9. Emin olmadığın bir Electron API'si için tahmin yürütme; resmi dokümantasyonu kontrol et.

## 7. Komutlar

- `npm run dev` — geliştirme modunda çalıştır
- `npm run build` — tip kontrolü + üretim derlemesi (`out/` klasörüne)
- `npm start` — derlenmiş uygulamayı çalıştır
- `npm run typecheck` — TypeScript kontrolü (main/preload + renderer + e2e testleri)
- `npm run lint` — ESLint (strict, tip bilgili; `any`, eval, atlanmış test yasak)
- `npm run lint:fix` / `npm run format` — otomatik düzeltme / Prettier ile biçimlendirme
- `npm run format:check` — biçim kontrolü
- `npm test` — Vitest birim testleri (`tests/unit/`)
- `npm run test:e2e` — derle + Playwright uçtan uca testler (`tests/e2e/`, internetsiz yerel test sitesiyle)
- `npm run security` — Electronegativity taraması
- `npm run pack` — paketlenmiş uygulama, kurulumsuz (`release/win-unpacked/Teneke.exe`), Electron Fuses çevrilmiş
- `npm run test:packaged` — paketlenmiş uygulamayı denetle (Fuses, asar içeriği, RunAsNode, açılış/kapanış); önce `npm run pack`
- `npm run dist` — Windows kurulum dosyası (Faz 5'te eklenecek)

## 8. Yapma listesi

- Güvenlik ayarlarını kapatarak bir hatayı "çözme".
- Testleri silerek veya atlayarak (`.skip`) geçirme.
- `any` tipini yaygın kullanma; zorunluysa nedenini yorumla.
- Kullanıcıya sormadan büyük refactor, teknoloji değişikliği veya dosya silme.
- Hata mesajlarını yutma; her hata loglanır ve anlamlı şekilde ele alınır.
- Çalışmayan kodu "çalışıyor" diye raporlama. Test etmediysen açıkça söyle.
