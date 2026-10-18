import { useMemo, useState } from 'react'
import type { CorporateAction, MarketDataset, MarketQuote, Stock } from '../types'
import { fmt, fmtBigTl } from '../lib/format'
import { ipoStatus } from '../lib/ipo'
import { IpoTable } from './IpoView'
import { Change, Panel, Sparkline, Tabs } from './ui'

type QuoteGroup = 'Tümü' | MarketQuote['group']

function QuoteCards({ quotes }: { quotes: MarketQuote[] }) {
  const [group, setGroup] = useState<QuoteGroup>('Tümü')
  const shown = group === 'Tümü' ? quotes : quotes.filter((q) => q.group === group)
  return (
    <Panel
      title="Piyasalar"
      actions={
        <Tabs
          label="Piyasa grubu"
          value={group}
          onChange={setGroup}
          options={(['Tümü', 'Endeksler', 'Kurlar', 'Emtialar'] as const).map((g) => ({ value: g, label: g }))}
        />
      }
    >
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {shown.map((q) => (
          <div key={q.symbol} className="rounded-lg border border-[var(--gridline)] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-xs font-medium text-[var(--text-secondary)]">{q.name}</span>
              <Change value={q.changePct} className="text-xs" />
            </div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className="text-base font-semibold tabular-nums">{fmt(q.price, q.price < 100 ? 4 : 2)}</span>
              <Sparkline values={q.history.map((p) => p.close ?? 0)} width={56} height={20} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

type CalendarTab = 'temettu' | 'artirim' | 'gecmis'

const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' })
const trDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('tr-TR')

function CalendarBox({
  actions,
  stocksByTicker,
  onSelect,
}: {
  actions: CorporateAction[]
  stocksByTicker: Map<string, Stock>
  onSelect: (stock: Stock) => void
}) {
  const [tab, setTab] = useState<CalendarTab>('temettu')
  const now = today()
  const rows = useMemo(() => {
    if (tab === 'temettu') return actions.filter((a) => a.type === 'temettu' && a.date >= now)
    if (tab === 'artirim') return actions.filter((a) => a.type !== 'temettu' && a.date >= now)
    return actions.filter((a) => a.date < now).reverse().slice(0, 30)
  }, [actions, tab, now])

  return (
    <Panel
      title="Şirket takvimi"
      actions={
        <Tabs
          label="Takvim"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'temettu', label: 'Yaklaşan temettüler' },
            { value: 'artirim', label: 'Sermaye artırımları' },
            { value: 'gecmis', label: 'Son olaylar' },
          ]}
        />
      }
    >
      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-[var(--text-muted)]">Bu dönemde kayıtlı olay yok.</p>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--surface-1)] text-xs text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">Şirket</th>
                <th className="px-4 py-2 font-medium">Tarih</th>
                <th className="px-4 py-2 font-medium">Tür</th>
                <th className="px-4 py-2 text-right font-medium">Hisse başı / oran</th>
                <th className="px-4 py-2 text-right font-medium">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => {
                const stock = stocksByTicker.get(a.ticker)
                return (
                  <tr
                    key={`${a.ticker}-${a.date}-${a.type}-${i}`}
                    onClick={() => stock && onSelect(stock)}
                    className={`border-t border-[var(--gridline)] ${stock ? 'cursor-pointer hover:bg-black/[0.02]' : ''}`}
                  >
                    <td className="px-4 py-2">
                      <div className="font-medium">{a.ticker}</div>
                      {stock && <div className="max-w-40 truncate text-xs text-[var(--text-muted)]">{stock.name}</div>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums">{trDate(a.date)}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-[var(--text-secondary)]">
                      {a.type === 'temettu' ? 'Nakit temettü' : a.type === 'bedelli' ? 'Bedelli' : 'Bedelsiz'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {a.type === 'temettu' ? `${fmt(a.perShare, 4)} ₺` : `%${fmt(a.ratioPct, 2)}`}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{a.type === 'temettu' ? fmtBigTl(a.total) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

type MoverTab = 'hisse' | 'sektor'

interface Mover {
  key: string
  label: string
  sub: string
  change: number
  stock?: Stock
}

function MoversBox({ stocks, onSelect }: { stocks: Stock[]; onSelect: (stock: Stock) => void }) {
  const [tab, setTab] = useState<MoverTab>('hisse')

  const movers = useMemo<Mover[]>(() => {
    if (tab === 'hisse') {
      return stocks
        .filter((s) => s.return1d != null)
        .map((s) => ({ key: s.ticker, label: s.ticker, sub: s.name, change: s.return1d!, stock: s }))
    }
    // Sektör getirisi: piyasa değeri ağırlıklı günlük getiri, en az 3 şirketli sektörler
    const groups = new Map<string, { cap: number; weighted: number; count: number }>()
    for (const s of stocks) {
      if (s.return1d == null || !s.marketCapMnTl) continue
      const g = groups.get(s.sector) ?? { cap: 0, weighted: 0, count: 0 }
      g.cap += s.marketCapMnTl
      g.weighted += s.marketCapMnTl * s.return1d
      g.count++
      groups.set(s.sector, g)
    }
    return [...groups]
      .filter(([, g]) => g.count >= 3)
      .map(([sector, g]) => ({ key: sector, label: sector, sub: `${g.count} şirket`, change: g.weighted / g.cap }))
  }, [stocks, tab])

  const sorted = [...movers].sort((a, b) => b.change - a.change)
  const columns = [
    { title: 'En çok yükselenler', items: sorted.slice(0, 6) },
    { title: 'En çok düşenler', items: sorted.slice(-6).reverse() },
  ]

  return (
    <Panel
      title="Günün hareketlileri"
      actions={
        <Tabs
          label="Hareketliler"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'hisse', label: 'Hisseler' },
            { value: 'sektor', label: 'Sektörler' },
          ]}
        />
      }
    >
      <div className="grid gap-px bg-[var(--gridline)] sm:grid-cols-2">
        {columns.map((col) => (
          <div key={col.title} className="bg-[var(--surface-1)] p-3">
            <h3 className="mb-2 text-xs font-medium text-[var(--text-muted)]">{col.title}</h3>
            <ul className="space-y-1">
              {col.items.map((m) => (
                <li key={m.key}>
                  <button
                    type="button"
                    disabled={!m.stock}
                    onClick={() => m.stock && onSelect(m.stock)}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm enabled:hover:bg-black/[0.03]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{m.label}</span>
                      <span className="block truncate text-xs text-[var(--text-muted)]">{m.sub}</span>
                    </span>
                    <Change value={m.change} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function MarketView({
  market,
  stocks,
  onSelect,
}: {
  market: MarketDataset
  stocks: Stock[]
  onSelect: (stock: Stock) => void
}) {
  const stocksByTicker = useMemo(() => new Map(stocks.map((s) => [s.ticker, s])), [stocks])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Piyasa</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Güncelleme: {new Date(market.generatedAt).toLocaleString('tr-TR')} · Fiyatlar gecikmelidir.
        </p>
      </div>
      <QuoteCards quotes={market.quotes} />
      <div className="grid gap-6 2xl:grid-cols-2">
        <CalendarBox actions={market.actions} stocksByTicker={stocksByTicker} onSelect={onSelect} />
        <MoversBox stocks={stocks} onSelect={onSelect} />
      </div>
      <Panel
        title="Son halka arzlar"
        actions={
          <a href="#/halka-arz" className="text-sm text-[var(--brand)] hover:underline">
            Tümü
          </a>
        }
      >
        <IpoTable
          compact
          ipos={(market.ipos?.listed ?? []).filter((i) => ipoStatus(i) !== 'ertelendi').slice(0, 6)}
          stocksByTicker={stocksByTicker}
          onSelect={onSelect}
        />
      </Panel>
    </div>
  )
}
