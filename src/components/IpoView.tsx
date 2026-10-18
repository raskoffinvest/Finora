import { useState } from 'react'
import type { Ipo, MarketDataset, Stock } from '../types'
import { fmt, fmtBigTl } from '../lib/format'
import { istanbulToday, ipoStatus } from '../lib/ipo'
import { upsidePct } from '../lib/valuation'
import { Change, Panel, Tabs } from './ui'

const trDate = (iso?: string | null) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('tr-TR') : '—')

export function IpoTable({
  ipos,
  stocksByTicker,
  onSelect,
  compact = false,
}: {
  ipos: Ipo[]
  stocksByTicker: Map<string, Stock>
  onSelect: (stock: Stock) => void
  compact?: boolean
}) {
  if (ipos.length === 0) return <p className="p-6 text-center text-sm text-[var(--text-muted)]">Bu grupta halka arz yok.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-[var(--text-muted)]">
          <tr className="border-b border-[var(--gridline)]">
            <th className="px-4 py-2 text-left font-medium">Şirket</th>
            <th className="px-3 py-2 text-right font-medium">Fiyat</th>
            <th className="px-3 py-2 text-right font-medium">Arz fiyatı</th>
            <th className="px-3 py-2 text-right font-medium">Arz sonrası</th>
            <th className="px-3 py-2 text-left font-medium">İlk işlem</th>
            {!compact && <th className="px-3 py-2 text-left font-medium">Talep toplama</th>}
            <th className="px-3 py-2 text-right font-medium">Büyüklük</th>
            {!compact && <th className="px-3 py-2 text-right font-medium">Katılımcı</th>}
            {!compact && <th className="px-4 py-2 text-left font-medium">Aracı kurum</th>}
          </tr>
        </thead>
        <tbody>
          {ipos.map((ipo) => {
            const stock = ipo.ticker ? stocksByTicker.get(ipo.ticker) : undefined
            return (
              <tr
                key={ipo.url}
                onClick={() => stock && onSelect(stock)}
                className={`border-b border-[var(--gridline)] last:border-0 ${stock ? 'cursor-pointer hover:bg-black/[0.02]' : ''}`}
              >
                <td className="px-4 py-2">
                  <div className="font-medium">{ipo.ticker ?? '—'}</div>
                  <div className="max-w-56 truncate text-xs text-[var(--text-muted)]">{ipo.name}</div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {stock ? (
                    <>
                      <div>{fmt(stock.price)}</div>
                      <Change value={stock.return1d} className="text-xs" />
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(ipo.ipoPrice)}</td>
                <td className="px-3 py-2 text-right">
                  <Change value={upsidePct(stock?.price, ipo.ipoPrice)} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">{trDate(ipo.firstTradeDate)}</td>
                {!compact && <td className="whitespace-nowrap px-3 py-2">{ipo.subscriptionText ?? '—'}</td>}
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{fmtBigTl(ipo.sizeTl)}</td>
                {!compact && (
                  <td className="px-3 py-2 text-right tabular-nums">
                    {ipo.participants == null ? '—' : ipo.participants.toLocaleString('tr-TR')}
                  </td>
                )}
                {!compact && <td className="max-w-56 truncate px-4 py-2 text-[var(--text-secondary)]">{ipo.broker ?? '—'}</td>}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type Tab = 'aktif' | 'gerceklesen' | 'taslak'

export function IpoView({
  market,
  stocksByTicker,
  onSelect,
}: {
  market: MarketDataset
  stocksByTicker: Map<string, Stock>
  onSelect: (stock: Stock) => void
}) {
  // eski market.json dosyalarında ipos alanı yok
  const { listed, drafts } = market.ipos ?? { listed: [], drafts: [] }
  const now = istanbulToday()
  const active = listed.filter((i) => ipoStatus(i, now) !== 'gerceklesen')
  const done = listed.filter((i) => ipoStatus(i, now) === 'gerceklesen')
  const [tab, setTab] = useState<Tab>(active.length ? 'aktif' : 'gerceklesen')
  const [query, setQuery] = useState('')

  const avgReturn = (() => {
    const xs = done
      .map((i) => upsidePct(i.ticker ? stocksByTicker.get(i.ticker)?.price : null, i.ipoPrice))
      .filter((x): x is number => x != null)
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
  })()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Halka Arz</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
          Son halka arzların fiyat, büyüklük ve katılım bilgileri, arz fiyatına göre güncel getirileri ve SPK onayı
          bekleyen taslak başvurular.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Talep toplama / bekleyen', String(active.filter((i) => ipoStatus(i, now) === 'aktif').length)],
          ['Son gerçekleşen arz', String(done.length)],
          ['Taslak başvuru', String(drafts.length)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[var(--gridline)] bg-[var(--surface-1)] p-3">
            <div className="text-xs text-[var(--text-muted)]">{label}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
          </div>
        ))}
        <div className="rounded-lg border border-[var(--gridline)] bg-[var(--surface-1)] p-3">
          <div className="text-xs text-[var(--text-muted)]">Ort. arz sonrası getiri</div>
          <div className="mt-1 text-lg font-semibold">
            <Change value={avgReturn} />
          </div>
        </div>
      </div>

      <Panel
        actions={
          <Tabs
            label="Halka arz grubu"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'aktif', label: `Aktif (${active.length})` },
              { value: 'gerceklesen', label: `Gerçekleşenler (${done.length})` },
              { value: 'taslak', label: `Taslaklar (${drafts.length})` },
            ]}
          />
        }
      >
        {tab === 'taslak' ? (
          <div>
            <div className="border-b border-[var(--gridline)] p-3">
              <input
                type="search"
                placeholder="Şirket ara"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full max-w-xs rounded-md border border-[var(--border-hairline)] px-2 py-1 text-sm"
              />
            </div>
            <ul className="max-h-[32rem] divide-y divide-[var(--gridline)] overflow-y-auto text-sm">
              {drafts
                .filter((d) => d.name.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')))
                .map((d) => (
                  <li key={d.url} className="px-4 py-2">
                    <a href={d.url} target="_blank" rel="noreferrer" className="hover:underline">
                      {d.name}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <IpoTable ipos={tab === 'aktif' ? active : done} stocksByTicker={stocksByTicker} onSelect={onSelect} />
        )}
      </Panel>

      <p className="text-xs text-[var(--text-muted)]">
        Kaynak: halkarz.com. Arz sonrası getiri, güncel fiyatın arz fiyatına oranıdır; arz sonrası bedelsiz sermaye
        artırımı yapan şirketlerde düzeltilmemiş olduğu için yanıltıcı olabilir.
      </p>
    </div>
  )
}
