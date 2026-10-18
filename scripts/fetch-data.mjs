// Finora veri hattı: halka açık kaynaklardan BIST verisini çeker, skorları hesaplar ve
// public/data/stocks.json dosyasını üretir.
//
// Kaynaklar (resmi API değildir; kişisel/geliştirme kullanımı içindir, ticari yayında
// lisanslı bir veri sağlayıcıya geçilmelidir):
//   - İş Yatırım "Temel Değerler ve Oranlar" sayfası: hisse listesi, sektör, fiyat, çarpanlar
//   - İş Yatırım MaliTablo: yıllık bilanço, gelir tablosu, nakit akışı
//   - Yahoo Finance chart: haftalık fiyat geçmişi, temettüler, USD/TRY
//
// Kullanım: node scripts/fetch-data.mjs [--limit 20] [--only THYAO,ASELS] [--refresh] [--market-only]
// --market-only yalnızca piyasa panelini (market.json) günceller.
// Ham yanıtlar .cache/ altında saklanır; --refresh önbelleği yok sayar.

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  altmanZ,
  beneishM,
  financialsFromRows,
  grahamValue,
  piotroskiF,
  ratios,
  supportResistance,
} from './lib/metrics.mjs'
import { parseTables, trNumber } from './lib/html.mjs'
import { parseIpoDetail, parseIpoIndex, parseTrDates } from './lib/ipo.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const CACHE = path.join(ROOT, '.cache')
const OUT = path.join(ROOT, 'public', 'data', 'stocks.json')
const MARKET_OUT = path.join(ROOT, 'public', 'data', 'market.json')
const UA = 'Mozilla/5.0 (Finora data pipeline)'

const args = process.argv.slice(2)
const argValue = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const LIMIT = Number(argValue('--limit')) || Infinity
const ONLY = argValue('--only')?.split(',').map((s) => s.trim().toUpperCase())
const REFRESH = args.includes('--refresh')
const MARKET_ONLY = args.includes('--market-only')

// Son tamamlanmış dört mali yıl. Ekim 2026'da 2025 yıllık tablolar yayımlanmış durumdadır.
const now = new Date()
const LAST_FY = now.getMonth() >= 3 ? now.getFullYear() - 1 : now.getFullYear() - 2
const YEARS = [LAST_FY, LAST_FY - 1, LAST_FY - 2, LAST_FY - 3]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Önbellek süreleri (saat): fiyatlar her çalıştırmada, grafikler yarım günde, mali tablolar
// haftada bir yenilenir.
const MAX_AGE = { prices: 0, charts: 12, statements: 24 * 7, ipoIndex: 6, ipoDetail: 24 }

async function cachedFetch(key, url, { json = true, maxAgeHours = Infinity } = {}) {
  const file = path.join(CACHE, key)
  if (!REFRESH && existsSync(file)) {
    const ageHours = (Date.now() - (await stat(file)).mtimeMs) / 3_600_000
    if (ageHours < maxAgeHours) {
      const text = await readFile(file, 'utf8')
      try {
        return json ? JSON.parse(text) : text
      } catch {
        // bozuk önbellek kaydı: aşağıda yeniden indirilir
      }
    }
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const parsed = json ? JSON.parse(text) : text // bozuk yanıt önbelleğe yazılmadan yeniden denenir
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, text)
      return parsed
    } catch (err) {
      if (attempt === 3) throw new Error(`${url}: ${err.message}`)
      await sleep(1000 * attempt)
    }
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  let done = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
      done++
      if (done % 25 === 0 || done === items.length) {
        process.stdout.write(`\r  ${done}/${items.length}`)
      }
      await sleep(150)
    }
  }
  await Promise.all(Array.from({ length: limit }, worker))
  process.stdout.write('\n')
  return results
}

// --- 1) Hisse listesi, sektör, fiyat, çarpanlar --------------------------------------

