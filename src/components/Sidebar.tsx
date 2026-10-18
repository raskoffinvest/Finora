import type { Route } from '../lib/useHashRoute'

const NAV: { route: Route; label: string; icon: string; pro?: boolean }[] = [
  { route: 'piyasa', label: 'Piyasa', icon: '◔' },
  { route: 'tarama', label: 'Hisse Tarama', icon: '⧩' },
  { route: 'gercek-deger', label: 'Gerçek Değer', icon: '≈', pro: true },
  { route: 'portfoy', label: 'Portföy Cüzdan', icon: '▤', pro: true },
  { route: 'portfoy-analizi', label: 'Portföy Analizi', icon: '◑', pro: true },
  { route: 'abonelik', label: 'Abonelik', icon: '✦' },
]

export function Sidebar({ route }: { route: Route }) {
  return (
    <aside className="border-b border-[var(--border-hairline)] bg-[var(--surface-1)] lg:sticky lg:top-0 lg:h-screen lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-4 px-4 py-3 lg:flex-col lg:items-stretch lg:gap-6 lg:py-5">
        <a href="#/piyasa" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] font-bold text-white">
            F
          </span>
          <span className="text-lg font-semibold tracking-tight">Finora</span>
        </a>
        <nav aria-label="Ana menü" className="flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.map((item) => {
            const active = item.route === route
            return (
              <a
                key={item.route}
                href={`#/${item.route}`}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  active
                    ? 'bg-[var(--brand)]/10 font-medium text-[var(--brand-ink)]'
                    : 'text-[var(--text-secondary)] hover:bg-black/[0.03] hover:text-[var(--text-primary)]'
                }`}
              >
                <span aria-hidden="true" className="w-4 text-center">
                  {item.icon}
                </span>
                {item.label}
                {item.pro && (
                  <span className="ml-auto rounded bg-[var(--brand)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand-ink)]">
                    PRO
                  </span>
                )}
              </a>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
