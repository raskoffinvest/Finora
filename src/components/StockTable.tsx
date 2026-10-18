import { useMemo, useState } from 'react'
import type { Stock } from '../types'
import type { Favorites } from '../lib/useFavorites'
import { fmt, fmtPct } from '../lib/format'
import { fScoreTier, qualityTier, valuationLabel, valuationTier, zScoreTier } from '../lib/scoring'
import { ScoreBadge } from './ScoreBadge'
import { StarButton } from './ui'

type SortKey = 'ticker' | 'price' | 'returnYtd' | 'pe' | 'pb' | 'valuationScore' | 'fScore' | 'zScore' | 'qualityScore' | 'dividendYieldPct'

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: 'ticker', label: 'Şirket' },
  { key: 'price', label: 'Fiyat', numeric: true },
  { key: 'returnYtd', label: 'Yıl İçi', numeric: true },
  { key: 'pe', label: 'F/K', numeric: true },
  { key: 'pb', label: 'PD/DD', numeric: true },
  { key: 'valuationScore', label: 'Değerleme' },
  { key: 'fScore', label: 'F-Score' },
  { key: 'zScore', label: 'Z-Score' },
  { key: 'qualityScore', label: 'Finora Skoru' },
  { key: 'dividendYieldPct', label: 'Temettü', numeric: true },
]

const PAGE = 50

export function StockTable({
  stocks,
  favorites,
  onSelect,
}: {
  stocks: Stock[]
  favorites: Favorites
  onSelect: (stock: Stock) => void
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'qualityScore', dir: -1 })
  const [visible, setVisible] = useState(PAGE)

  const sorted = useMemo(() => {
    const value = (s: Stock) => s[sort.key] ?? null
    return [...stocks].sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      if (va == null && vb == null) return 0
      if (va == null) return 1 // boş değerler her zaman sonda
      if (vb == null) return -1
      if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb, 'tr') * sort.dir
      return ((va as number) - (vb as number)) * sort.dir
    })
  }, [stocks, sort])

  if (stocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-hairline)] p-10 text-center text-sm text-[var(--text-muted)]">
        Bu filtrelere uyan şirket bulunamadı. Filtreleri gevşetmeyi deneyin.
      </div>
    )
  }

  const toggleSort = (key: SortKey) =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 1 ? -1 : 1 } : { key, dir: key === 'ticker' ? 1 : -1 }))

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-1)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--gridline)] text-xs text-[var(--text-muted)]">
              <th className="w-8 pl-3">
                <span className="sr-only">Favori</span>
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-3 font-medium ${col.numeric ? 'text-right' : ''}`}
                  aria-sort={sort.key === col.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
                >
                  <button type="button" onClick={() => toggleSort(col.key)} className="hover:text-[var(--text-primary)]">
                    {col.label}
                    {sort.key === col.key && <span aria-hidden="true">{sort.dir === 1 ? ' ↑' : ' ↓'}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, visible).map((stock) => (
              <tr
                key={stock.ticker}
                onClick={() => onSelect(stock)}
                className="cursor-pointer border-b border-[var(--gridline)] last:border-0 hover:bg-black/[0.02]"
              >
                <td className="pl-3">
                  <StarButton
                    active={favorites.has(stock.ticker)}
                    onClick={() => favorites.toggle(stock.ticker)}
                    label={favorites.has(stock.ticker) ? `${stock.ticker} favorilerden çıkar` : `${stock.ticker} favorilere ekle`}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium">{stock.ticker}</div>
                  <div className="max-w-52 truncate text-xs text-[var(--text-muted)]">
                    {stock.name} · {stock.sector}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(stock.price)}</td>
                <td
                  className={`px-3 py-2.5 text-right tabular-nums ${
                    (stock.returnYtd ?? 0) >= 0 ? 'text-[var(--status-good)]' : 'text-[var(--status-critical)]'
                  }`}
                >
                  {fmtPct(stock.returnYtd)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(stock.pe, 1)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(stock.pb, 1)}</td>
                <td className="px-3 py-2.5">
                  <ScoreBadge
                    tier={valuationTier(stock.valuationScore)}
                    label={stock.valuationScore == null ? '—' : `${valuationLabel(stock.valuationScore)} (${stock.valuationScore})`}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <ScoreBadge tier={fScoreTier(stock.fScore)} label={stock.fScore == null ? '—' : `${stock.fScore}/9`} />
                </td>
                <td className="px-3 py-2.5">
                  <ScoreBadge tier={zScoreTier(stock.zScore)} label={fmt(stock.zScore, 1)} />
                </td>
                <td className="px-3 py-2.5">
                  <ScoreBadge tier={qualityTier(stock.qualityScore)} label={stock.qualityScore == null ? '—' : `${fmt(stock.qualityScore, 1)}/10`} />
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmtPct(stock.dividendYieldPct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible < sorted.length && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE)}
            className="rounded-lg border border-[var(--border-hairline)] px-4 py-2 text-sm hover:bg-black/[0.03]"
          >
            Daha fazla göster ({sorted.length - visible} kaldı)
          </button>
        </div>
      )}
    </div>
  )
}
