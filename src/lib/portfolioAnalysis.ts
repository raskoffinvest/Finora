import type { PricePoint, Stock } from '../types'
import type { Position } from './usePortfolio'

export interface Holding {
  position: Position
  stock: Stock
  value: number
  costValue: number
  pnl: number
  pnlPct: number
  weight: number // 0-1
}

export interface PortfolioAnalysis {
  holdings: Holding[]
  totalValue: number
  totalCost: number
  sectorWeights: { sector: string; weight: number }[]
  weighted: {
    quality: number | null
    fScore: number | null
    valuation: number | null
    dividendYield: number | null
  }
  volatilityPct: number | null // yıllıklandırılmış, haftalık getirilerden
  beta: number | null // BIST 100'e göre
  warnings: string[]
}

function weeklyReturns(points: PricePoint[]): Map<number, number> {
  const out = new Map<number, number>()
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1].close
    const b = points[i].close
    if (a && b) out.set(weekKey(points[i].t), b / a - 1)
  }
  return out
}

// Farklı kaynaklardaki haftalık barları aynı haftaya eşlemek için ISO hafta başlangıcı
const weekKey = (t: number) => Math.floor((t + 3 * 86400) / (7 * 86400))

function weightedAvg(holdings: Holding[], pick: (s: Stock) => number | null | undefined) {
  let sum = 0
  let weight = 0
  for (const h of holdings) {
    const v = pick(h.stock)
    if (v == null || !Number.isFinite(v)) continue
    sum += v * h.weight
    weight += h.weight
  }
  return weight > 0.5 ? sum / weight : null // değerlerin yarısından azı varsa anlamlı değil
}

export function analyzePortfolio(
  positions: Position[],
  stocksByTicker: Map<string, Stock>,
  benchmark: PricePoint[],
): PortfolioAnalysis {
  const raw = positions
    .map((position) => {
      const stock = stocksByTicker.get(position.ticker)
      if (!stock?.price) return null
      const value = stock.price * position.quantity
      const costValue = position.cost * position.quantity
      return { position, stock, value, costValue, pnl: value - costValue, pnlPct: costValue ? (value / costValue - 1) * 100 : 0 }
    })
    .filter((h): h is Omit<Holding, 'weight'> => h != null)

  const totalValue = raw.reduce((a, h) => a + h.value, 0)
  const totalCost = raw.reduce((a, h) => a + h.costValue, 0)
  const holdings: Holding[] = raw.map((h) => ({ ...h, weight: totalValue ? h.value / totalValue : 0 }))

  const sectorMap = new Map<string, number>()
  for (const h of holdings) sectorMap.set(h.stock.sector, (sectorMap.get(h.stock.sector) ?? 0) + h.weight)
  const sectorWeights = [...sectorMap].map(([sector, weight]) => ({ sector, weight })).sort((a, b) => b.weight - a.weight)

  // Portföyün haftalık getirisi: her haftada pozisyon ağırlıklarıyla ağırlıklı ortalama
  const series = holdings.map((h) => ({ weight: h.weight, returns: weeklyReturns(h.stock.priceHistory ?? []) }))
  const benchReturns = weeklyReturns(benchmark)
  const portfolioReturns: number[] = []
  const pairedBench: number[] = []
  for (const [week, bench] of benchReturns) {
    let r = 0
    let w = 0
    for (const s of series) {
      const x = s.returns.get(week)
      if (x == null) continue
      r += x * s.weight
      w += s.weight
    }
    if (w < 0.8) continue
    portfolioReturns.push(r / w)
    pairedBench.push(bench)
  }

  let volatilityPct: number | null = null
  let beta: number | null = null
  if (portfolioReturns.length >= 20) {
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    const mp = mean(portfolioReturns)
    const mb = mean(pairedBench)
    let cov = 0
    let varB = 0
    let varP = 0
    for (let i = 0; i < portfolioReturns.length; i++) {
      cov += (portfolioReturns[i] - mp) * (pairedBench[i] - mb)
      varB += (pairedBench[i] - mb) ** 2
      varP += (portfolioReturns[i] - mp) ** 2
    }
    const n = portfolioReturns.length - 1
    volatilityPct = Math.sqrt(varP / n) * Math.sqrt(52) * 100
    beta = varB ? cov / varB : null
  }

  const warnings: string[] = []
  const top = sectorWeights[0]
  if (holdings.length >= 2 && top && top.weight > 0.4) {
    warnings.push(`Portföyün %${Math.round(top.weight * 100)}'i tek sektörde (${top.sector}); sektöre özgü bir şok tüm portföyü etkiler.`)
  }
  for (const h of holdings) {
    if (holdings.length >= 2 && h.weight > 0.25) {
      warnings.push(`${h.stock.ticker} portföyün %${Math.round(h.weight * 100)}'ini oluşturuyor; tek hisse yoğunlaşması yüksek.`)
    }
    if (h.stock.fScore != null && h.stock.fScore <= 3) {
      warnings.push(`${h.stock.ticker} için F-Score ${h.stock.fScore}/9; finansal sağlık zayıf görünüyor.`)
    }
    if (h.stock.zScore != null && h.stock.zScore < 1.81) {
      warnings.push(`${h.stock.ticker} için Z-Score ${h.stock.zScore.toFixed(2)}; finansal sıkıntı bölgesinde.`)
    }
    if (h.stock.mScore != null && h.stock.mScore > -1.78) {
      warnings.push(`${h.stock.ticker} için M-Score ${h.stock.mScore.toFixed(2)}; kâr kalitesi/manipülasyon riski işareti.`)
    }
  }
  if (beta != null && beta > 1.3) warnings.push(`Portföy betası ${beta.toFixed(2)}; piyasa hareketlerine endeksten daha sert tepki veriyor.`)

  return {
    holdings,
    totalValue,
    totalCost,
    sectorWeights,
    weighted: {
      quality: weightedAvg(holdings, (s) => s.qualityScore),
      fScore: weightedAvg(holdings, (s) => s.fScore),
      valuation: weightedAvg(holdings, (s) => s.valuationScore),
      dividendYield: weightedAvg(holdings, (s) => s.dividendYieldPct),
    },
    volatilityPct,
    beta,
    warnings,
  }
}
