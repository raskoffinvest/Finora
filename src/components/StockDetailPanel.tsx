import type { Stock } from '../types'
import { fScoreTier, priceScoreLabel, priceScoreTier, proScoreTier, zScoreTier } from '../lib/scoring'
import { DividendChart } from './DividendChart'
import { ScoreBadge } from './ScoreBadge'

export function StockDetailPanel({ stock, onClose }: { stock: Stock; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-[var(--surface-1)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{stock.name}</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {stock.ticker} · {stock.sector}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--border-hairline)] px-2 py-1 text-sm text-[var(--text-secondary)] hover:bg-black/[0.03]"
          >
            Kapat
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <ScoreBadge tier={priceScoreTier(stock.priceScore)} label={`Fiyat Skoru: ${priceScoreLabel(stock.priceScore)} (${stock.priceScore})`} />
          <ScoreBadge tier={fScoreTier(stock.fScore)} label={`F-Score: ${stock.fScore}/9`} />
          <ScoreBadge tier={zScoreTier(stock.zScore)} label={`Z-Score: ${stock.zScore.toFixed(1)}`} />
          <ScoreBadge tier={proScoreTier(stock.proScore)} label={`ProScore: ${stock.proScore}/10`} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[var(--text-muted)]">Güncel Fiyat</dt>
            <dd className="tabular-nums font-medium">{stock.currentPrice.toFixed(2)} TL</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Temettü Verimi</dt>
            <dd className="tabular-nums font-medium">%{stock.dividendYieldPct.toFixed(1)}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">F/K · F/DD</dt>
            <dd className="tabular-nums font-medium">
              {stock.peRatio.toFixed(1)} · {stock.pbRatio.toFixed(1)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Nakit Durumu</dt>
            <dd className="font-medium">{stock.cashStrength}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Ciro Büyümesi</dt>
            <dd className="tabular-nums font-medium">%{stock.revenueGrowthPct}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Net Kâr Büyümesi</dt>
            <dd className="tabular-nums font-medium">%{stock.netIncomeGrowthPct}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Destek</dt>
            <dd className="tabular-nums font-medium">{stock.supportLevel.toFixed(2)} TL</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Direnç</dt>
            <dd className="tabular-nums font-medium">{stock.resistanceLevel.toFixed(2)} TL</dd>
          </div>
        </dl>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Temettü Büyüme Geçmişi
          </h3>
          <p className="mb-2 text-xs text-[var(--text-muted)]">
            Hisse başına toplam dağıtılan temettü — örnek veri.
          </p>
          <DividendChart data={stock.dividendHistory} />
        </div>

        <p className="mt-6 rounded-lg bg-black/[0.03] p-3 text-xs text-[var(--text-muted)]">
          Bu panelde gösterilen veriler örnek/demo amaçlıdır ve gerçek piyasa verisi
          değildir. Yatırım tavsiyesi niteliği taşımaz.
        </p>
      </div>
    </div>
  )
}
