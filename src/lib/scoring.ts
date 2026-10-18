import type { ScoreTier, Stock } from '../types'

type Score = number | null | undefined

export function valuationTier(score: Score): ScoreTier {
  if (score == null) return 'none'
  if (score >= 70) return 'good'
  if (score >= 40) return 'warning'
  return 'critical'
}

export function valuationLabel(score: Score): string {
  const tier = valuationTier(score)
  if (tier === 'none') return '—'
  if (tier === 'good') return 'Ucuz'
  if (tier === 'warning') return 'Normal'
  return 'Pahalı'
}

export function fScoreTier(score: Score): ScoreTier {
  if (score == null) return 'none'
  if (score >= 7) return 'good'
  if (score >= 4) return 'warning'
  return 'critical'
}

export function zScoreTier(score: Score): ScoreTier {
  if (score == null) return 'none'
  if (score > 2.99) return 'good'
  if (score >= 1.81) return 'warning'
  return 'critical'
}

// Beneish: -2.22 altı düşük, -1.78 üstü yüksek manipülasyon riski
export function mScoreTier(score: Score): ScoreTier {
  if (score == null) return 'none'
  if (score <= -2.22) return 'good'
  if (score <= -1.78) return 'warning'
  return 'critical'
}

export function qualityTier(score: Score): ScoreTier {
  if (score == null) return 'none'
  if (score >= 7) return 'good'
  if (score >= 4) return 'warning'
  return 'critical'
}

export interface ScreenerFilterState {
  query: string
  sector: string
  minQuality: number
  minDividendYield: number
  onlyCheap: boolean
}

export function passesScreener(stock: Stock, filters: ScreenerFilterState): boolean {
  const q = filters.query.trim().toLocaleUpperCase('tr')
  if (q && !stock.ticker.includes(q) && !stock.name.toLocaleUpperCase('tr').includes(q)) return false
  if (filters.sector !== 'Hepsi' && stock.sector !== filters.sector) return false
  if (filters.minQuality > 0 && (stock.qualityScore ?? -1) < filters.minQuality) return false
  if (filters.minDividendYield > 0 && (stock.dividendYieldPct ?? 0) < filters.minDividendYield) return false
  if (filters.onlyCheap && valuationTier(stock.valuationScore) !== 'good') return false
  return true
}
