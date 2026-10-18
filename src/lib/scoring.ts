import type { ScoreTier, Stock } from '../types'

export function priceScoreTier(score: number): ScoreTier {
  if (score >= 70) return 'good'
  if (score >= 40) return 'warning'
  return 'critical'
}

export function priceScoreLabel(score: number): string {
  const tier = priceScoreTier(score)
  if (tier === 'good') return 'Ucuz'
  if (tier === 'warning') return 'Normal'
  return 'Pahalı'
}

export function fScoreTier(score: number): ScoreTier {
  if (score >= 7) return 'good'
  if (score >= 4) return 'warning'
  return 'critical'
}

export function zScoreTier(score: number): ScoreTier {
  if (score >= 3) return 'good'
  if (score >= 1.8) return 'warning'
  return 'critical'
}

export function proScoreTier(score: number): ScoreTier {
  if (score >= 7) return 'good'
  if (score >= 4) return 'warning'
  return 'critical'
}

export function passesScreener(
  stock: Stock,
  filters: { sector: string; minProScore: number; minDividendYield: number; onlyCheap: boolean },
): boolean {
  if (filters.sector !== 'Hepsi' && stock.sector !== filters.sector) return false
  if (stock.proScore < filters.minProScore) return false
  if (stock.dividendYieldPct < filters.minDividendYield) return false
  if (filters.onlyCheap && priceScoreTier(stock.priceScore) !== 'good') return false
  return true
}