async function fetchUniverse() {
  const html = await cachedFetch(
    'isyatirim/temel-degerler.html',
    'https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/Temel-Degerler-Ve-Oranlar.aspx',
    { json: false, maxAgeHours: MAX_AGE.prices },
  )
  const tables = parseTables(html)
  const find = (header) => tables.find((t) => t.headers.includes(header))

  const basic = find('Hisse Adı')
  const multiples = find('FD/Satışlar')
  const returns = find('Yıl İçi Getiri (%)')
  if (!basic || !multiples || !returns) throw new Error('Temel Değerler tabloları bulunamadı')

  const byCode = (table) => new Map(table.rows.map((r) => [r[0], r]))
  const mult = byCode(multiples)
  const ret = byCode(returns)

  const stocks = basic.rows
    .filter((r) => /^[A-Z0-9]{3,6}$/.test(r[0]))
    .map((r) => {
      const m = mult.get(r[0]) ?? []
      const g = ret.get(r[0]) ?? []
      return {
        ticker: r[0],
        name: r[1],
        sector: r[2],
        price: trNumber(r[3]),
        marketCapMnTl: trNumber(r[4]),
        marketCapMnUsd: trNumber(r[5]),
        freeFloatPct: trNumber(r[6]),
        paidCapitalMnTl: trNumber(r[7]),
        pe: trNumber(m[2]),
        evEbitda: trNumber(m[3]),
        evSales: trNumber(m[4]),
        pb: trNumber(m[5]),
        lastPeriod: m[6] ?? null,
        return1d: trNumber(g[2]),
        return1w: trNumber(g[3]),
        return1m: trNumber(g[4]),
        returnYtd: trNumber(g[5]),
      }
    })
  return { stocks, actions: corporateActions(find('Hisse Başı Brüt (TL)')) }
}

// Yıl içindeki sermaye artırımı ve temettü olayları (ileri tarihliler dahil)
function corporateActions(table) {
  if (!table) return []
  const isoDate = (text) => {
    const [d, m, y] = (text ?? '').split('.')
    return y ? `${y}-${m}-${d}` : null
  }
  const events = []
  for (const r of table.rows) {
    const date = isoDate(r[3])
    if (!date || !/^[A-Z0-9]{3,6}$/.test(r[0])) continue
    const base = { ticker: r[0], date }
    const rightsPct = trNumber(r[4])
    const bonusPct = (trNumber(r[7]) ?? 0) + (trNumber(r[8]) ?? 0)
    const cashPerShare = trNumber(r[11])
    if (rightsPct) events.push({ ...base, type: 'bedelli', ratioPct: rightsPct })
    if (bonusPct) events.push({ ...base, type: 'bedelsiz', ratioPct: round(bonusPct) })
    if (cashPerShare) events.push({ ...base, type: 'temettu', perShare: cashPerShare, total: trNumber(r[10]) })
  }
  return events.sort((a, b) => a.date.localeCompare(b.date))
}

// --- Piyasa kartları ------------------------------------------------------------------

const MARKET_SYMBOLS = [
  { symbol: 'XU100.IS', name: 'BIST 100', group: 'Endeksler' },
  { symbol: 'XU030.IS', name: 'BIST 30', group: 'Endeksler' },
  { symbol: 'XBANK.IS', name: 'BIST Banka', group: 'Endeksler' },
  { symbol: 'XUSIN.IS', name: 'BIST Sınai', group: 'Endeksler' },
  { symbol: 'USDTRY=X', name: 'USD/TRY', group: 'Kurlar' },
  { symbol: 'EURTRY=X', name: 'EUR/TRY', group: 'Kurlar' },
  { symbol: 'GBPTRY=X', name: 'GBP/TRY', group: 'Kurlar' },
  { symbol: 'GC=F', name: 'Altın (ons, $)', group: 'Emtialar' },
  { symbol: 'SI=F', name: 'Gümüş (ons, $)', group: 'Emtialar' },
  { symbol: 'BZ=F', name: 'Brent Petrol ($)', group: 'Emtialar' },
]

