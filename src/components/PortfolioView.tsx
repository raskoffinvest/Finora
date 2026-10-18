import { useMemo, useState, type FormEvent } from 'react'
import type { PricePoint, Stock } from '../types'
import { fmt, fmtBigTl, fmtPct, fmtTl } from '../lib/format'
import { portfolioPayload } from '../lib/ai'
import { analyzePortfolio } from '../lib/portfolioAnalysis'
import { AiCommentary } from './AiCommentary'
import { fScoreTier, qualityTier, valuationTier } from '../lib/scoring'
import type { Portfolio } from '../lib/usePortfolio'
import { ScoreBadge } from './ScoreBadge'
import { Change, Panel } from './ui'

function AddPositionForm({ portfolio, stocksByTicker }: { portfolio: Portfolio; stocksByTicker: Map<string, Stock> }) {
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [cost, setCost] = useState('')
  const stock = stocksByTicker.get(ticker.toLocaleUpperCase('tr'))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const qty = Number(quantity.replace(',', '.'))
    const unit = Number((cost || String(stock?.price ?? '')).replace(',', '.'))
    if (!stock || !(qty > 0) || !(unit > 0)) return
    portfolio.add({ ticker: stock.ticker, quantity: qty, cost: unit })
    setTicker('')
    setQuantity('')
    setCost('')
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 p-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--text-muted)]">Hisse</span>
        <input
          list="portfolio-tickers"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toLocaleUpperCase('tr'))}
          placeholder="ör. THYAO"
          required
          className="w-32 rounded-md border border-[var(--border-hairline)] px-2 py-1.5"
        />
        <datalist id="portfolio-tickers">
          {[...stocksByTicker.values()].map((s) => (
            <option key={s.ticker} value={s.ticker}>
              {s.name}
            </option>
          ))}
        </datalist>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--text-muted)]">Adet</span>
        <input
          inputMode="decimal"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          className="w-28 rounded-md border border-[var(--border-hairline)] px-2 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--text-muted)]">Ort. maliyet (₺)</span>
        <input
          inputMode="decimal"
          value={cost}
          placeholder={stock?.price ? String(stock.price) : ''}
          onChange={(e) => setCost(e.target.value)}
          className="w-32 rounded-md border border-[var(--border-hairline)] px-2 py-1.5"
        />
      </label>
      <button
        type="submit"
        disabled={!stock}
        className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white enabled:hover:bg-[var(--brand-ink)] disabled:opacity-40"
      >
        Pozisyon ekle
      </button>
      <p className="w-full text-xs text-[var(--text-muted)]">
        Maliyet boş bırakılırsa güncel fiyat kullanılır. Portföy yalnızca bu tarayıcıda saklanır.
      </p>
    </form>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--gridline)] p-3">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{children}</div>
    </div>
  )
}

