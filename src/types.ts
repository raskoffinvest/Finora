export type Sector = 'Banka' | 'Sigorta' | 'GYO' | 'Sanayi' | 'Teknoloji' | 'Otomotiv'

export type ScoreTier = 'good' | 'warning' | 'critical'

export interface DividendYear {
  year: number
  tl: number
  usd: number
}

export interface Stock {
  id: string
  name: string
  ticker: string
  sector: Sector
  currentPrice: number
  priceScore: number // 0-100, higher = daha ucuz (undervalued)
  fScore: number // Piotroski F-Score, 0-9
  zScore: number // Altman Z-Score
  proScore: number // 0-10, genel kalite skoru
  peRatio: number
  pbRatio: number
  dividendYieldPct: number
  revenueGrowthPct: number
  netIncomeGrowthPct: number
  cashStrength: 'Güçlü' | 'Orta' | 'Zayıf'
  supportLevel: number
  resistanceLevel: number
  dividendHistory: DividendYear[]
}
