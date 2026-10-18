import type { Sector } from '../types'

export interface ScreenerFilterState {
  sector: Sector | 'Hepsi'
  minProScore: number
  minDividendYield: number
  onlyCheap: boolean
}

const SECTORS: (Sector | 'Hepsi')[] = ['Hepsi', 'Banka', 'Sigorta', 'GYO', 'Teknoloji', 'Otomotiv', 'Sanayi']

export function ScreenerFilters({
  filters,
  onChange,
}: {
  filters: ScreenerFilterState
  onChange: (next: ScreenerFilterState) => void
}) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-1)] p-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--text-muted)]">Sektör</span>
        <select
          value={filters.sector}
          onChange={(e) => onChange({ ...filters, sector: e.target.value as Sector | 'Hepsi' })}
          className="rounded-md border border-[var(--border-hairline)] px-2 py-1.5"
        >
          {SECTORS.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--text-muted)]">Min. ProScore: {filters.minProScore}</span>
        <input
          type="range"
          min={0}
          max={10}
          value={filters.minProScore}
          onChange={(e) => onChange({ ...filters, minProScore: Number(e.target.value) })}
          className="w-36"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--text-muted)]">Min. Temettü Verimi: %{filters.minDividendYield}</span>
        <input
          type="range"
          min={0}
          max={8}
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
        <span>Sadece ucuz (Fiyat Skoru ≥ 70)</span>
      </label>
    </div>
  )
}
