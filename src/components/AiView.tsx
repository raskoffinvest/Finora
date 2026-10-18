import { useState } from 'react'
import type { Stock, StockDataset } from '../types'
import { stockPayload } from '../lib/ai'
import { fmt, fmtTl } from '../lib/format'
import { fScoreTier, qualityTier, valuationLabel, valuationTier, zScoreTier } from '../lib/scoring'
import { AiCommentary } from './AiCommentary'
import { ScoreBadge } from './ScoreBadge'
import { Panel } from './ui'

export function AiView({ data, onSelect }: { data: StockDataset; onSelect: (stock: Stock) => void }) {
  const [ticker, setTicker] = useState('THYAO')
  const stock = data.stocks.find((s) => s.ticker === ticker)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Yapay Zekâ Analizi</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
          Gemini, şirketin Finora'daki skorlarını, oranlarını ve değerleme verilerini okuyup güçlü yönleri, riskleri ve
          potansiyeli özetler. Yorum yalnızca bu verilere dayanır; haber veya tahmin eklemez.
        </p>
      </div>

      <Panel
        title={
          stock ? (
            <>
              {stock.ticker} <span className="font-normal text-[var(--text-secondary)]">{stock.name}</span>
            </>
          ) : (
            'Şirket seçin'
          )
        }
        actions={
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--text-muted)]">Şirket</span>
            <input
              list="ai-tickers"
              defaultValue={ticker}
              onChange={(e) => {
                const t = e.target.value.toLocaleUpperCase('tr')
                if (data.stocks.some((s) => s.ticker === t)) setTicker(t)
              }}
              className="w-28 rounded-md border border-[var(--border-hairline)] px-2 py-1"
            />
            <datalist id="ai-tickers">
              {data.stocks.map((s) => (
                <option key={s.ticker} value={s.ticker}>
                  {s.name}
                </option>
              ))}
            </datalist>
          </label>
        }
      >
        {stock && (
          <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="mr-2">
                Fiyat <span className="font-semibold tabular-nums">{fmtTl(stock.price)}</span>
              </span>
              <ScoreBadge tier={qualityTier(stock.qualityScore)} label={`Finora ${fmt(stock.qualityScore, 1)}/10`} />
              <ScoreBadge tier={valuationTier(stock.valuationScore)} label={`Değerleme: ${valuationLabel(stock.valuationScore)}`} />
              <ScoreBadge tier={fScoreTier(stock.fScore)} label={`F ${stock.fScore ?? '—'}/9`} />
              <ScoreBadge tier={zScoreTier(stock.zScore)} label={`Z ${fmt(stock.zScore, 2)}`} />
              <button type="button" onClick={() => onSelect(stock)} className="ml-auto text-[var(--brand)] hover:underline">
                Şirket detayı
              </button>
            </div>
            {/* key: şirket değişince önceki yorum sıfırlansın */}
            <AiCommentary
              key={stock.ticker}
              kind="stock"
              payload={stockPayload(stock, data.fiscalYears[0])}
              cta={`${stock.ticker} için yapay zekâ yorumu oluştur`}
            />
          </div>
        )}
      </Panel>
    </div>
  )
}
