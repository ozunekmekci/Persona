# Persona — Proje devri

## Aktif durum

- Amaç: Kişisel blog, yazılarda etkileşimli anlatım ve özgeçmiş. İlk tasarım kullanıcıyı yansıtmadığı için 28 Kasım 2026'da yeni bir tasarım uygulandı.
- Kaynak deposu: `ozunekmekci/Persona`, `main` dalı. GitHub deposu özel. Yerel `main`, `origin/main` dalını izliyor.
- Tasarım checkpoint'i: `36acd17` GitHub'a ve Sites kaynak deposuna gönderildi. Aynı commit'ten üretilen özel dağıtım başarılı. Sites adresi: https://kisisel-alan-znekm.largeghost2.chatgpt.site
- İlk sürüm: `3d936e2`. Mevcut tasarımdan önceki çalışma Git geçmişinde duruyor.
- Kişiselleştirme: Geçici marka Persona. Ana sayfada kullanıcı adı ve iki herkese açık çalışma var. Çalışmaların açıklamaları Portakal Çiçeği Atölye ve CihazQR GitHub README dosyalarından doğrulandı. Kullanıcının tasarım odağına ilişkin tercihi henüz gelmedi.
- Yeni düzen: Koyu renk giriş, dikey yazı arşivi ve yazı içi 3B piramit. Piramit sürüklenerek ve klavyeyle döndürülebiliyor. Blog ve özgeçmiş verileri dosyalardan derleniyor.

## İlgili dosyalar

- `content/site.json` — site adı, tanıtım ve ana sayfadaki çalışma örnekleri.
- `content/ozgecmis.json` — ad, unvan, deneyim, eğitim, beceriler ve bağlantılar.
- `content/yazilar/` — Markdown yazıları ve etkileşim örnekleri.
- `scripts/build.mjs`, `src/assets/style.css`, `src/assets/experiments.js` — şablonlar, tema ve yazı içi etkileşimler.
- [README.md](README.md) — yerel çalıştırma ve içerik ekleme.

## Doğrulama

- `npm run build` ana sayfa, üç yazı ve CV için başarılı. `node --check` ve `git diff --check` geçti.
- Yerel tarayıcıda masaüstü ve 390 px ana sayfa, kategori filtresi, CV bağlantısı, piramit sürgüsü ve ok tuşuyla dönüş doğrulandı.
- Sites dağıtım işlemi başarı durumuyla özel site URL'sini döndürdü. Sonuç kaydı, dağıtılan tasarım commit'ini izleyen GitHub handoff kaydıdır.

## Plan

1. Kullanıcının önizleme geri bildirimine göre ana sayfadaki proje ve yazı odağını netleştir.
2. Kullanıcı paylaştığında gerçek adını, özgeçmişini ve yazılarını ilgili `content/` dosyalarına ekle.
3. Kullanıcı karar verdiğinde GitHub depo görünürlüğünü ve sitenin erişim ayarını ayrı ayrı ele al.
