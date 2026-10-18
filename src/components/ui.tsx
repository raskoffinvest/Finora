import type { ReactNode } from 'react'

export function Panel({
  title,
  actions,
  children,
  className = '',
}: {
  title?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-1)] ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--gridline)] px-4 py-3">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}

export function Tabs<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 rounded-lg bg-black/[0.04] p-0.5 text-xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-2.5 py-1 font-medium ${
            value === opt.value
              ? 'bg-[var(--surface-1)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function Change({ value, className = '' }: { value: number | null | undefined; className?: string }) {
  if (value == null) return <span className={`text-[var(--text-muted)] ${className}`}>—</span>
  const up = value >= 0
  const text = `${up ? '+' : '-'}%${Math.abs(value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return (
    <span className={`whitespace-nowrap tabular-nums ${up ? 'text-[var(--status-good)]' : 'text-[var(--status-critical)]'} ${className}`}>
      {text}
    </span>
  )
}

export function Sparkline({ values, width = 96, height = 28 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values
    .map((v, i) => `${((i / (values.length - 1)) * width).toFixed(1)},${(height - ((v - min) / span) * height).toFixed(1)}`)
    .join(' ')
  const up = values.at(-1)! >= values[0]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        strokeWidth={1.5}
        stroke={up ? 'var(--status-good)' : 'var(--status-critical)'}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function StarButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`text-base leading-none ${active ? 'text-[var(--status-warning)]' : 'text-[var(--baseline)] hover:text-[var(--text-secondary)]'}`}
    >
      {active ? '★' : '☆'}
    </button>
  )
}
