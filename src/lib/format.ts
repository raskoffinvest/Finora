type Num = number | null | undefined

const dash = '—'

export function fmt(value: Num, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return dash
  return value.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function fmtPct(value: Num, digits = 1): string {
  if (value == null) return dash
  return value < 0 ? `-%${fmt(-value, digits)}` : `%${fmt(value, digits)}`
}

export function fmtTl(value: Num, digits = 2): string {
  return value == null ? dash : `${fmt(value, digits)} ₺`
}

// Büyük tutarlar: 1,2 mr ₺ / 340 mn ₺
export function fmtBigTl(value: Num): string {
  if (value == null) return dash
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${fmt(value / 1e9, 1)} mr ₺`
  if (abs >= 1e6) return `${fmt(value / 1e6, 0)} mn ₺`
  return fmtTl(value, 0)
}