async function fetchQuote({ symbol, name, group }) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`
  const data = await cachedFetch(`yahoo-quote/${symbol}.json`, url, { maxAgeHours: MAX_AGE.prices })
  const result = data?.chart?.result?.[0]
  const closes = result?.indicators?.quote?.[0]?.close ?? []
  const history = (result?.timestamp ?? [])
    .map((t, i) => ({ t, close: round(closes[i], 4) }))
    .filter((p) => p.close != null)
  if (history.length < 2) return null
  const last = history.at(-1).close
  const prev = history.at(-2).close
  return { symbol, name, group, price: last, changePct: round((last / prev - 1) * 100), time: result.meta.regularMarketTime, history }
}

// --- Halka arzlar (halkarz.com) --------------------------------------------------------

async function fetchIpos() {
  const html = await cachedFetch('halkarz/index.html', 'https://halkarz.com/', { json: false, maxAgeHours: MAX_AGE.ipoIndex })
  const items = parseIpoIndex(html)
  const listed = []
  for (const item of items.filter((i) => i.section === 'listed')) {
    const slug = new URL(item.url).pathname.replace(/\W+/g, '_')
    let detail = {}
    try {
      detail = parseIpoDetail(
        await cachedFetch(`halkarz/detail/${slug}.html`, item.url, { json: false, maxAgeHours: MAX_AGE.ipoDetail }),
      )
    } catch (err) {
      console.log(`  uyarı: ${item.name} ayrıntısı alınamadı (${err.message})`)
    }
    const days = parseTrDates(item.subscriptionText ?? '')
    listed.push({
      name: item.name,
      ticker: item.ticker ?? detail.tickerFromDetail ?? null,
      url: item.url,
      subscriptionText: item.subscriptionText,
      subscriptionStart: days[0] ?? null,
      subscriptionEnd: days.at(-1) ?? null,
      ...detail,
    })
    await sleep(150)
  }
  const drafts = items.filter((i) => i.section === 'draft').map((i) => ({ name: i.name, url: i.url }))
  return { listed, drafts }
}

async function fetchMarket(actions) {
  const quotes = (await Promise.all(MARKET_SYMBOLS.map(fetchQuote))).filter(Boolean)
  // Gram altın (TL) = ons altın ($) × USD/TRY ÷ 31,1035
  const gold = quotes.find((q) => q.symbol === 'GC=F')
  const usd = quotes.find((q) => q.symbol === 'USDTRY=X')
  if (gold && usd) {
    // Yahoo kur barları 23:00 UTC'de, vadeli altın 04:00 UTC'de damgalanır; İstanbul saatine göre eşleştir
    const day = (t) => new Date(t * 1000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' })
    const usdByDay = new Map(usd.history.map((p) => [day(p.t), p.close]))
    const history = gold.history
      .map((p) => {
        const rate = usdByDay.get(day(p.t))
        return rate ? { t: p.t, close: round((p.close * rate) / 31.1035) } : null
      })
      .filter(Boolean)
    if (history.length >= 2) {
      const last = history.at(-1).close
      const prev = history.at(-2).close
      quotes.splice(quotes.indexOf(gold), 0, {
        symbol: 'GRAM-ALTIN', name: 'Gram Altın (₺)', group: 'Emtialar',
        price: last, changePct: round((last / prev - 1) * 100), time: gold.time, history,
      })
    }
  }
  await mkdir(path.dirname(MARKET_OUT), { recursive: true })
  // Portföy betası için BIST 100 haftalık kapanışları (son 52 hafta)
  const xu100 = await fetchChart('XU100.IS')
  const benchmark = (xu100?.bars ?? []).slice(-52).map((b) => ({ t: b.t, close: round(b.close) }))
  await writeFile(
    MARKET_OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), quotes, actions, benchmark, ipos: await fetchIpos() }),
  )
  console.log(`Yazıldı: ${path.relative(ROOT, MARKET_OUT)} (${quotes.length} kart, ${actions.length} şirket olayı)`)
}

// --- 2) Mali tablolar -----------------------------------------------------------------

function maliTabloUrl(code, group) {
  const params = new URLSearchParams({ companyCode: code, exchange: 'TRY', financialGroup: group })
  YEARS.forEach((y, i) => {
    params.set(`year${i + 1}`, String(y))
    params.set(`period${i + 1}`, '12')
  })
  return `https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/Data.aspx/MaliTablo?${params}`
}

async function fetchFinancials(code) {
  const industrial = await cachedFetch(`isyatirim/mali/${code}-XI_29.json`, maliTabloUrl(code, 'XI_29'), {
    maxAgeHours: MAX_AGE.statements,
  })
  if (industrial?.value?.length) return { group: 'industrial', rows: industrial.value }
  const bank = await cachedFetch(`isyatirim/mali/${code}-UFRS.json`, maliTabloUrl(code, 'UFRS'), {
    maxAgeHours: MAX_AGE.statements,
  })
  if (bank?.value?.length) return { group: 'financial', rows: bank.value }
  return { group: 'none', rows: [] }
}

// --- 3) Fiyat geçmişi, temettü, kur ----------------------------------------------------

async function fetchChart(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=10y&interval=1wk&events=div`
  const data = await cachedFetch(`yahoo/${symbol}.json`, url, { maxAgeHours: MAX_AGE.charts })
  const result = data?.chart?.result?.[0]
  if (!result?.timestamp) return null
  const q = result.indicators.quote[0]
  const bars = result.timestamp
    .map((t, i) => ({ t, high: q.high[i], low: q.low[i], close: q.close[i] }))
    .filter((b) => b.close != null)
  const dividends = Object.values(result.events?.dividends ?? {}).sort((a, b) => a.date - b.date)
  return { bars, dividends }
}

