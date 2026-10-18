import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PricePoint } from '../types'
import { fmt } from '../lib/format'

const inkTooltip = {
  backgroundColor: 'var(--surface-1)',
  border: '1px solid var(--border-hairline)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--text-primary)',
}

const monthLabel = (t: number) => new Date(t * 1000).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })

export function PriceChart({
  data,
  support,
  resistance,
}: {
  data: PricePoint[]
  support?: number | null
  resistance?: number | null
}) {
  return (
    <div className="viz-root">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="t"
            tickFormatter={monthLabel}
            tickLine={false}
            axisLine={{ stroke: 'var(--baseline)' }}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            minTickGap={32}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            width={44}
          />
          <Tooltip
            contentStyle={inkTooltip}
            labelFormatter={(t) => new Date(Number(t) * 1000).toLocaleDateString('tr-TR')}
            formatter={(v) => [`${fmt(Number(v))} ₺`, 'Kapanış']}
          />
          {support != null && (
            <ReferenceLine y={support} stroke="var(--status-good)" strokeDasharray="4 4" label={{ value: 'Destek', fontSize: 11, fill: 'var(--status-good)', position: 'insideBottomLeft' }} />
          )}
          {resistance != null && (
            <ReferenceLine y={resistance} stroke="var(--status-critical)" strokeDasharray="4 4" label={{ value: 'Direnç', fontSize: 11, fill: 'var(--status-critical)', position: 'insideTopRight' }} />
          )}
          <Line type="monotone" dataKey="close" stroke="var(--series-tl)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
