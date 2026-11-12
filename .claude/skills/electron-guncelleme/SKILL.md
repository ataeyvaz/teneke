---
name: electron-guncelleme
description: Electron'u ve bağımlılıkları güvenli şekilde güncelleme. Kullanıcı "güncelle", "yeni Electron sürümü", "güvenlik yaması" dediğinde, Renovate bir güncelleme önerdiğinde veya npm audit açık bildirdiğinde kullan. Tarayıcı güvenliği Chromium yamalarının hızla kullanıcıya ulaşmasına bağlı olduğu için bu iş ertelenmemeli.
---

# Electron ve Bağımlılık Güncelleme

## Neden önemli

Tarayıcının güvenliği büyük ölçüde Chromium güvenlik yamalarına bağlı. Electron bu yamaları düzenli yayınlar; geride kalmak kullanıcıyı bilinen açıklara maruz bırakır. Hedef: güvenlik içeren Electron sürümlerini birkaç gün içinde almak.

## Adımlar

1. Yeni bir git dalı aç: `git checkout -b chore/electron-update`
2. Mevcut ve hedef sürümü belirle (`npm view electron version`).
3. Hedef sürümün sürüm notlarını ve "breaking changes" listesini kontrol et; projeyi etkileyen değişiklikleri kullanıcıya sade dille özetle.
4. Güncelle: `npm install electron@<sürüm> --save-dev`. Büyük sürüm atlamasıysa tek tek ilerle.
5. Sırayla çalıştır: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`.
6. `guvenlik-denetimi` skill'ini uygula (Fuses ve webPreferences varsayılanları değişmiş olabilir).
7. `uyumluluk-testi` otomatik kısmını çalıştır.
8. Diğer bağımlılıklar için `npm outdated` ve `npm audit`; sadece güvenlik açığı olanları veya kullanıcının onayladıklarını güncelle.
9. Kullanıcıya rapor ver: ne güncellendi, neler test edildi, elle neyi denemeli. Commit mesajı öner: `chore(deps): update electron to vX.Y.Z`.
10. Kullanıcı onaylarsa dalı ana dala birleştirme adımlarını ver.

Bir güncelleme testleri bozuyorsa ve düzeltmek için güvenlik ayarı değiştirmek gerekiyorsa, önce kullanıcıya danış; güvenlik ayarlarını gevşetme.
