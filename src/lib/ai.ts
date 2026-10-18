import type { Stock } from '../types'
import type { PortfolioAnalysis } from './portfolioAnalysis'

export interface AiResult {
  summary: string
  strengths: string[]
  risks: string[]
  outlook: string
}

export type AiKind = 'stock' | 'portfolio'

const r1 = (x: number | null | undefined) => (x == null ? null : Math.round(x * 10) / 10)

// Modele gönderilen şirket verisi: yalnızca hesaplanmış skorlar ve oranlar
export function stockPayload(stock: Stock, fiscalYear: number) {
  return {
    kod: stock.ticker,
    ad: stock.name,
    sektor: stock.sector,
    fiyatTl: stock.price,
    piyasaDegeriMnTl: stock.marketCapMnTl,
    halkaAciklikPct: stock.freeFloatPct,
    carpanlar: { fk: stock.pe, pddd: stock.pb, fdFavok: stock.evEbitda, fdSatis: stock.evSales },
    getiriler: { yilIciPct: stock.returnYtd, aylikPct: stock.return1m },
    skorlar: {
      finoraSkoru: stock.qualityScore,
      degerlemeSkoru: stock.valuationScore,
      fScore: stock.fScore,
      zScore: stock.zScore,
      mScore: stock.mScore,
    },
    maliYil: fiscalYear,
    oranlar: stock.ratios,
    grahamDegeriTl: stock.grahamValue,
    temettuVerimi12AyPct: stock.dividendYieldPct,
    temettuGecmisi: stock.dividendHistory?.slice(-6),
    destekTl: stock.supportLevel,
    direncTl: stock.resistanceLevel,
    bankaVeyaFinans: stock.statementGroup !== 'industrial',
  }
}

export function portfolioPayload(a: PortfolioAnalysis) {
  return {
    toplamDegerTl: Math.round(a.totalValue),
    toplamGetiriPct: r1(a.totalCost ? (a.totalValue / a.totalCost - 1) * 100 : null),
    yillikOynaklikPct: r1(a.volatilityPct),
    betaBist100: r1(a.beta),
    agirlikliSkorlar: {
      finoraSkoru: r1(a.weighted.quality),
      fScore: r1(a.weighted.fScore),
      degerlemeSkoru: r1(a.weighted.valuation),
      temettuVerimiPct: r1(a.weighted.dividendYield),
    },
    sektorAgirliklari: a.sectorWeights.map((s) => ({ sektor: s.sector, agirlikPct: r1(s.weight * 100) })),
    pozisyonlar: a.holdings.map((h) => ({
      kod: h.stock.ticker,
      sektor: h.stock.sector,
      agirlikPct: r1(h.weight * 100),
      karZararPct: r1(h.pnlPct),
      finoraSkoru: h.stock.qualityScore,
      fScore: h.stock.fScore,
      zScore: h.stock.zScore,
      degerlemeSkoru: h.stock.valuationScore,
    })),
    sistemUyarilari: a.warnings,
  }
}

export async function requestAi(kind: AiKind, payload: unknown): Promise<{ model: string; result: AiResult }> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, payload }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
  return body
}
