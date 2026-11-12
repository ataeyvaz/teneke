---
name: uyumluluk-testi
description: Tarayıcının web sitesi uyumluluğunu test etme. Faz 2'de, her Electron güncellemesinden sonra, sürüm öncesinde ve kullanıcı "şu site açılmıyor", "uyumluluk", "siteleri test et" dediğinde kullan.
---

# Uyumluluk Testi

İki parça var: otomatik testler (Claude çalıştırır) ve elle test listesi (kullanıcı yapar, çünkü giriş yapma, video izleme gibi şeyler gerçek kullanım ister).

## 1. Otomatik duman testi
`tests/e2e/compat.spec.ts` yoksa oluştur. Aşağıdaki her site için: sayfa yükleniyor mu, başlık boş değil mi, konsolda kritik hata var mı. Sonra `npm run test:e2e` çalıştır.

Siteler: google.com, youtube.com, wikipedia.org, github.com, x.com, instagram.com, reddit.com, amazon.com.tr, trendyol.com, hepsiburada.com, sahibinden.com, turkiye.gov.tr, eksisozluk.com, docs.google.com, outlook.live.com, web.whatsapp.com, figma.com, html5test.com

## 2. Kullanıcının elle test listesi
Bu listeyi kullanıcıya Türkçe ve tıklanabilir adımlarla ver, sonuçları birlikte değerlendir:

- [ ] Google hesabına giriş (uyarı çıkıyor mu?)
- [ ] YouTube: video oynat, tam ekran, kalite değiştir
- [ ] WhatsApp Web: QR ile bağlan
- [ ] Bir banka veya e-Devlet girişi (sadece giriş sayfasının düzgün açılması yeterli)
- [ ] Bir WebGL oyunu
- [ ] Dosya indirme ve açma
- [ ] Dosya yükleme (bir sitede fotoğraf yükle)
- [ ] Kamera/mikrofon izni — izin sorusu geliyor mu?
- [ ] Bildirim izni sorusu
- [ ] Yazdırma / PDF kaydet
- [ ] Netflix (Faz 7'ye kadar çalışmaması normal; hata mesajı düzgün mü?)

## 3. Raporla
```
## Uyumluluk Raporu — [tarih], Electron [sürüm]
| Site / Senaryo | Sonuç | Not |
```
Başarısız olanları SUREC.md "Bilinen Sorunlar"a ekle. Bir sorunu çözmek için güvenlik ayarı gevşetmek gerekiyor gibi görünüyorsa ASLA gevşetme; kullanıcıya açıkla ve alternatif ara (ör. user-agent ayarı, izin yönetimi).
