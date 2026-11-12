---
name: electron-guncelleme
description: Electron'u ve bağımlılıkları güvenli şekilde güncelleme. Kullanıcı "güncelle", "yeni Electron sürümü", "güvenlik yaması" dediğinde, Renovate bir güncelleme önerdiğinde veya npm audit açık bildirdiğinde kullan. Tarayıcı güvenliği Chromium yamalarının hızla kullanıcıya ulaşmasına bağlı olduğu için bu iş ertelenmemeli.
---

# Electron ve Bağımlılık Güncelleme

## Neden önemli

Tarayıcının güvenliği büyük ölçüde Chromium güvenlik yamalarına bağlı. Electron bu yamaları düzenli yayınlar; geride kalmak kullanıcıyı bilinen açıklara maruz bırakır. Hedef: güvenlik içeren Electron sürümlerini birkaç gün içinde almak.

## Periyodik kontrol (kullanıcı kararı, 2026-11-12)

- Electron: güvenlik sürümleri birkaç gün içinde; ayrıca en az **haftada bir** `npm outdated` + `npm audit` kontrolü (Renovate kurulunca otomatik).
- Diğer bağımlılıklar (Tailwind, React, Vite, ...): **ayda bir** toplu kontrol; büyük sürüm atlamaları tek tek ve ayrı dalda.

## Adımlar

0. **Geri dönüş noktası oluştur:** çalışma ağacı temiz olmalı; mevcut hali etiketle: `git tag pre-update-<tarih>` (ör. `pre-update-2026-12-01`). `package-lock.json` her zaman commit'li olmalı.
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

## Geri alma (rollback)

Güncelleme sonrası bir hata çıkarsa:

1. **Henüz ana dala birleşmediyse:** dalı bırak, ana dala dön: `git checkout main` → `npm ci` (kilit dosyasındaki eski sürümler birebir geri kurulur).
2. **Ana dala birleştiyse:** güncelleme commit'ini geri al: `git revert <commit>` → `npm ci` → `npm run typecheck`, `npm test`, `npm run test:e2e` ile eski halin çalıştığını doğrula.
3. **Kullanıcılara dağıtıldıysa (Faz 5 sonrası):** eski kodu **daha yüksek bir sürüm numarasıyla** yeniden yayınla (ör. 1.4.0 bozuksa → 1.4.1 = 1.3.x kodu); otomatik güncelleme kullanıcıları buna taşır. Kademeli dağıtım (staged rollout) ile önce küçük bir yüzdeye yayınla.
4. Sorunu SUREC.md "Bilinen Sorunlar"a yaz; sorunlu sürümü Renovate'te geçici olarak engelle, düzeltilince yeniden dene.
5. Güvenlik yaması içeren bir Electron sürümünden geri dönüş kalıcı olamaz: en kısa sürede düzeltip yeniden güncelle.

Bir güncelleme testleri bozuyorsa ve düzeltmek için güvenlik ayarı değiştirmek gerekiyorsa, önce kullanıcıya danış; güvenlik ayarlarını gevşetme.
