import type { Stock } from '../types'

export interface DividendProfile {
  stock: Stock
  yieldPct: number // son 12 ay
  paidYears: number // son 6 tam yılın kaçında temettü ödendi
  streak: number // kesintisiz ödenen yıl sayısı (son tam yıldan geriye)
  usdCagrPct: number | null // 5 yıllık $ bazlı hisse başı temettü büyümesi
  payoutPct: number | null // ödenen temettü / ana ortaklık net kârı
  fcfCoverage: number | null // serbest nakit akışı / ödenen temettü
  score: number // 0-100
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

// Son tam takvim yılı: içinde bulunulan yıl henüz bitmediği için bir önceki yıl
export const lastFullYear = () => new Date().getFullYear() - 1

export function dividendProfile(stock: Stock, fullYear = lastFullYear()): DividendProfile | null {
  const history = stock.dividendHistory ?? []
  const byYear = new Map(history.map((d) => [d.year, d]))
  const window = Array.from({ length: 6 }, (_, i) => fullYear - i)
  const paidYears = window.filter((y) => (byYear.get(y)?.tl ?? 0) > 0).length
  const yieldPct = stock.dividendYieldPct ?? 0
  if (paidYears === 0 && yieldPct <= 0) return null

  let streak = 0
  for (let y = fullYear; (byYear.get(y)?.tl ?? 0) > 0; y--) streak++

  const usdNow = byYear.get(fullYear)?.usd ?? 0
  const usdThen = byYear.get(fullYear - 5)?.usd ?? 0
  const usdCagrPct = usdNow > 0 && usdThen > 0 ? ((usdNow / usdThen) ** (1 / 5) - 1) * 100 : null

  const f = stock.financials
  const paid = f?.dividendsPaid[0] != null ? Math.abs(f.dividendsPaid[0]) : null
  const income = f?.parentNetIncome[0] ?? null
  const fcf = f?.freeCashFlow[0] ?? null
  const payoutPct = paid && income && income > 0 ? (paid / income) * 100 : null
  const fcfCoverage = paid && fcf != null ? fcf / paid : null

  // Temettü Skoru: süreklilik %30, $ büyüme %25, dağıtım oranının sürdürülebilirliği %20,
  // nakit akışıyla karşılanma %15, verim %10. Eksik bileşen ağırlıktan düşülür.
  const parts: [number | null, number][] = [
    [paidYears / 6, 0.3],
    [usdCagrPct == null ? null : clamp01((usdCagrPct + 10) / 30), 0.25],
    [
      payoutPct == null
        ? null
        : payoutPct < 20
          ? payoutPct / 20
          : payoutPct <= 70
            ? 1
            : clamp01(1 - (payoutPct - 70) / 60),
      0.2,
    ],
    [fcfCoverage == null ? null : clamp01(fcfCoverage / 2), 0.15],
    [clamp01(yieldPct / 10), 0.1],
  ]
  const present = parts.filter((p): p is [number, number] => p[0] != null)
  const weight = present.reduce((a, [, w]) => a + w, 0)
  const score = Math.round((present.reduce((a, [v, w]) => a + v * w, 0) / weight) * 100)

  return { stock, yieldPct, paidYears, streak, usdCagrPct, payoutPct, fcfCoverage, score }
}

export interface DividendPortfolioOptions {
  budget: number
  count: number
  maxPerSector: number
  minYieldPct: number
}

export interface DividendPick {
  profile: DividendProfile
  amount: number
  quantity: number
  annualIncome: number
}

// En yüksek Temettü Skorlu hisselerden sektör sınırına uyarak eşit ağırlıklı portföy kurar
export function buildDividendPortfolio(profiles: DividendProfile[], o: DividendPortfolioOptions): DividendPick[] {
  const perSector = new Map<string, number>()
  const chosen: DividendProfile[] = []
  for (const p of [...profiles].sort((a, b) => b.score - a.score || b.yieldPct - a.yieldPct)) {
    if (chosen.length >= o.count) break
    if (!p.stock.price || p.yieldPct < o.minYieldPct || p.paidYears < 3) continue
    const used = perSector.get(p.stock.sector) ?? 0
    if (used >= o.maxPerSector) continue
    perSector.set(p.stock.sector, used + 1)
    chosen.push(p)
  }
  const slice = chosen.length ? o.budget / chosen.length : 0
  return chosen.map((profile) => {
    const quantity = Math.floor(slice / profile.stock.price!)
    const amount = quantity * profile.stock.price!
    return { profile, quantity, amount, annualIncome: (amount * profile.yieldPct) / 100 }
  })
}
