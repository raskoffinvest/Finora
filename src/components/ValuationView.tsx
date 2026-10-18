import { useMemo, useState } from 'react'
import type { Stock, StockDataset } from '../types'
import { fmt, fmtTl } from '../lib/format'
import { DEFAULT_DCF, dcf, sectorMedians, sectorMultipleValue, upsidePct, type DcfParams } from '../lib/valuation'
import { Change, Panel } from './ui'

interface Row {
  stock: Stock
  graham: number | null
  dcf: number | null
  sector: number | null
  average: number | null
  upside: number | null
  models: number
  agreement: 'yüksek' | 'düşük' | null
}

// Modellerin medyanı: tek bir modelin uç sonucu (ör. bozuk nakit akışı verisi) ortalamayı bozmasın
function combine(xs: (number | null)[]) {
  const v = xs.filter((x): x is number => x != null && x > 0).sort((a, b) => a - b)
  if (!v.length) return { value: null, models: 0, agreement: null }
  const mid = Math.floor(v.length / 2)
  const value = v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
  const agreement = v.length < 2 ? null : v.at(-1)! / v[0] > 3 ? ('düşük' as const) : ('yüksek' as const)
  return { value, models: v.length, agreement }
}

function Slider({
  label,
  value,
  min,
  max,
  step = 0.5,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-[var(--text-muted)]">
        {label}: <span className="font-medium text-[var(--text-primary)]">%{value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

function ModelCard({ title, value, price, note }: { title: string; value: number | null; price: number | null; note: string }) {
  return (
    <div className="rounded-lg border border-[var(--gridline)] p-4">
      <div className="text-xs font-medium text-[var(--text-muted)]">{title}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{fmtTl(value)}</div>
      <Change value={upsidePct(value, price)} className="text-sm" />
      <p className="mt-2 text-xs text-[var(--text-muted)]">{note}</p>
    </div>
  )
}

export function ValuationView({ data, onSelect }: { data: StockDataset; onSelect: (stock: Stock) => void }) {
  const [params, setParams] = useState<DcfParams>(DEFAULT_DCF)
  const [ticker, setTicker] = useState('THYAO')
  const [query, setQuery] = useState('')
  const [includeLowAgreement, setIncludeLowAgreement] = useState(false)

  const medians = useMemo(() => sectorMedians(data.stocks), [data.stocks])
  const rows = useMemo<Row[]>(
    () =>
      data.stocks.map((stock) => {
        const g = stock.grahamValue ?? null
        const d = dcf(stock, data, params)?.perShareTl ?? null
        const s = sectorMultipleValue(stock, medians.get(stock.sector))
        const c = combine([g, d, s])
        return {
          stock,
          graham: g,
          dcf: d,
          sector: s,
          average: c.value,
          upside: upsidePct(c.value, stock.price),
          models: c.models,
          agreement: c.agreement,
        }
      }),
    [data, params, medians],
  )

  const selected = rows.find((r) => r.stock.ticker === ticker) ?? rows[0]
  const selectedDcf = selected ? dcf(selected.stock, data, params) : null
  const med = selected ? medians.get(selected.stock.sector) : undefined

  const ranked = rows
    .filter((r) => r.upside != null && r.models >= 2 && (includeLowAgreement || r.agreement === 'yüksek'))
    .filter((r) => !query || r.stock.ticker.includes(query.toLocaleUpperCase('tr')))
    .sort((a, b) => b.upside! - a.upside!)
    .slice(0, 50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gerçek Değer</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
          Üç bağımsız değerleme modeli yan yana: dolar bazlı indirgenmiş nakit akımı (İNA), Graham değeri ve
          sektör çarpanları. Modeller farklı varsayımlara dayanır; aralarındaki fark belirsizliğin göstergesidir.
        </p>
      </div>

      {selected && (
        <Panel
          title={
            <>
              {selected.stock.ticker} <span className="font-normal text-[var(--text-secondary)]">{selected.stock.name}</span>
            </>
          }
          actions={
            <label className="flex items-center gap-2 text-sm">
              <span className="text-[var(--text-muted)]">Şirket</span>
              <input
                list="valuation-tickers"
                defaultValue={ticker}
                onChange={(e) => {
                  const t = e.target.value.toLocaleUpperCase('tr')
                  if (data.stocks.some((s) => s.ticker === t)) setTicker(t)
                }}
                className="w-28 rounded-md border border-[var(--border-hairline)] px-2 py-1"
              />
              <datalist id="valuation-tickers">
                {data.stocks.map((s) => (
                  <option key={s.ticker} value={s.ticker}>
                    {s.name}
                  </option>
                ))}
              </datalist>
            </label>
          }
        >
          <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
              <span>
                Fiyat <span className="font-semibold tabular-nums">{fmtTl(selected.stock.price)}</span>
              </span>
              <span>
                Model medyanı <span className="font-semibold tabular-nums">{fmtTl(selected.average)}</span>{' '}
                <Change value={selected.upside} />
              </span>
              {selected.agreement && (
                <span className={selected.agreement === 'düşük' ? 'text-[var(--status-warning-ink)]' : 'text-[var(--text-muted)]'}>
                  Model uyumu: {selected.agreement}
                  {selected.agreement === 'düşük' && ' — modeller 3 kattan fazla ayrışıyor, sonuca temkinli yaklaşın'}
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ModelCard
                title="İndirgenmiş nakit akımı ($ bazlı)"
                value={selected.dcf}
                price={selected.stock.price}
                note={
                  selectedDcf
                    ? `Baz SNA ${fmt(selectedDcf.baseFcfUsd / 1e6, 0)} mn $ (son 3 yıl ort.), net borç ${fmt(selectedDcf.netDebtUsd / 1e6, 0)} mn $.`
                    : 'Hesaplanamadı: serbest nakit akışı negatif ya da mali tablo yok.'
                }
              />
              <ModelCard
                title="Graham değeri"
                value={selected.graham}
                price={selected.stock.price}
                note="√(22,5 × HBK × HBDD). Kâr veya özkaynak negatifse hesaplanmaz."
              />
              <ModelCard
                title="Sektör çarpanları"
                value={selected.sector}
                price={selected.stock.price}
                note={
                  med
                    ? `Sektör medyanı F/K ${fmt(med.pe, 1)}, PD/DD ${fmt(med.pb, 1)} (${med.peers} şirket).`
                    : 'Sektör verisi yok.'
                }
              />
            </div>
            <div className="grid gap-4 rounded-lg bg-black/[0.03] p-4 sm:grid-cols-3">
              <Slider label="5 yıllık SNA büyümesi ($)" value={params.growthPct} min={-5} max={30} onChange={(v) => setParams({ ...params, growthPct: v })} />
              <Slider label="İskonto oranı ($)" value={params.discountPct} min={8} max={25} onChange={(v) => setParams({ ...params, discountPct: v })} />
              <Slider label="Sonsuz büyüme ($)" value={params.terminalPct} min={0} max={6} onChange={(v) => setParams({ ...params, terminalPct: v })} />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              İNA varsayımları tüm tabloyu etkiler. Nakit akışları {data.fiscalYears[0]} ve önceki yılların yıl sonu
              kuruyla dolara, sonuç güncel kurla ({fmt(data.usdTryNow, 2)}) TL'ye çevrilir.
            </p>
          </div>
        </Panel>
      )}

      <Panel
        title="Modellere göre en yüksek potansiyel"
        actions={
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <input type="checkbox" checked={includeLowAgreement} onChange={(e) => setIncludeLowAgreement(e.target.checked)} />
              Model uyumu düşük olanlar
            </label>
            <input
              type="search"
              placeholder="Kod ara"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-32 rounded-md border border-[var(--border-hairline)] px-2 py-1"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[var(--text-muted)]">
              <tr className="border-b border-[var(--gridline)]">
                <th className="px-4 py-2 text-left font-medium">Şirket</th>
                <th className="px-3 py-2 text-right font-medium">Fiyat</th>
                <th className="px-3 py-2 text-right font-medium">İNA</th>
                <th className="px-3 py-2 text-right font-medium">Graham</th>
                <th className="px-3 py-2 text-right font-medium">Sektör</th>
                <th className="px-3 py-2 text-right font-medium">Medyan</th>
                <th className="px-4 py-2 text-right font-medium">Potansiyel</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr
                  key={r.stock.ticker}
                  onClick={() => setTicker(r.stock.ticker)}
                  onDoubleClick={() => onSelect(r.stock)}
                  className={`cursor-pointer border-b border-[var(--gridline)] last:border-0 hover:bg-black/[0.02] ${
                    r.stock.ticker === ticker ? 'bg-[var(--brand)]/5' : ''
                  }`}
                >
                  <td className="px-4 py-2">
                    <div className="font-medium">{r.stock.ticker}</div>
                    <div className="max-w-48 truncate text-xs text-[var(--text-muted)]">{r.stock.sector}</div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(r.stock.price)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(r.dcf)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(r.graham)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(r.sector)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(r.average)}</td>
                  <td className="px-4 py-2 text-right">
                    <Change value={r.upside} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-[var(--gridline)] px-4 py-3 text-xs text-[var(--text-muted)]">
          En az iki modelin hesaplanabildiği şirketler; varsayılan olarak modellerin birbirinden en fazla 3 kat
          ayrıştığı (uyumu yüksek) şirketler listelenir. Satıra tıklayınca yukarıda açılır, çift tıklayınca şirket
          paneli açılır. Model sonuçları yatırım tavsiyesi değildir.
        </p>
      </Panel>
    </div>
  )
}