function usdRateAt(usdBars, t) {
  let best = null
  for (const b of usdBars) {
    if (b.t <= t) best = b
    else break
  }
  return (best ?? usdBars[0])?.close ?? null
}

function dividendHistory(dividends, usdBars) {
  const byYear = new Map()
  for (const d of dividends) {
    const year = new Date(d.date * 1000).getUTCFullYear()
    const rate = usdRateAt(usdBars, d.date)
    const row = byYear.get(year) ?? { year, tl: 0, usd: 0 }
    row.tl += d.amount
    row.usd += rate ? d.amount / rate : 0
    byYear.set(year, row)
  }
  return [...byYear.values()]
    .sort((a, b) => a.year - b.year)
    .map((r) => ({ year: r.year, tl: round(r.tl, 4), usd: round(r.usd, 4) }))
}

// --- 4) Göreli skorlar ----------------------------------------------------------------

// Sektör içi yüzdelik: değer düşük oldukça (ucuz) yüksek puan.
function addValuationScores(stocks) {
  const metrics = ['pe', 'pb', 'evEbitda']
  const bySector = new Map()
  for (const s of stocks) bySector.set(s.sector, [...(bySector.get(s.sector) ?? []), s])
  for (const group of bySector.values()) {
    const pool = group.length >= 5 ? group : stocks
    for (const s of group) {
      const parts = metrics
        .map((m) => {
          const v = s[m]
          if (v == null || v <= 0) return null
          const peers = pool.map((p) => p[m]).filter((x) => x != null && x > 0)
          const cheaperOrEqual = peers.filter((x) => x >= v).length
          return cheaperOrEqual / peers.length
        })
        .filter((x) => x != null)
      s.valuationScore = parts.length ? Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100) : null
    }
  }
}

// Finora Skoru (0-10): kârlılık, büyüme, finansal sağlık, borçluluk ve değerlemenin ağırlıklı
// ortalaması. Her bileşen 0-1 aralığına sıkıştırılır; eksik bileşenler ağırlıktan düşülür.
function addQualityScore(s) {
  const clamp01 = (x) => Math.max(0, Math.min(1, x))
  const r = s.ratios ?? {}
  const parts = [
    [r.roe, 0.2, (v) => clamp01(v / 40)],
    [r.netMargin, 0.1, (v) => clamp01(v / 25)],
    [r.revenueGrowth, 0.15, (v) => clamp01((v + 10) / 80)],
    [r.netIncomeGrowth, 0.1, (v) => clamp01((v + 20) / 100)],
    [s.fScore, 0.2, (v) => v / 9],
    [s.zScore, 0.1, (v) => clamp01((v - 1) / 3)],
    [r.debtToEquity, 0.05, (v) => clamp01(1 - v / 2)],
    [s.valuationScore, 0.1, (v) => v / 100],
  ].filter(([v]) => v != null && Number.isFinite(v))
  const weight = parts.reduce((a, [, w]) => a + w, 0)
  if (weight < 0.5) {
    s.qualityScore = null
    return
  }
  const score = parts.reduce((a, [v, w, f]) => a + w * f(v), 0) / weight
  s.qualityScore = round(score * 10, 1)
}

