// Finansal tablolardan rasyo ve skor hesapları. Tüm formüller literatürdeki açık
// tanımlarıyla uygulanmıştır (Piotroski 2000, Altman 1968, Beneish 1999, Graham).
//
// Dizi indeksleri: 0 = son mali yıl, 1 = bir önceki yıl, …

// İş Yatırım MaliTablo (XI_29, sanayi şirketleri) kalem kodları
const CODES = {
  currentAssets: '1A',
  cash: '1AA',
  receivables: '1AC',
  ppe: '1BG',
  totalAssets: '1BL',
  currentLiabilities: '2A',
  shortTermDebt: '2AA',
  longTermLiabilities: '2B',
  longTermDebt: '2BA',
  equity: '2N',
  parentEquity: '2O',
  paidCapital: '2OA',
  pastEarnings: '2OCE',
  periodEarnings: '2OCF',
  revenue: '3C',
  cogs: '3CA',
  grossProfit: '3D',
  marketingExpense: '3DA',
  adminExpense: '3DB',
  operatingProfit: '3DF',
  netIncome: '3L',
  parentNetIncome: '3Z',
  depreciation: '4B',
  operatingCashFlow: '4C',
  capex: '4CAI',
  freeCashFlow: '4CB',
  dividendsPaid: '4CBB',
  capitalIncrease: '4CBC',
}

export function financialsFromRows(rows) {
  const byCode = new Map(rows.map((r) => [r.itemCode, r]))
  const out = {}
  for (const [key, code] of Object.entries(CODES)) {
    const row = byCode.get(code)
    out[key] = [1, 2, 3, 4].map((i) => {
      const v = row?.[`value${i}`]
      if (v == null || v === '') return null
      const n = Number(v)
      return Number.isFinite(n) ? n : null
    })
  }
  // Bir yılın tüm tablosu boşsa (henüz yayımlanmamış) o yılı null yap
  for (let i = 0; i < 4; i++) {
    if (!out.totalAssets[i]) for (const key of Object.keys(out)) out[key][i] = null
  }
  return out
}

const div = (a, b) => (a == null || b == null || b === 0 ? null : a / b)
const has = (...xs) => xs.every((x) => x != null && Number.isFinite(x))
const pct = (x) => (x == null ? null : Number((x * 100).toFixed(2)))
const avg = (a, b) => (has(a, b) ? (a + b) / 2 : a)

export function ratios(f, i = 0) {
  const debt = has(f.shortTermDebt[i], f.longTermDebt[i]) ? f.shortTermDebt[i] + f.longTermDebt[i] : null
  const growth = (a, b) => (has(a, b) && b > 0 ? a / b - 1 : null)
  return {
    roe: pct(div(f.parentNetIncome[i], avg(f.parentEquity[i], f.parentEquity[i + 1]))),
    roa: pct(div(f.netIncome[i], avg(f.totalAssets[i], f.totalAssets[i + 1]))),
    grossMargin: pct(div(f.grossProfit[i], f.revenue[i])),
    operatingMargin: pct(div(f.operatingProfit[i], f.revenue[i])),
    netMargin: pct(div(f.netIncome[i], f.revenue[i])),
    revenueGrowth: pct(growth(f.revenue[i], f.revenue[i + 1])),
    netIncomeGrowth: pct(growth(f.parentNetIncome[i], f.parentNetIncome[i + 1])),
    operatingProfitGrowth: pct(growth(f.operatingProfit[i], f.operatingProfit[i + 1])),
    currentRatio: round(div(f.currentAssets[i], f.currentLiabilities[i])),
    debtToEquity: round(div(debt, f.equity[i])),
    netDebt: has(debt, f.cash[i]) ? debt - f.cash[i] : null,
    freeCashFlow: f.freeCashFlow[i],
  }
}

// Piotroski F-Score (0-9). Sermaye artırımı kriteri, Türkiye'de yaygın olan bedelsiz
// artırımları cezalandırmamak için nakit akışındaki "Sermaye Artırımı" kalemine bakar.
export function piotroskiF(f) {
  const need = [
    f.netIncome[0], f.totalAssets[0], f.totalAssets[1], f.netIncome[1], f.operatingCashFlow[0],
    f.revenue[0], f.revenue[1], f.grossProfit[0], f.grossProfit[1],
    f.currentAssets[0], f.currentAssets[1], f.currentLiabilities[0], f.currentLiabilities[1],
  ]
  if (!has(...need)) return null
  const roa0 = f.netIncome[0] / f.totalAssets[0]
  const roa1 = f.netIncome[1] / f.totalAssets[1]
  const lev0 = (f.longTermDebt[0] ?? 0) / f.totalAssets[0]
  const lev1 = (f.longTermDebt[1] ?? 0) / f.totalAssets[1]
  const cr0 = f.currentAssets[0] / f.currentLiabilities[0]
  const cr1 = f.currentAssets[1] / f.currentLiabilities[1]
  const gm0 = f.grossProfit[0] / f.revenue[0]
  const gm1 = f.grossProfit[1] / f.revenue[1]
  const at0 = f.revenue[0] / f.totalAssets[0]
  const at1 = f.revenue[1] / f.totalAssets[1]
  const criteria = [
    roa0 > 0,
    f.operatingCashFlow[0] > 0,
    roa0 > roa1,
    f.operatingCashFlow[0] > f.netIncome[0],
    lev0 <= lev1,
    cr0 > cr1,
    !(f.capitalIncrease[0] > 0),
    gm0 > gm1,
    at0 > at1,
  ]
  return criteria.filter(Boolean).length
}

