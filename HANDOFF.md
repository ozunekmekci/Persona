# Kişisel Alan

## Aktif çalışma

- Amaç: Türkçe kişisel site, etkileşimli blog yazıları ve düzenlenebilir özgeçmiş. Kamuya açma kararı kullanıcıya ait.
- Başlangıç: Dizin boştu. `main` yeni, commit yok. Önceki devir kaydı bulunmadı.
- İlgili alanlar: `content/`, `src/`, `scripts/`.
- Doğrulama: Dizin ve Git başlangıç durumu kontrol edildi. Uygulama kontrolleri bekliyor.
- Bekleyen içerik: Kullanıcının adı, gerçek blog yazıları ve özgeçmiş verileri.
- Sonraki adım: [uygulama planındaki](#plan) siteyi oluştur.

## Plan

1. Statik sayfa yapısını ve Markdown blog içeriğini oluştur.
2. Ana sayfa, yazı arşivi ve özgeçmiş akışını tamamla. Blog bileşenlerini ve hareketi ekle.
3. Derlemeyi ve tarayıcıdaki ana akışları doğrula. Erişimi özel tut.

## Kurulum

- Kişisel Alan adı geçici başlık olarak seçildi. Üç etiketli örnek yazı ve kişisel/mesleki bilgi uydurmadan doldurulabilecek bir özgeçmiş veri dosyası oluşturuldu.
- Sites projesi oluşturuldu ve kimliği `.openai/hosting.json` dosyasına kaydedildi. Henüz sürüm veya dağıtım oluşturulmadı.
- Markdown ayrıştırıcısı kuruldu. Sonraki adım sayfa şablonları, görsel dil ve istemci etkileşimleri.

## Yayın öncesi doğrulama

- Ana sayfa, üç yazı ve özgeçmiş tamamlandı. `npm run build` başarılı. Tüm sayfalar yerel sunucuda HTTP 200 döndürdü. JavaScript dosyaları `node --check` ile geçti.
- Tarayıcıda ana sayfanın 3B duraklatma düğmesi, kategori filtresi, not taslağı, hareket eğrisi, içindekiler bağlantısı, piramit sürgüsü ve özgeçmiş görünümü denendi. 390 px genişlikte ana sayfa tek sütunda ve yatay taşma oluşmadı.
- Sites erişimi yalnızca sahibin hesabına açık olarak doğrulandı. `main` dalında ilk yayın commit'i bekliyor.
- Sonraki adım, kaynak ağacını paketlemek ve özel dağıtımı doğrulamak.
