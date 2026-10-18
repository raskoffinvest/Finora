import type { ScoreTier } from '../types'

const TIER_STYLES: Record<ScoreTier, { className: string; icon: string }> = {
  good: { className: 'bg-[var(--status-good)]/10 text-[var(--status-good)]', icon: '▲' },
  warning: { className: 'bg-[var(--status-warning)]/15 text-[var(--status-warning-ink)]', icon: '●' },
  critical: { className: 'bg-[var(--status-critical)]/10 text-[var(--status-critical)]', icon: '▼' },
  none: { className: 'bg-black/[0.04] text-[var(--text-muted)]', icon: '' },
}

export function ScoreBadge({ tier, label }: { tier: ScoreTier; label: string }) {
  const style = TIER_STYLES[tier]
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}
    >
      {style.icon && <span aria-hidden="true">{style.icon}</span>}
      {label}
    </span>
  )
}