const round = (x, d = 2) => (x == null || !Number.isFinite(x) ? null : Number(x.toFixed(d)))

// --- Ana akış -------------------------------------------------------------------------

async function main() {
  console.log('1/4 Hisse listesi ve piyasa verisi alınıyor…')
  const { stocks: allStocks, actions } = await fetchUniverse()
  await fetchMarket(actions)
  if (MARKET_ONLY) return
  let universe = allStocks
  if (ONLY) universe = universe.filter((s) => ONLY.includes(s.ticker))
  universe = universe.slice(0, LIMIT)
  console.log(`  ${universe.length} hisse`)

  console.log('2/4 USD/TRY geçmişi alınıyor…')
  const usd = await fetchChart('USDTRY=X')
  const usdBars = usd?.bars ?? []

  console.log(`3/4 Mali tablolar ve fiyat geçmişi alınıyor (${YEARS.join(', ')})…`)
  const failures = []
  const stocks = await mapLimit(universe, 4, async (base) => {
    const stock = { ...base, years: YEARS }
    try {
      const fin = await fetchFinancials(base.ticker)
      stock.statementGroup = fin.group
      if (fin.group === 'industrial') {
        const f = financialsFromRows(fin.rows)
        const marketCap = base.marketCapMnTl != null ? base.marketCapMnTl * 1e6 : null
        const shares = base.paidCapitalMnTl != null ? base.paidCapitalMnTl * 1e6 : null
        stock.financials = f
        stock.ratios = ratios(f)
        stock.fScore = piotroskiF(f)
        stock.zScore = round(altmanZ(f, marketCap))
        stock.mScore = round(beneishM(f))
        stock.grahamValue = round(grahamValue(f, shares))
      }
    } catch (err) {
      failures.push(`${base.ticker} mali tablo: ${err.message}`)
    }
    try {
      const chart = await fetchChart(`${base.ticker}.IS`)
      if (chart) {
        stock.dividendHistory = dividendHistory(chart.dividends, usdBars)
        Object.assign(stock, supportResistance(chart.bars, base.price))
        const yearAgo = Date.now() / 1000 - 365 * 86400
        const ttm = chart.dividends.filter((d) => d.date >= yearAgo).reduce((a, d) => a + d.amount, 0)
        stock.dividendYieldPct = base.price ? round((ttm / base.price) * 100) : null
      }
    } catch (err) {
      failures.push(`${base.ticker} fiyat: ${err.message}`)
    }
    return stock
  })

  console.log('4/4 Skorlar hesaplanıyor…')
  addValuationScores(stocks)
  stocks.forEach(addQualityScore)

  await mkdir(path.dirname(OUT), { recursive: true })
  await writeFile(
    OUT,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      fiscalYears: YEARS,
      // Dolar bazlı değerleme için mali yıl sonu ve güncel USD/TRY
      usdTryYearEnd: Object.fromEntries(
        YEARS.map((y) => [y, round(usdRateAt(usdBars, Date.UTC(y, 11, 31, 23) / 1000), 4)]),
      ),
      usdTryNow: round(usdBars.at(-1)?.close, 4),
      sources: ['İş Yatırım (Temel Değerler, Mali Tablolar)', 'Yahoo Finance (fiyat, temettü, USD/TRY)'],
      stocks,
    }),
  )
  console.log(`Yazıldı: ${path.relative(ROOT, OUT)} (${stocks.length} hisse)`)
  if (failures.length) {
    console.log(`${failures.length} uyarı:`)
    failures.slice(0, 20).forEach((f) => console.log('  - ' + f))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