export function PortfolioView({
  mode,
  portfolio,
  stocksByTicker,
  benchmark,
  onSelect,
}: {
  mode: 'cuzdan' | 'analiz'
  portfolio: Portfolio
  stocksByTicker: Map<string, Stock>
  benchmark: PricePoint[]
  onSelect: (stock: Stock) => void
}) {
  const analysis = useMemo(
    () => analyzePortfolio(portfolio.positions, stocksByTicker, benchmark),
    [portfolio.positions, stocksByTicker, benchmark],
  )
  const pnl = analysis.totalValue - analysis.totalCost

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{mode === 'cuzdan' ? 'Portföy Cüzdan' : 'Portföy Analizi'}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
          {mode === 'cuzdan'
            ? 'Pozisyonlarınızı girin; değer ve kâr/zarar gecikmeli fiyatlarla hesaplanır.'
            : 'Portföyünüzün sektör dağılımı, ağırlıklı skorları ve son 52 haftalık risk ölçüleri.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Portföy değeri">{fmtBigTl(analysis.totalValue)}</Stat>
        <Stat label="Maliyet">{fmtBigTl(analysis.totalCost)}</Stat>
        <Stat label="Kâr / zarar">
          <span className={pnl >= 0 ? 'text-[var(--status-good)]' : 'text-[var(--status-critical)]'}>{fmtBigTl(pnl)}</span>
        </Stat>
        <Stat label="Getiri">
          <Change value={analysis.totalCost ? (pnl / analysis.totalCost) * 100 : null} />
        </Stat>
      </div>

      {mode === 'cuzdan' && (
        <>
          <Panel title="Yeni pozisyon">
            <AddPositionForm portfolio={portfolio} stocksByTicker={stocksByTicker} />
          </Panel>
          <Panel title={`Pozisyonlar (${portfolio.positions.length})`}>
            {portfolio.positions.length === 0 ? (
              <p className="p-6 text-center text-sm text-[var(--text-muted)]">Henüz pozisyon yok.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-[var(--text-muted)]">
                    <tr className="border-b border-[var(--gridline)]">
                      <th className="px-4 py-2 text-left font-medium">Hisse</th>
                      <th className="px-3 py-2 text-right font-medium">Adet</th>
                      <th className="px-3 py-2 text-right font-medium">Maliyet</th>
                      <th className="px-3 py-2 text-right font-medium">Fiyat</th>
                      <th className="px-3 py-2 text-right font-medium">Değer</th>
                      <th className="px-3 py-2 text-right font-medium">K/Z</th>
                      <th className="px-3 py-2 text-right font-medium">Ağırlık</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.positions.map((p) => {
                      const h = analysis.holdings.find((x) => x.position.id === p.id)
                      const stock = stocksByTicker.get(p.ticker)
                      return (
                        <tr key={p.id} className="border-b border-[var(--gridline)] last:border-0">
                          <td className="px-4 py-2">
                            <button type="button" onClick={() => stock && onSelect(stock)} className="font-medium hover:underline">
                              {p.ticker}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              aria-label={`${p.ticker} adet`}
                              type="number"
                              min={0}
                              step="any"
                              value={p.quantity}
                              onChange={(e) => portfolio.update(p.id, { quantity: Number(e.target.value) })}
                              className="w-24 rounded border border-[var(--border-hairline)] px-1.5 py-0.5 text-right tabular-nums"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              aria-label={`${p.ticker} maliyet`}
                              type="number"
                              min={0}
                              step="any"
                              value={p.cost}
                              onChange={(e) => portfolio.update(p.id, { cost: Number(e.target.value) })}
                              className="w-24 rounded border border-[var(--border-hairline)] px-1.5 py-0.5 text-right tabular-nums"
                            />
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt(stock?.price)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmtTl(h?.value, 0)}</td>
                          <td className="px-3 py-2 text-right">
                            <Change value={h?.pnlPct} />
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{h ? fmtPct(h.weight * 100) : '—'}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => portfolio.remove(p.id)}
                              className="text-xs text-[var(--text-muted)] hover:text-[var(--status-critical)]"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}

      {mode === 'analiz' &&
        (analysis.holdings.length === 0 ? (
          <Panel>
            <p className="p-6 text-center text-sm text-[var(--text-muted)]">
              Analiz için önce <a href="#/portfoy" className="text-[var(--brand)] hover:underline">Portföy Cüzdan</a>'a pozisyon ekleyin.
            </p>
          </Panel>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <Stat label="Ağırlıklı Finora Skoru">
                <ScoreBadge tier={qualityTier(analysis.weighted.quality)} label={`${fmt(analysis.weighted.quality, 1)}/10`} />
              </Stat>
              <Stat label="Ağırlıklı F-Score">
                <ScoreBadge tier={fScoreTier(analysis.weighted.fScore)} label={`${fmt(analysis.weighted.fScore, 1)}/9`} />
              </Stat>
              <Stat label="Ağırlıklı Değerleme">
                <ScoreBadge tier={valuationTier(analysis.weighted.valuation)} label={fmt(analysis.weighted.valuation, 0)} />
              </Stat>
              <Stat label="Temettü verimi">{fmtPct(analysis.weighted.dividendYield)}</Stat>
              <Stat label="Yıllık oynaklık">{fmtPct(analysis.volatilityPct)}</Stat>
              <Stat label="Beta (BIST 100)">{fmt(analysis.beta)}</Stat>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Sektör dağılımı">
                <ul className="space-y-2 p-4">
                  {analysis.sectorWeights.map((s) => (
                    <li key={s.sector} className="text-sm">
                      <div className="flex justify-between">
                        <span>{s.sector}</span>
                        <span className="tabular-nums">{fmtPct(s.weight * 100)}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-black/[0.05]">
                        <div className="h-2 rounded-full bg-[var(--series-tl)]" style={{ width: `${s.weight * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Risk uyarıları">
                {analysis.warnings.length === 0 ? (
                  <p className="p-4 text-sm text-[var(--text-muted)]">Belirgin bir yoğunlaşma veya skor uyarısı yok.</p>
                ) : (
                  <ul className="space-y-2 p-4 text-sm">
                    {analysis.warnings.map((w) => (
                      <li key={w} className="flex gap-2">
                        <span aria-hidden="true" className="text-[var(--status-warning-ink)]">
                          ●
                        </span>
                        {w}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <Panel title="Yapay zekâ ile portföy yorumu">
              <div className="p-4">
                <AiCommentary
                  key={analysis.holdings.map((h) => `${h.position.ticker}:${h.position.quantity}`).join(',')}
                  kind="portfolio"
                  payload={portfolioPayload(analysis)}
                  cta="Gemini ile portföy yorumu oluştur"
                />
              </div>
            </Panel>

            <p className="text-xs text-[var(--text-muted)]">
              Oynaklık ve beta, pozisyonların son 52 haftalık haftalık getirilerinden bugünkü ağırlıklarla hesaplanır.
              Bu analiz yatırım tavsiyesi değildir.
            </p>
          </>
        ))}
    </div>
  )
}
