import type { Stock, StockDataset } from '../types'

// Türkiye'de yüksek enflasyon nedeniyle İNA dolar bazında kurulur: nakit akışları mali yıl
// sonu kuruyla dolara çevrilir, bugünkü değer güncel kurla TL'ye geri çevrilir.
export interface DcfParams {
  growthPct: number // ilk 5 yıl yıllık serbest nakit akışı büyümesi ($)
  discountPct: number // iskonto oranı ($ bazlı özsermaye maliyeti)
  terminalPct: number // sonsuz büyüme
  dividendGrowthPct: number // temettü indirgeme modelinde sonsuz temettü büyümesi ($)
}

export const DEFAULT_DCF: DcfParams = { growthPct: 8, discountPct: 14, terminalPct: 3, dividendGrowthPct: 3 }

export interface DcfResult {
  baseFcfUsd: number // son 3 yılın ortalama serbest nakit akışı
  enterpriseUsd: number
  netDebtUsd: number
  perShareTl: number
}

const sharesOf = (s: Stock) => (s.paidCapitalMnTl ? s.paidCapitalMnTl * 1e6 : null)

export function dcf(stock: Stock, data: StockDataset, p: DcfParams): DcfResult | null {
  const f = stock.financials
  const shares = sharesOf(stock)
  if (!f || !shares || !data.usdTryNow || p.discountPct <= p.terminalPct) return null

  const fcfUsd = data.fiscalYears
    .slice(0, 3)
    .map((year, i) => {
      const fcf = f.freeCashFlow[i]
      const fx = data.usdTryYearEnd[String(year)]
      return fcf != null && fx ? fcf / fx : null
    })
    .filter((x): x is number => x != null)
  if (fcfUsd.length < 2) return null
  const base = fcfUsd.reduce((a, b) => a + b, 0) / fcfUsd.length
  if (base <= 0) return null

  const g = p.growthPct / 100
  const r = p.discountPct / 100
  const gt = p.terminalPct / 100
  let pv = 0
  let fcf = base
  for (let t = 1; t <= 5; t++) {
    fcf *= 1 + g
    pv += fcf / (1 + r) ** t
  }
  const terminal = (fcf * (1 + gt)) / (r - gt)
  pv += terminal / (1 + r) ** 5

  const fx0 = data.usdTryYearEnd[String(data.fiscalYears[0])]
  const debt = (f.shortTermDebt[0] ?? 0) + (f.longTermDebt[0] ?? 0)
  const netDebtUsd = fx0 ? (debt - (f.cash[0] ?? 0)) / fx0 : 0
  const equityUsd = pv - netDebtUsd
  if (equityUsd <= 0) return null // borç, işletme değerini aşıyor
  return {
    baseFcfUsd: base,
    enterpriseUsd: pv,
    netDebtUsd,
    perShareTl: (equityUsd / shares) * data.usdTryNow,
  }
}

export interface SectorMedians {
  pe: number | null
  pb: number | null
  peers: number
}

const median = (xs: number[]) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function sectorMedians(stocks: Stock[]): Map<string, SectorMedians> {
  const bySector = new Map<string, Stock[]>()
  for (const s of stocks) bySector.set(s.sector, [...(bySector.get(s.sector) ?? []), s])
  const positive = (xs: (number | null)[]) => xs.filter((x): x is number => x != null && x > 0)
  const market: SectorMedians = {
    pe: median(positive(stocks.map((s) => s.pe))),
    pb: median(positive(stocks.map((s) => s.pb))),
    peers: stocks.length,
  }
  const out = new Map<string, SectorMedians>()
  for (const [sector, group] of bySector) {
    out.set(
      sector,
      group.length >= 5
        ? { pe: median(positive(group.map((s) => s.pe))), pb: median(positive(group.map((s) => s.pb))), peers: group.length }
        : market,
    )
  }
  return out
}

// Sektör çarpanları modeli: hisse başı kâr × sektör medyan F/K ile hisse başı defter değeri ×
// sektör medyan PD/DD ortalaması. Hisse başı değerler mevcut fiyat ve çarpanlardan türetilir.
export function sectorMultipleValue(stock: Stock, medians?: SectorMedians): number | null {
  if (!stock.price || !medians) return null
  const parts: number[] = []
  if (stock.pe && stock.pe > 0 && medians.pe) parts.push((stock.price / stock.pe) * medians.pe)
  if (stock.pb && stock.pb > 0 && medians.pb) parts.push((stock.price / stock.pb) * medians.pb)
  return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null
}

// Temettü indirgeme (Gordon) modeli, $ bazlı: D1 = son iki tam yılın ortalama hisse başı
// temettüsü × (1 + g); değer = D1 / (r − g), güncel kurla TL'ye çevrilir.
export function dividendDiscount(stock: Stock, data: StockDataset, p: DcfParams, fullYear: number): number | null {
  if (!data.usdTryNow || p.discountPct <= p.dividendGrowthPct) return null
  const byYear = new Map((stock.dividendHistory ?? []).map((d) => [d.year, d.usd]))
  const recent = [byYear.get(fullYear) ?? 0, byYear.get(fullYear - 1) ?? 0]
  if (recent[0] <= 0) return null // son yıl ödeme yoksa model anlamsız
  const d0 = (recent[0] + recent[1]) / 2
  const g = p.dividendGrowthPct / 100
  const perShareUsd = (d0 * (1 + g)) / (p.discountPct / 100 - g)
  return perShareUsd * data.usdTryNow
}

export function upsidePct(value: number | null | undefined, price: number | null | undefined) {
  return value != null && price ? (value / price - 1) * 100 : null
}
