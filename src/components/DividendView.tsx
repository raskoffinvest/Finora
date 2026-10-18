import { useMemo, useState } from 'react'
import type { Stock } from '../types'
import { buildDividendPortfolio, dividendProfile, lastFullYear, type DividendProfile } from '../lib/dividends'
import { fmt, fmtPct, fmtTl } from '../lib/format'
import type { Portfolio } from '../lib/usePortfolio'
import { ScoreBadge } from './ScoreBadge'
import { Change, Panel, Tabs } from './ui'

const scoreTier = (s: number) => (s >= 70 ? 'good' : s >= 45 ? 'warning' : 'critical')

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 rounded-md border border-[var(--border-hairline)] px-2 py-1.5 tabular-nums"
      />
    </label>
  )
}

function ProfileTable({ rows, onSelect }: { rows: DividendProfile[]; onSelect: (stock: Stock) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-[var(--text-muted)]">
          <tr className="border-b border-[var(--gridline)]">
            <th className="px-4 py-2 text-left font-medium">Şirket</th>
            <th className="px-3 py-2 text-left font-medium">Temettü Skoru</th>
            <th className="px-3 py-2 text-right font-medium">Verim (12 ay)</th>
            <th className="px-3 py-2 text-right font-medium">Ödenen yıl (6)</th>
            <th className="px-3 py-2 text-right font-medium">Kesintisiz</th>
            <th className="px-3 py-2 text-right font-medium">5 yıllık $ büyüme</th>
            <th className="px-3 py-2 text-right font-medium">Dağıtım oranı</th>
            <th className="px-4 py-2 text-right font-medium">SNA karşılama</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr
              key={p.stock.ticker}
              onClick={() => onSelect(p.stock)}
              className="cursor-pointer border-b border-[var(--gridline)] last:border-0 hover:bg-black/[0.02]"
            >
              <td className="px-4 py-2">
                <div className="font-medium">{p.stock.ticker}</div>
                <div className="max-w-52 truncate text-xs text-[var(--text-muted)]">{p.stock.sector}</div>
              </td>
              <td className="px-3 py-2">
                <ScoreBadge tier={scoreTier(p.score)} label={String(p.score)} />
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtPct(p.yieldPct)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{p.paidYears}/6</td>
              <td className="px-3 py-2 text-right tabular-nums">{p.streak} yıl</td>
              <td className="px-3 py-2 text-right">
                <Change value={p.usdCagrPct} />
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtPct(p.payoutPct, 0)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{p.fcfCoverage == null ? '—' : `${fmt(p.fcfCoverage, 1)}×`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PortfolioBuilder({
  profiles,
  portfolio,
  onSelect,
}: {
  profiles: DividendProfile[]
  portfolio: Portfolio
  onSelect: (stock: Stock) => void
}) {
  const [budget, setBudget] = useState(100_000)
  const [count, setCount] = useState(8)
  const [maxPerSector, setMaxPerSector] = useState(2)
  const [minYield, setMinYield] = useState(3)
  const [added, setAdded] = useState(false)

  const picks = useMemo(
    () => buildDividendPortfolio(profiles, { budget, count, maxPerSector, minYieldPct: minYield }),
    [profiles, budget, count, maxPerSector, minYield],
  )
  const invested = picks.reduce((a, p) => a + p.amount, 0)
  const income = picks.reduce((a, p) => a + p.annualIncome, 0)
  const avgScore = picks.length ? picks.reduce((a, p) => a + p.profile.score, 0) / picks.length : null

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <NumberField label="Bütçe (₺)" value={budget} onChange={setBudget} min={1000} max={100_000_000} step={1000} />
        <NumberField label="Hisse sayısı" value={count} onChange={setCount} min={3} max={20} />
        <NumberField label="Sektör başına en fazla" value={maxPerSector} onChange={setMaxPerSector} min={1} max={5} />
        <NumberField label="Min. verim (%)" value={minYield} onChange={setMinYield} min={0} max={15} step={0.5} />
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        En yüksek Temettü Skorlu, son 6 yılın en az 3'ünde temettü ödemiş hisseler sektör sınırına uyarak seçilir; bütçe
        eşit bölünür ve tam lot alınır.
      </p>

      {picks.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Bu ölçütlere uyan hisse yok; minimum verimi düşürmeyi deneyin.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Yatırılan', fmtTl(invested, 0)],
              ['Tahmini yıllık temettü', fmtTl(income, 0)],
              ['Portföy verimi', fmtPct(invested ? (income / invested) * 100 : null)],
              ['Ort. Temettü Skoru', fmt(avgScore, 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[var(--gridline)] p-3">
                <div className="text-xs text-[var(--text-muted)]">{label}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-[var(--text-muted)]">
                <tr className="border-b border-[var(--gridline)]">
                  <th className="px-3 py-2 text-left font-medium">Hisse</th>
                  <th className="px-3 py-2 text-left font-medium">Sektör</th>
                  <th className="px-3 py-2 text-right font-medium">Skor</th>
                  <th className="px-3 py-2 text-right font-medium">Fiyat</th>
                  <th className="px-3 py-2 text-right font-medium">Adet</th>
                  <th className="px-3 py-2 text-right font-medium">Tutar</th>
                  <th className="px-3 py-2 text-right font-medium">Yıllık temettü</th>
                </tr>
              </thead>
              <tbody>
                {picks.map((p) => (
                  <tr
                    key={p.profile.stock.ticker}
                    onClick={() => onSelect(p.profile.stock)}
                    className="cursor-pointer border-b border-[var(--gridline)] last:border-0 hover:bg-black/[0.02]"
                  >
                    <td className="px-3 py-2 font-medium">{p.profile.stock.ticker}</td>
                    <td className="max-w-48 truncate px-3 py-2 text-[var(--text-secondary)]">{p.profile.stock.sector}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.profile.score}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(p.profile.stock.price)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.quantity.toLocaleString('tr-TR')}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtTl(p.amount, 0)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtTl(p.annualIncome, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={added}
              onClick={() => {
                for (const p of picks) {
                  if (p.quantity > 0) portfolio.add({ ticker: p.profile.stock.ticker, quantity: p.quantity, cost: p.profile.stock.price! })
                }
                setAdded(true)
              }}
              className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white enabled:hover:bg-[var(--brand-ink)] disabled:opacity-50"
            >
              {added ? 'Portföy Cüzdan’a eklendi' : 'Portföy Cüzdan’a ekle'}
            </button>
            {added && (
              <a href="#/portfoy" className="text-sm text-[var(--brand)] hover:underline">
                Cüzdanı aç
              </a>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Tahmini temettü, son 12 ayın verimiyle hesaplanır; geçmiş temettüler gelecekte ödeneceğinin garantisi
            değildir. Bu bir yatırım tavsiyesi değildir.
          </p>
        </>
      )}
    </div>
  )
}

type Tab = 'liste' | 'portfoy'

export function DividendView({
  stocks,
  portfolio,
  onSelect,
}: {
  stocks: Stock[]
  portfolio: Portfolio
  onSelect: (stock: Stock) => void
}) {
  const [tab, setTab] = useState<Tab>('liste')
  const [minYears, setMinYears] = useState(3)
  const fullYear = lastFullYear()
  const profiles = useMemo(
    () => stocks.map((s) => dividendProfile(s, fullYear)).filter((p): p is DividendProfile => p != null),
    [stocks, fullYear],
  )
  const ranked = profiles
    .filter((p) => p.paidYears >= minYears)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Temettü</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
          Temettü ödeyen {profiles.length} şirketin sürekliliği, dolar bazlı büyümesi ve sürdürülebilirliği. Temettü
          Skoru: süreklilik %30, 5 yıllık $ büyüme %25, dağıtım oranı %20, serbest nakit akışıyla karşılanma %15, verim
          %10 ({fullYear} dahil son 6 tam yıl).
        </p>
      </div>

      <Panel
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              label="Temettü görünümü"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'liste', label: 'Temettü şirketleri' },
                { value: 'portfoy', label: 'Temettü portföyü oluştur' },
              ]}
            />
            {tab === 'liste' && (
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                En az
                <select
                  value={minYears}
                  onChange={(e) => setMinYears(Number(e.target.value))}
                  className="rounded-md border border-[var(--border-hairline)] px-1.5 py-0.5"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                yıl ödeme
              </label>
            )}
          </div>
        }
      >
        {tab === 'liste' ? (
          <ProfileTable rows={ranked} onSelect={onSelect} />
        ) : (
          <PortfolioBuilder profiles={profiles} portfolio={portfolio} onSelect={onSelect} />
        )}
      </Panel>
    </div>
  )
}