// Altman Z-Score (1968, halka açık üretim şirketleri)
export function altmanZ(f, marketCap) {
  const ta = f.totalAssets[0]
  const tl = has(f.currentLiabilities[0], f.longTermLiabilities[0])
    ? f.currentLiabilities[0] + f.longTermLiabilities[0]
    : null
  const re = (f.pastEarnings[0] ?? 0) + (f.periodEarnings[0] ?? 0)
  if (!has(ta, tl, marketCap, f.currentAssets[0], f.currentLiabilities[0], f.operatingProfit[0], f.revenue[0]) || ta <= 0 || tl <= 0) {
    return null
  }
  return (
    1.2 * ((f.currentAssets[0] - f.currentLiabilities[0]) / ta) +
    1.4 * (re / ta) +
    3.3 * (f.operatingProfit[0] / ta) +
    0.6 * (marketCap / tl) +
    1.0 * (f.revenue[0] / ta)
  )
}

// Beneish M-Score (8 değişkenli model). > -1.78 yüksek, > -2.22 orta manipülasyon riski.
export function beneishM(f) {
  const sga = (i) => -((f.marketingExpense[i] ?? 0) + (f.adminExpense[i] ?? 0))
  const liab = (i) =>
    has(f.currentLiabilities[i], f.longTermLiabilities[i]) ? f.currentLiabilities[i] + f.longTermLiabilities[i] : null
  const dep = (i) => (f.depreciation[i] == null ? null : Math.abs(f.depreciation[i]))

  const dsri = div(div(f.receivables[0], f.revenue[0]), div(f.receivables[1], f.revenue[1]))
  const gmi = div(div(f.grossProfit[1], f.revenue[1]), div(f.grossProfit[0], f.revenue[0]))
  const aq = (i) => (has(f.currentAssets[i], f.ppe[i], f.totalAssets[i]) ? 1 - (f.currentAssets[i] + f.ppe[i]) / f.totalAssets[i] : null)
  const aqi = div(aq(0), aq(1))
  const sgi = div(f.revenue[0], f.revenue[1])
  const depRate = (i) => (has(dep(i), f.ppe[i]) ? div(dep(i), dep(i) + f.ppe[i]) : null)
  const depi = div(depRate(1), depRate(0))
  const sgai = div(div(sga(0), f.revenue[0]), div(sga(1), f.revenue[1]))
  const lvgi = div(div(liab(0), f.totalAssets[0]), div(liab(1), f.totalAssets[1]))
  const tata = has(f.netIncome[0], f.operatingCashFlow[0]) ? div(f.netIncome[0] - f.operatingCashFlow[0], f.totalAssets[0]) : null

  if (!has(dsri, gmi, aqi, sgi, depi, sgai, lvgi, tata)) return null
  return (
    -4.84 + 0.92 * dsri + 0.528 * gmi + 0.404 * aqi + 0.892 * sgi + 0.115 * depi - 0.172 * sgai + 4.679 * tata - 0.327 * lvgi
  )
}

// Graham değeri: √(22.5 × HBK × HBDD). Hisse adedi = ödenmiş sermaye (1 TL nominal).
export function grahamValue(f, shares) {
  const eps = div(f.parentNetIncome[0], shares)
  const bvps = div(f.parentEquity[0], shares)
  if (!has(eps, bvps) || eps <= 0 || bvps <= 0) return null
  return Math.sqrt(22.5 * eps * bvps)
}

// Haftalık barlardan son 52 haftanın pivot dip/tepe noktalarına göre destek ve direnç.
export function supportResistance(bars, price) {
  const recent = bars.slice(-52).filter((b) => b.high != null && b.low != null)
  if (!recent.length) return {}
  const last = price ?? recent.at(-1).close
  const pivLows = []
  const pivHighs = []
  for (let i = 2; i < recent.length - 2; i++) {
    const win = recent.slice(i - 2, i + 3)
    if (recent[i].low === Math.min(...win.map((b) => b.low))) pivLows.push(recent[i].low)
    if (recent[i].high === Math.max(...win.map((b) => b.high))) pivHighs.push(recent[i].high)
  }
  const low52 = Math.min(...recent.map((b) => b.low))
  const high52 = Math.max(...recent.map((b) => b.high))
  const below = pivLows.filter((x) => x < last)
  const above = pivHighs.filter((x) => x > last)
  return {
    supportLevel: round(below.length ? Math.max(...below) : low52),
    resistanceLevel: round(above.length ? Math.min(...above) : high52),
    low52w: round(low52),
    high52w: round(high52),
    priceHistory: recent.map((b) => ({ t: b.t, close: round(b.close) })),
  }
}

function round(x, d = 2) {
  return x == null || !Number.isFinite(x) ? null : Number(x.toFixed(d))
}
