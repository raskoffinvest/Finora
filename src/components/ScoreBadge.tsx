import type { ScoreTier } from '../types'

const TIER_STYLES: Record<ScoreTier, { bg: string; fg: string; icon: string }> = {
  good: { bg: 'bg-[#0ca30c]/10', fg: 'text-[#0ca30c]', icon: '▲' },
  warning: { bg: 'bg-[#fab219]/15', fg: 'text-[#9a6a00]', icon: '●' },
  critical: { bg: 'bg-[#d03b3b]/10', fg: 'text-[#d03b3b]', icon: '▼' },
}

export function ScoreBadge({ tier, label }: { tier: ScoreTier; label: string }) {
  const style = TIER_STYLES[tier]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.fg}`}
    >
      <span aria-hidden="true">{style.icon}</span>
      {label}
    </span>
  )
}
