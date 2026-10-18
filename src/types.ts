export type ScoreTier = 'good' | 'warning' | 'critical' | 'none'

export interface DividendYear {
  year: number
  tl: number
  usd: number
}

export interface PricePoint {
  t: number // unix saniye
  close: number | null
}

export interface Ratios {
  roe: number | null
  roa: number | null
  grossMargin: number | null
  operatingMargin: number | null
  netMargin: number | null
  revenueGrowth: number | null
  netIncomeGrowth: number | null
  operatingProfitGrowth: number | null
  currentRatio: number | null
  debtToEquity: number | null
  netDebt: number | null
  freeCashFlow: number | null
}

// Yıllık mali tablo kalemleri; dizi indeksi 0 = son mali yıl (StockDataset.fiscalYears ile aynı sıra)
export type Financials = Record<
  | 'totalAssets' | 'cash' | 'shortTermDebt' | 'longTermDebt' | 'equity' | 'parentEquity'
  | 'revenue' | 'operatingProfit' | 'netIncome' | 'parentNetIncome' | 'operatingCashFlow' | 'capex' | 'freeCashFlow',
  (number | null)[]
>

// scripts/fetch-data.mjs tarafından üretilen public/data/stocks.json kaydı
export interface Stock {
  ticker: string
  name: string
  sector: string
  price: number | null
  marketCapMnTl: number | null
  marketCapMnUsd: number | null
  freeFloatPct: number | null
  paidCapitalMnTl: number | null
  pe: number | null
  evEbitda: number | null
  evSales: number | null
  pb: number | null
  lastPeriod: string | null
  return1d: number | null
  return1w: number | null
  return1m: number | null
  returnYtd: number | null
  statementGroup?: 'industrial' | 'financial' | 'none'
  ratios?: Ratios
  financials?: Financials
  fScore?: number | null // Piotroski, 0-9
  zScore?: number | null // Altman
  mScore?: number | null // Beneish
  grahamValue?: number | null
  valuationScore?: number | null // 0-100, yüksek = sektörüne göre ucuz
  qualityScore?: number | null // Finora Skoru, 0-10
  dividendYieldPct?: number | null // son 12 ay
  dividendHistory?: DividendYear[]
  supportLevel?: number | null
  resistanceLevel?: number | null
  low52w?: number | null
  high52w?: number | null
  priceHistory?: PricePoint[]
}

export interface MarketQuote {
  symbol: string
  name: string
  group: 'Endeksler' | 'Kurlar' | 'Emtialar'
  price: number
  changePct: number | null
  time: number
  history: PricePoint[]
}

export interface CorporateAction {
  ticker: string
  date: string // YYYY-MM-DD
  type: 'temettu' | 'bedelli' | 'bedelsiz'
  perShare?: number | null // nakit temettü, ₺/hisse brüt
  total?: number | null // toplam nakit temettü, ₺
  ratioPct?: number | null // sermaye artırım oranı
}

export interface MarketDataset {
  generatedAt: string
  quotes: MarketQuote[]
  actions: CorporateAction[]
  benchmark: PricePoint[] // BIST 100, son 52 hafta haftalık
}

export interface StockDataset {
  generatedAt: string
  fiscalYears: number[]
  usdTryYearEnd: Record<string, number | null>
  usdTryNow: number | null
  sources: string[]
  stocks: Stock[]
}
