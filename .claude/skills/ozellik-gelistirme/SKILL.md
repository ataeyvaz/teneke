---
name: ozellik-gelistirme
description: Tarayıcıya yeni bir özellik ekleme veya bir hatayı düzeltme iş akışı. Kullanıcı bir özellik istediğinde, "sıradaki görev", "SUREC.md'deki görevi yap", "şunu ekle", "şu çalışmıyor" dediğinde veya herhangi bir kod değişikliğine başlarken MUTLAKA kullan.
---

# Özellik Geliştirme Akışı

Kullanıcının yazılım bilgisi düşük. Bu akış, her değişikliğin küçük, test edilmiş, güvenli ve anlaşılır olmasını sağlar.

## 1. Anla
- SUREC.md'yi oku, görevin hangi faza ait olduğunu belirle.
- İstek belirsizse tek, net bir soru sor.
- Görev büyükse (birden fazla modül, 5+ dosya) parçalara böl.

## 2. Plan sun (kod yazmadan önce)
Kullanıcıya Türkçe, kısa:
- Ne yapacağım (1-2 cümle)
- Hangi dosyalar değişecek / eklenecek
- Güvenliğe dokunuyor mu? (evet ise neden ve nasıl güvende kalacak)
- Yeni npm paketi gerekiyor mu? (evet ise neden)
- Nasıl test edeceğiz

Küçük ve güvenliğe dokunmayan işlerde onay beklemeden devam edebilirsin; diğerlerinde onay al.

## 3. Uygula
- CLAUDE.md mimarisine ve güvenlik kurallarına uy.
- Tek bir mantıksal değişiklik yap; alakasız "temizlik" yapma.
- Hata durumlarını ele al ve logla.

## 4. Test et
- Birim testi yaz (Vitest). Arayüz veya gezinme içeriyorsa uçtan uca test ekle (Playwright).
- Sırayla çalıştır: `npm run typecheck`, `npm run lint`, `npm test`.
- Hata varsa düzelt ve tekrar çalıştır. Testleri silme veya atlama.
- Güvenliğe dokunduysa `guvenlik-denetimi` skill'ini uygula.

## 5. Raporla
Kullanıcıya Türkçe:
```
✅ Ne yaptım: ...
🔍 Nasıl test edersin:
   1. `npm run dev` çalıştır
   2. ... (tıklanacak yerler, görülmesi gereken sonuç)
⚠️ Bilmen gerekenler: (varsa sınırlamalar)
📝 Commit mesajı: feat: ...
```

## 6. Kaydet
- SUREC.md'de görevi işaretle, "Şu anki faz" ve "Sıradaki görev"i güncelle.
- Önemli bir karar verdiysen Karar Günlüğü'ne ekle.
- Yeni bir sorun bulduysan Bilinen Sorunlar'a ekle.
