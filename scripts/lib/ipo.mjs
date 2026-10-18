// halkarz.com sayfalarından halka arz bilgilerini ayrıştırır (ağ erişimi çağıran tarafta).

import { decodeEntities, trNumber } from './html.mjs'

const MONTHS = {
  ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6,
  temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12,
}

const text = (html) => decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

// "9-10-11 Eylül 2026", "30 Eylül-1-2 Ekim 2026", "17 Eylül 2026" -> ['2026-09-09', ...]
export function parseTrDates(raw) {
  if (!raw) return []
  const year = Number(raw.match(/\b(20\d{2})\b/)?.[1])
  if (!year) return []
  const tokens = raw.toLocaleLowerCase('tr').replace(/\b20\d{2}\b/g, ' ').split(/[\s,–-]+/).filter(Boolean)
  const dates = []
  let pending = []
  for (const tok of tokens) {
    if (/^\d{1,2}$/.test(tok)) pending.push(Number(tok))
    else if (MONTHS[tok]) {
      dates.push(...pending.map((d) => iso(year, MONTHS[tok], d)))
      pending = []
    }
  }
  return dates.sort()
}

// Ana sayfa: "İlk Halka Arzlar" (gerçekleşen/aktif) ve "Taslak Arzlar" (SPK onayı bekleyen) listeleri
export function parseIpoIndex(html) {
  const draftsAt = html.search(/<ul class="halka-arz-list taslak"/)
  const items = []
  for (const m of html.matchAll(/<article class="index-list"[\s\S]*?<\/article>/g)) {
    const a = m[0]
    const h3 = a.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? ''
    const url = h3.match(/href="(https:\/\/halkarz\.com\/[^"]+)"/)?.[1]
    const name = text(h3)
    if (!url || !name) continue
    const code = text(a.match(/<span class="il-bist-kod">([\s\S]*?)<\/span>/)?.[1] ?? '') || null
    const dateText = a.match(/<time[^>]*datetime="([^"]*)"/)?.[1] ?? null
    items.push({
      url,
      name,
      ticker: code && /^[A-Z0-9]{3,6}$/.test(code) ? code : null,
      subscriptionText: dateText,
      section: draftsAt >= 0 && m.index > draftsAt ? 'draft' : 'listed',
    })
  }
  return items
}

// Ayrıntı sayfası: "Etiket : değer" satırları ve dağıtım tablosundaki toplam katılımcı
export function parseIpoDetail(html) {
  const fields = {}
  for (const [, row] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => text(c[1])).filter(Boolean)
    if (cells.length >= 2 && cells[0].endsWith(':')) fields[cells[0].replace(/\s*:$/, '')] = cells.slice(1).join(' ')
    if (cells[0] === 'Toplam' && cells.length >= 3) fields.__participants = cells[1]
  }
  const lots = trNumber(fields['Pay']?.replace(/lot/i, ''))
  const price = trNumber(fields['Halka Arz Fiyatı/Aralığı']?.split(/[-–]/)[0])
  return {
    ipoPrice: price,
    lots,
    sizeTl: price && lots ? price * lots : null,
    method: fields['Dağıtım Yöntemi'] ?? null,
    broker: fields['Aracı Kurum'] ?? null,
    market: fields['Pazar'] ?? null,
    freeFloatPct: trNumber(fields['Fiili Dolaşımdaki Pay Oranı (%)']?.replace('%', '').replace('.', ',')),
    firstTradeDate: parseTrDates(fields['Bist İlk İşlem Tarihi'] ?? '')[0] ?? null,
    participants: trNumber(fields.__participants),
    tickerFromDetail: fields['Bist Kodu'] ?? null,
  }
}
