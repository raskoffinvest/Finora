// Bağımlılıksız, basit HTML tablo ayrıştırıcı. Yalnızca İş Yatırım tabloları için yeterlidir.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

export function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : m
    }
    return ENTITIES[e.toLowerCase()] ?? m
  })
}

const cellText = (html) => decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

export function parseTables(html) {
  const tables = []
  for (const [table] of html.matchAll(/<table[\s\S]*?<\/table>/gi)) {
    const headers = [...table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => cellText(m[1]))
    const rows = []
    for (const [, tr] of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => cellText(m[1]))
      if (cells.length) rows.push(cells)
    }
    tables.push({ headers, rows })
  }
  return tables
}

// "21.425,0" -> 21425, "-3,88" -> -3.88, "-" / "" / "A/D" -> null
export function trNumber(text) {
  if (text == null) return null
  const cleaned = String(text).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}
