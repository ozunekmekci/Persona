# Persona

Türkçe kişisel blog ve özgeçmiş sitesi.

## Başlatma

```bash
npm ci
npm run dev
```

Önizleme adresi `http://127.0.0.1:4173`. Bir dosyayı düzenledikten sonra sunucuyu yeniden başlatabilir veya ikinci terminalde `npm run build` çalıştırabilirsin. Yayına hazır statik dosyalar `dist/` altında oluşur.

## Ana sayfa

Site adı, giriş metni ve öne çıkan çalışmalar `content/site.json` dosyasında. Özgeçmişe ad eklendiğinde ana sayfada kullanıcı adının yerine gösterilir.

## Yazı ekleme

`content/yazilar/` içinde bir Markdown dosyası oluştur. Dosya adı bağlantıda kullanılır. Üstteki `---` satırları arasına şu JSON bilgilerini koy:

```md
---
{
  "baslik": "Yazının başlığı",
  "ozet": "Liste ve yazı sayfasında gösterilecek bir cümle.",
  "tarih": "2026-11-27",
  "kategori": "Notlar",
  "gorsel": "notes"
}
---

Yazının giriş paragrafı.

## İlk bölüm

Bir paragraf.
```

- `kategori` ziyaretçinin kullanabileceği bir yazı filtresine dönüşür.
- `gorsel` için `curve`, `notes` veya `shape` kullanabilir ya da alanı boş bırakabilirsin.
- `ornek: true` yazıya örnek etiketi ekler. `taslak: true` yazıyı derlemeden çıkarır. Her iki alan da JSON içinde çift tırnakla yazılır.
- `##` başlıkları yazının içindekiler menüsüne eklenir.
- `::: deney curve`, `::: deney notes` veya `::: deney shape` satırını boş satırlar arasında kullanarak hazır bir etkileşim yerleştir. Etkileşimlerin davranışı `src/assets/experiments.js` dosyasında yer alır.

## Özgeçmiş

`content/ozgecmis.json` içinde ad, unvan, tanıtım ve diğer bilgileri düzenle. Deneyim ve eğitim için `baslik`, `kurum`, `tarih` ve isteğe bağlı `aciklama` alanları olan nesneler ekle. Beceriler metin listesi, bağlantılar ise `etiket` ve `url` alanlarına sahip nesnelerden oluşur. Boş bölümler sayfada gizlenir.
