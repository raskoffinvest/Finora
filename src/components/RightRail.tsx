import type { MarketQuote, Stock } from '../types'
import { fmt } from '../lib/format'
import { MAX_FAVORITES, type Favorites } from '../lib/useFavorites'
import { Change, Panel, Sparkline, StarButton } from './ui'

function IndexCard({ quote }: { quote: MarketQuote }) {
  return (
    <Panel>
      <div className="p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">{quote.name}</span>
          <span className="text-xs text-[var(--text-muted)]">
            {new Date(quote.time * 1000).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold tabular-nums">{fmt(quote.price)}</div>
            <Change value={quote.changePct} className="text-sm" />
          </div>
          <Sparkline values={quote.history.map((p) => p.close ?? 0)} width={110} height={40} />
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">Son 1 ay, günlük kapanış</p>
      </div>
    </Panel>
  )
}

function FavoritesList({
  favorites,
  stocksByTicker,
  onSelect,
}: {
  favorites: Favorites
  stocksByTicker: Map<string, Stock>
  onSelect: (stock: Stock) => void
}) {
  const items = favorites.list.map((t) => stocksByTicker.get(t)).filter((s): s is Stock => !!s)
  return (
    <Panel
      title={
        <>
          Favorilerim{' '}
          <span className="font-normal text-[var(--text-muted)]">
            {items.length}/{MAX_FAVORITES}
          </span>
        </>
      }
    >
      {items.length === 0 ? (
        <p className="p-4 text-sm text-[var(--text-muted)]">
          Tarama tablosunda ya da şirket sayfasında ☆ işaretine basarak hisse ekleyin.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Sembol</th>
              <th className="px-2 py-2 text-right font-medium">Fiyat</th>
              <th className="px-2 py-2 text-right font-medium">Günlük</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr
                key={s.ticker}
                onClick={() => onSelect(s)}
                className="cursor-pointer border-t border-[var(--gridline)] hover:bg-black/[0.02]"
              >
                <td className="px-4 py-2 font-medium">{s.ticker}</td>
                <td className="px-2 py-2 text-right tabular-nums">{fmt(s.price)}</td>
                <td className="px-2 py-2 text-right">
                  <Change value={s.return1d} />
                </td>
                <td className="pr-3 text-right">
                  <StarButton active onClick={() => favorites.toggle(s.ticker)} label={`${s.ticker} favorilerden çıkar`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  )
}

export function RightRail({
  index,
  favorites,
  stocksByTicker,
  onSelect,
}: {
  index?: MarketQuote
  favorites: Favorites
  stocksByTicker: Map<string, Stock>
  onSelect: (stock: Stock) => void
}) {
  return (
    <aside className="space-y-6 xl:sticky xl:top-6 xl:w-72 xl:shrink-0 xl:self-start">
      {index && <IndexCard quote={index} />}
      <FavoritesList favorites={favorites} stocksByTicker={stocksByTicker} onSelect={onSelect} />
    </aside>
  )
}
