# Finora

Borsa İstanbul şirketleri için açık formüllü temel analiz uygulaması (React + TypeScript + Vite).

## Çalıştırma

```bash
npm install
npm run data   # BIST verisini çeker, public/data/stocks.json üretir (~10 dk, ilk çalıştırmada)
npm run dev    # http://localhost:5173
```

`npm run data` seçenekleri: `-- --only THYAO,ASELS` (belirli hisseler), `-- --limit 20`,
`-- --market-only` (yalnızca piyasa paneli, birkaç saniye), `-- --refresh` (önbelleği yok sayar).

Ham yanıtlar `.cache/` altında tutulur: fiyatlar her çalıştırmada, haftalık grafikler 12 saatte,
mali tablolar 7 günde bir yenilenir. Çıktılar: `public/data/stocks.json`, `public/data/market.json`.

## Veri kaynakları

| Veri | Kaynak |
|---|---|
| Hisse listesi, sektör, fiyat, piyasa değeri, halka açıklık, F/K, PD/DD, FD/FAVÖK, getiriler | İş Yatırım "Temel Değerler ve Oranlar" |
| Yıllık bilanço, gelir tablosu, nakit akışı | İş Yatırım MaliTablo |
| Haftalık fiyat geçmişi, temettüler, endeks/kur/emtia kartları | Yahoo Finance |
| Temettü ve sermaye artırımı takvimi | İş Yatırım "Temel Değerler ve Oranlar" |
| Halka arzlar ve taslak başvurular | halkarz.com |

Bu kaynaklar resmi API değildir; kişisel kullanım ve geliştirme içindir. Uygulama ticari
olarak yayımlanacaksa lisanslı bir veri sağlayıcıya geçilmelidir.

## Skorlar

Hepsi `scripts/lib/metrics.mjs` ve `scripts/fetch-data.mjs` içinde açık formüllerle hesaplanır.

- **Piotroski F-Score (0–9)** — 9 ikili kriter; sermaye artırımı kriteri bedelsiz artırımları
  cezalandırmamak için nakit akışındaki "Sermaye Artırımı" kalemine bakar.
- **Altman Z-Score** — 1968 modeli; > 2,99 güvenli, 1,81–2,99 gri bölge.
- **Beneish M-Score** — 8 değişkenli model; −2,22 üstü manipülasyon riski.
- **Graham değeri** — √(22,5 × HBK × HBDD), hisse adedi = ödenmiş sermaye.
- **Değerleme Skoru (0–100)** — F/K, PD/DD ve FD/FAVÖK'ün sektör içi yüzdeliği; yüksek = ucuz.
- **Finora Skoru (0–10)** — ROE, net marj, büyüme, F-Score, Z-Score, borçluluk ve değerlemenin
  ağırlıklı ortalaması.
- **Destek/direnç** — son 52 haftalık pivot dip ve tepeler.

Banka ve finans şirketlerinde (UFRS tabloları) F/Z/M skorları hesaplanmaz.

## Pro araçlar

- **Gerçek Değer** — İNA (dolar bazlı: nakit akışları yıl sonu kuruyla $'a, sonuç güncel kurla TL'ye),
  Graham ve sektör medyan çarpanları; modellerin medyanı ve "model uyumu" (en uç iki model 3 kattan
  fazla ayrışıyorsa düşük). Kod: `src/lib/valuation.ts`.
- **Portföy Cüzdan** — pozisyonlar tarayıcıda (`localStorage`) saklanır.
- **Portföy Analizi** — sektör dağılımı, ağırlıklı skorlar, 52 haftalık oynaklık ve BIST 100'e göre
  beta, yoğunlaşma ve skor uyarıları. Kod: `src/lib/portfolioAnalysis.ts`.

## Yapay zekâ (Gemini)

Şirket paneli, **Yapay Zekâ** ekranı ve Portföy Analizi, Gemini ile yorum üretebilir.

```bash
cp .env.example .env.local   # sonra GEMINI_API_KEY değerini yazın
npm run dev                  # sunucuyu yeniden başlatın
```

Tarayıcı `/api/ai` uç noktasını çağırır; bu uç nokta Vite sunucusunda çalışır (`server/ai.mjs`) ve
anahtar yalnızca sunucuda kalır, istemci paketine girmez. Modele yalnızca Finora'nın hesapladığı
skor ve oranlar gönderilir; yorumlar yatırım tavsiyesi değildir.

## Yol haritası

Finbosoft'un özellik envanteri ve Finora'daki karşılıkları: [docs/feature-inventory.md](docs/feature-inventory.md).
