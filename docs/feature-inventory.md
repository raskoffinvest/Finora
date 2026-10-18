# Finora — Özellik Envanteri (Finbosoft referansı)

**Tarih:** 18 Ekim 2026
**Amaç:** Finbosoft'un halka açık olarak tanıttığı özelliklerin tam listesini çıkarmak ve Finora'da
kendi tasarımımız, metinlerimiz ve meşru veri kaynaklarıyla bağımsız olarak yeniden kurmak.

**Yöntem ve sınırlar:** finbosoft.com bir SPA ve otomatik istekleri Cloudflare ile engelliyor (403);
engel aşılmadı. Envanter; blog.finbosoft.com yazıları, sitenin menü/footer yapısı ve kamuya açık
sosyal medya paylaşımlarından derlendi. Giriş arkasındaki ekranlar görülmedi; ekran düzenleri ve
Finbosoft'a özel algoritmaların (Fiyat Skoru, ProScore, EV Skoru, Finbo Model 1/2) formülleri
**bilinmiyor** — Finora bunların yerine kendi tanımladığı, açık formüllü modelleri kullanacak.

**Güncelleme (canlı site, Chrome ile):** Ana sayfa (finbosoft.com) kullanıcının Chrome'unda açılıp
metni ve tanıtımdaki uygulama paneli görüntüsü (`/landing/finbo-panel-1920.webp`) incelendi.
Giriş yapılmadı; aşağıdaki "Uygulama yapısı" bölümü bu görüntüye dayanır.

Durum sütunu: ✅ Finora'da var · 🟡 kısmen/örnek veriyle · ⬜ yok

## 0. Uygulama yapısı (panel görüntüsünden gözlenen)

Uygulama; solda sabit menü, ortada içerik, sağda piyasa/favori sütunu olan bir panel düzenidir.

**Sol menü**
- Şirket Ara (arama kutusu)
- Piyasa
- Bilançolar
- Filtrele
- Halka Arz
- Pro Araçlar → Yapay Zeka · Skor · Gerçek Değer · Portföy Analizi · Portföy Cüzdan
- Alt köşede kullanıcı kartı (ad, "Pro Hesabım")

**Piyasa ekranı**
- Üst sekmeler: Piyasalarım · Endeksler · Kurlar · Emtialar, "Özelleştir" ile kullanıcı seçimli kartlar
- Kartlar: sembol, son değer, % değişim (ör. XU100, XU030, USDTRY, XAUUSD, XBANK, BRENT, XAGUSD)
- Takvim kutusu, sekmeler: Yaklaşan Temettüler · Gelecek Sermaye Artırımları · Son Bilançolar
  - Temettü kolonları: Şirket (logo), Dağıtım Tarihi, Hisse Başı Brüt (₺), Toplam Temettü
- Hareketliler kutusu, sekmeler: Sektörler · Hisseler; iki liste: En Çok Yükselenler / En Çok Düşenler (ad, saat, % değişim)
- Halka Arzlar tablosu, filtre: Aktif · Kapalı · Tümü
  - Kolonlar: Şirket, Fiyat (+% değişim), Halka Arz Fiyatı, Arz Sonrası Getiri, İlk İşlem Tarihi, Talep Toplama, Arz Büyüklüğü
- Sağ sütun: XU100 kartı (değer, değişim, tarih/saat, mini bar grafik)
- Sağ sütun: Favorilerim (izleme listesi, en fazla 20 sembol, "Düzenle"): Sembol, Fiyat, Değişim

**Tanıtımdaki "Nasıl çalışır" akışı:** 1) Piyasayı gör (endeks, çarpan, halka arz) → 2) Şirketi aç
(bilanço, rasyolar, çarpanlar, temettü tek sayfada) → 3) Yapay zekâ ile derinleş → 4) Portföyü analiz et.

**Ana sayfada sayılan modüller (11 modül; 5 ücretsiz, 6 Pro)**
- Ücretsiz: Endeks ve Bilanço Bilgileri · Hisse Analizleri ve Özel Değerlemeler · Çarpanlar ve Rasyolar ·
  Temettü ve Halka Arz Bilgileri · Şirket Detayları ve Anlık Bilançolar
