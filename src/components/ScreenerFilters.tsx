import type { ScreenerFilterState } from '../lib/scoring'

export function ScreenerFilters({
  filters,
  sectors,
  onChange,
}: {
  filters: ScreenerFilterState
  sectors: string[]
  onChange: (next: ScreenerFilterState) => void
}) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-1)] p-4">
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
        <span className="text-[var(--text-muted)]">Şirket ara</span>
        <input
          type="search"
          value={filters.query}
          placeholder="Kod veya şirket adı"
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          className="rounded-md border border-[var(--border-hairline)] px-2 py-1.5"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--text-muted)]">Sektör</span>
        <select
          value={filters.sector}
          onChange={(e) => onChange({ ...filters, sector: e.target.value })}
          className="max-w-56 rounded-md border border-[var(--border-hairline)] px-2 py-1.5"
        >
          {['Hepsi', ...sectors].map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--text-muted)]">Min. Finora Skoru: {filters.minQuality}</span>
        <input
          type="range"
          min={0}
          max={10}
          value={filters.minQuality}
          onChange={(e) => onChange({ ...filters, minQuality: Number(e.target.value) })}
          className="w-36"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--text-muted)]">Min. Temettü Verimi: %{filters.minDividendYield}</span>
        <input
          type="range"
          min={0}
          max={12}
          step={0.5}
          value={filters.minDividendYield}
          onChange={(e) => onChange({ ...filters, minDividendYield: Number(e.target.value) })}
          className="w-36"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.onlyCheap}
          onChange={(e) => onChange({ ...filters, onlyCheap: e.target.checked })}
        />
        <span>Sadece sektörüne göre ucuz (Değerleme ≥ 70)</span>
      </label>
    </div>
  )
}
