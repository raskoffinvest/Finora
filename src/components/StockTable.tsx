import type { Stock } from '../types'
import { fScoreTier, priceScoreLabel, priceScoreTier, proScoreTier, zScoreTier } from '../lib/scoring'
import { ScoreBadge } from './ScoreBadge'

export function StockTable({
  stocks,
  onSelect,
}: {
  stocks: Stock[]
  onSelect: (stock: Stock) => void
}) {
  if (stocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-hairline)] p-10 text-center text-sm text-[var(--text-muted)]">
        Bu filtrelere uyan şirket bulunamadı. Filtreleri gevşetmeyi deneyin.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-1)]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--gridline)] text-xs text-[var(--text-muted)]">
            <th className="px-4 py-3 font-medium">Şirket</th>
            <th className="px-4 py-3 font-medium">Sektör</th>
            <th className="px-4 py-3 font-medium">Fiyat Skoru</th>
            <th className="px-4 py-3 font-medium">F-Score</th>
            <th className="px-4 py-3 font-medium">Z-Score</th>
            <th className="px-4 py-3 font-medium">ProScore</th>
            <th className="px-4 py-3 font-medium">Temettü Verimi</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <tr
              key={stock.id}
              onClick={() => onSelect(stock)}
              className="cursor-pointer border-b border-[var(--gridline)] last:border-0 hover:bg-black/[0.02]"
            >
              <td className="px-4 py-3">
                <div className="font-medium">{stock.name}</div>
                <div className="text-xs text-[var(--text-muted)]">{stock.ticker}</div>
              </td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{stock.sector}</td>
              <td className="px-4 py-3">
                <ScoreBadge tier={priceScoreTier(stock.priceScore)} label={`${priceScoreLabel(stock.priceScore)} (${stock.priceScore})`} />
              </td>
              <td className="px-4 py-3">
                <ScoreBadge tier={fScoreTier(stock.fScore)} label={`${stock.fScore}/9`} />
              </td>
              <td className="px-4 py-3">
                <ScoreBadge tier={zScoreTier(stock.zScore)} label={stock.zScore.toFixed(1)} />
              </td>
              <td className="px-4 py-3">
                <ScoreBadge tier={proScoreTier(stock.proScore)} label={`${stock.proScore}/10`} />
              </td>
              <td className="px-4 py-3 tabular-nums">%{stock.dividendYieldPct.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
