import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DividendYear } from '../types'

const inkTooltip = {
  backgroundColor: 'var(--surface-1)',
  border: '1px solid var(--border-hairline)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--text-primary)',
}

export function DividendChart({ data }: { data: DividendYear[] }) {
  return (
    <div className="viz-root">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--gridline)" />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={{ stroke: 'var(--baseline)' }}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          />
          <YAxis
            yAxisId="tl"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            width={36}
          />
          <Tooltip contentStyle={inkTooltip} cursor={{ fill: 'rgba(11,11,11,0.03)' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            yAxisId="tl"
            dataKey="tl"
            name="Toplam Temettü (TL/hisse)"
            fill="var(--series-tl)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--gridline)" />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={{ stroke: 'var(--baseline)' }}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          />
          <YAxis
            yAxisId="usd"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            width={36}
          />
          <Tooltip contentStyle={inkTooltip} cursor={{ fill: 'rgba(11,11,11,0.03)' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            yAxisId="usd"
            dataKey="usd"
            name="Toplam Temettü ($/hisse)"
            fill="var(--series-usd)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