- Pro: Özel Değerleme Modelleri ile Gerçek Hisse Fiyatı · Gelişmiş Algoritmalar ve Skorlar ·
  Yapay Zekâ ile Hisse ve Portföy Analizi · Temettü Hisselerinde Derinlemesine Analiz ·
  Otomatik Destek/Direnç Bulucu · Portföy Cüzdan ile Portföy Yönetimi
- Ayrıca tanıtılan: **Gelecek Tahminlemeleri** (gelecek yılların kârlılık ve bilanço tahmini),
  **Temettü Portföyü** oluşturma

**Fiyatlandırma (gözlenen):** Ücretsiz 0 ₺, süresiz, kart istemez. Pro aylık 599 ₺ (7.188 ₺/yıl),
yıllık 4.999 ₺ (%30 indirim, aylık ~417 ₺); KDV dahil; iptal sonrası ücretsiz özellikler açık kalır.

**Ana sayfa bölümleri:** Hero · özellik kartları · istatistikler · nasıl çalışır (otomatik oynayan
ekran turu, duraklat düğmesi) · fiyatlandırma (aylık/yıllık geçiş) · kullanıcı yorumları ·
blog ve YouTube eğitim serileri · SSS (5 soru) · kapanış CTA · iletişim formu · footer.
Yasal uyarı ("yatırım danışmanlığı kapsamında değildir") fiyatlandırmanın altında.

## 1. Skorlar ve modeller

| Özellik | Finbosoft'taki tanımı (gözlenen) | Finora karşılığı | Durum |
|---|---|---|---|
| Piotroski F-Score | 0–9; 9 ikili kriter | Standart 9 kriter, yıllık mali tablolardan | ✅ |
| Altman Z-Score | >2.99 güçlü, 1.81–2.99 gri, <1.81 riskli | Standart formül (sanayi şirketleri için; banka/sigortada gösterilmez) | ✅ |
| Beneish M-Score | 8 oran; > −2.22 manipülasyon riski | Standart 8 değişkenli model | ✅ |
| Beta | Piyasaya göre oynaklık | BIST 100'e karşı 2 yıllık haftalık getiri regresyonu | ⬜ |
| Fiyat Skoru | Tescilli; fiyat perf., sektör kıyas, kârlılık, büyüme, çarpanlar, nakit akışı. Düşük = ucuz | Kendi "Değerleme Skoru": sektör içi çarpan yüzdelikleri + büyüme ayarı, 0–100, formülü açık | ✅ |
| ProScore | Tescilli; 100+ parametre, 7–9 güçlü | Kendi "Kalite Skoru": kârlılık, büyüme, nakit, borçluluk, değerleme alt skorları; ağırlıklar açık (Finora Skoru) | ✅ |
| EV Skoru | Firma değeri bazlı skor (detay yok) | FD/FAVÖK ve FD/Satış sektör yüzdeliğinden skor | ⬜ |

## 2. Gerçek (içsel) değer analizi

| Model | Durum |
|---|---|
| İndirgenmiş Nakit Akımı (İNA/DCF), $ bazlı, varsayımlar ayarlanabilir | ✅ |
| Graham değeri √(22.5 × HBK × HBDD) | ✅ |
| Finbo Model 1 / Model 2 (tescilli) → Finora: sektör medyan çarpanları modeli ✅ · temettü indirgeme ⬜ |
| Modellerin yan yana karşılaştırması, medyan, model uyumu ve potansiyel getiri sıralaması | ✅ |

## 3. Bilanço ve rasyolar

- Bilanço, gelir tablosu, nakit akış tablosu (çeyreklik/yıllık) ⬜
- Enflasyon muhasebesi: düzeltilmiş ve düzeltilmemiş tablolar yan yana, reel/nominal büyüme ⬜
- Çarpanlar: F/K, PD/DD, FD/FAVÖK, FD/Satış ✅
- Kârlılık: ROE, ROA, brüt/faaliyet/net marj ✅
- Büyüme: satış, net kâr, faaliyet kârı büyümesi ✅
- Borçluluk ve nakit yapısı ✅
- Piyasa değeri, halka açıklık oranı ✅ · firma değeri ⬜
- İhracat oranı (yurt dışı satış payı) ⬜

## 4. Temettü analizi

- TL bazlı hisse başı temettü geçmişi ✅
- USD bazlı temettü geçmişi ✅
- Enflasyona göre düzeltilmiş temettü ⬜
- Temettü verimi (12 ay) ✅ · dağıtım oranı ⬜

## 5. Hisse tarama / filtreleme (ücretsiz)

- Endeks filtresi (BIST 30/50/100, Katılım 30 …) ⬜
- Sektör filtresi ✅
- Çarpan filtreleri (F/K, PD/DD, FD/FAVÖK, FD/S aralıkları) ⬜
- Skor filtreleri (Finora Skoru, "sadece ucuz") 🟡
- Büyüme filtreleri ⬜
- Teknik ön tanımlı taramalar: momentum, endeksin gerisinde kalanlar, geri çekilme ⬜
- Sıralanabilir sonuç tablosu, şirket arama ✅

## 6. Teknik

- Otomatik destek/direnç seviyeleri ✅
- Teknik göstergeler (RSI, hareketli ortalamalar vb.) ⬜
- Fiyat grafiği (52 hafta) ✅

## 7. Diğer ekranlar

- Şirket özet raporu ⬜
- Sektör ve endeks karşılaştırmaları ⬜
- Halka arz (IPO) verileri ⬜
- "Dip fiyattaki şirketler" gibi hazır listeler ⬜
- Piyasa paneli: endeks, kur, emtia ve gram altın kartları, grup sekmeleri ✅ · kullanıcı özelleştirmesi ⬜
- Takvim: yaklaşan temettüler, sermaye artırımları, son olaylar ✅ · son açıklanan bilançolar ⬜
- En çok yükselen/düşen sektörler ve hisseler ✅
- Favoriler / izleme listesi (20 sembol, tarayıcıda saklanır) ✅
- Portföy Cüzdan: pozisyon girişi, düzenleme, değer ve K/Z (tarayıcıda saklanır) ✅
- Gelecek tahminlemeleri: kârlılık ve bilanço projeksiyonu (Pro) ⬜
- Temettü portföyü oluşturucu ⬜

## 8. Yapay zekâ (Pro)

- Şirket yorumu: güçlü yönler, riskler, büyüme potansiyeli (Claude API ile, verilere dayalı) ⬜
- Portföy analizi: sektör dağılımı, ağırlıklı skorlar, oynaklık, beta, risk uyarıları ✅ · yapay zekâ yorumu ⬜

## 9. Hesap ve ticari

- Kayıt / giriş ⬜
- Abonelik sayfası (Ücretsiz / Pro) 🟡 (statik)
- Ödeme altyapısı ⬜
- Yasal sayfalar: Hizmet Şartları, İade/İptal, Mesafeli Satış, Gizlilik, Çerez, KVKK ⬜
- SSS, Hakkımızda, İletişim ⬜
- Blog / eğitim içerikleri ⬜
- Bülten aboneliği ⬜

## Ücretsiz / Pro ayrımı (gözlenen)

- **Ücretsiz:** temel veriler, tarama ekranı, F-Score, Z-Score, Fiyat Skoru, çarpanlar, temettü geçmişi,
  sektör/endeks kıyası, bilanço.
- **Pro:** ProScore, gerçek değer modelleri, yapay zekâ analizleri, portföy analizi,
  derinlemesine temettü analizi, otomatik destek/direnç.

## Kaynaklar

- https://blog.finbosoft.com/finbosoft-nedir/
- https://blog.finbosoft.com/finansal-skorlama-modelleri/
- https://blog.finbosoft.com/hisse-filtrelemesi-nedir/
- https://blog.finbosoft.com/
