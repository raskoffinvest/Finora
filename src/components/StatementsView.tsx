import { useState } from 'react'
import type { FinancialItem, Stock, StockDataset } from '../types'
import { fmt } from '../lib/format'
import { Change, Panel, Tabs } from './ui'

type Row = { item: FinancialItem; label: string; level?: 'total' | 'sub' }

const STATEMENTS: { title: string; rows: Row[] }[] = [
  {
    title: 'Bilanço',
    rows: [
      { item: 'currentAssets', label: 'Dönen varlıklar' },
      { item: 'cash', label: 'Nakit ve nakit benzerleri', level: 'sub' },
      { item: 'receivables', label: 'Ticari alacaklar', level: 'sub' },
      { item: 'ppe', label: 'Maddi duran varlıklar' },
      { item: 'totalAssets', label: 'Toplam varlıklar', level: 'total' },
      { item: 'currentLiabilities', label: 'Kısa vadeli yükümlülükler' },
      { item: 'shortTermDebt', label: 'Finansal borçlar (KV)', level: 'sub' },
      { item: 'longTermLiabilities', label: 'Uzun vadeli yükümlülükler' },
      { item: 'longTermDebt', label: 'Finansal borçlar (UV)', level: 'sub' },
      { item: 'equity', label: 'Özkaynaklar', level: 'total' },
      { item: 'parentEquity', label: 'Ana ortaklığa ait özkaynaklar', level: 'sub' },
      { item: 'paidCapital', label: 'Ödenmiş sermaye', level: 'sub' },
    ],
  },
  {
    title: 'Gelir tablosu',
    rows: [
      { item: 'revenue', label: 'Satış gelirleri', level: 'total' },
      { item: 'cogs', label: 'Satışların maliyeti', level: 'sub' },
      { item: 'grossProfit', label: 'Brüt kâr' },
      { item: 'marketingExpense', label: 'Pazarlama, satış ve dağıtım giderleri', level: 'sub' },
      { item: 'adminExpense', label: 'Genel yönetim giderleri', level: 'sub' },
      { item: 'operatingProfit', label: 'Faaliyet kârı' },
      { item: 'netIncome', label: 'Dönem kârı', level: 'total' },
      { item: 'parentNetIncome', label: 'Ana ortaklık payı', level: 'sub' },
    ],
  },
  {
    title: 'Nakit akışı',
    rows: [
      { item: 'operatingCashFlow', label: 'İşletme faaliyetlerinden nakit', level: 'total' },
      { item: 'depreciation', label: 'Amortisman', level: 'sub' },
      { item: 'capex', label: 'Sabit sermaye yatırımları', level: 'sub' },
      { item: 'freeCashFlow', label: 'Serbest nakit akışı', level: 'total' },
      { item: 'dividendsPaid', label: 'Temettü ödemeleri', level: 'sub' },
      { item: 'capitalIncrease', label: 'Sermaye artırımı', level: 'sub' },
    ],
  },
]

type Currency = 'tl' | 'usd'

export function StatementsView({ data, onSelect }: { data: StockDataset; onSelect: (stock: Stock) => void }) {
  const [ticker, setTicker] = useState('THYAO')
  const [currency, setCurrency] = useState<Currency>('tl')
  const stock = data.stocks.find((s) => s.ticker === ticker)
  const f = stock?.financials
  const years = data.fiscalYears

  // Tutarlar milyon TL; dolar görünümünde her yıl kendi yıl sonu kuruyla çevrilir
  const value = (item: FinancialItem, i: number) => {
    const v = f?.[item]?.[i]
    if (v == null) return null
    if (currency === 'tl') return v / 1e6
    const fx = data.usdTryYearEnd[String(years[i])]
    return fx ? v / fx / 1e6 : null
  }
  const growth = (item: FinancialItem, i: number) => {
    const a = value(item, i)
    const b = value(item, i + 1)
    return a != null && b != null && b > 0 ? (a / b - 1) * 100 : null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bilançolar</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
          Son dört yılın özet bilanço, gelir tablosu ve nakit akışı. Enflasyon nedeniyle TL tutarlar yıllar arasında
          doğrudan karşılaştırılamaz; dolar görünümü her yılı kendi yıl sonu kuruyla çevirir.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-muted)]">Şirket</span>
          <input
            list="statement-tickers"
            defaultValue={ticker}
            onChange={(e) => {
              const t = e.target.value.toLocaleUpperCase('tr')
              if (data.stocks.some((s) => s.ticker === t)) setTicker(t)
            }}
            className="w-28 rounded-md border border-[var(--border-hairline)] px-2 py-1"
          />
          <datalist id="statement-tickers">
            {data.stocks.map((s) => (
              <option key={s.ticker} value={s.ticker}>
                {s.name}
              </option>
            ))}
          </datalist>
        </label>
        <Tabs
          label="Para birimi"
          value={currency}
          onChange={setCurrency}
          options={[
            { value: 'tl', label: 'Milyon ₺' },
            { value: 'usd', label: 'Milyon $' },
          ]}
        />
        {stock && (
          <button type="button" onClick={() => onSelect(stock)} className="text-sm text-[var(--brand)] hover:underline">
            {stock.ticker} · {stock.name} detayı
          </button>
        )}
      </div>

      {!f ? (
        <Panel>
          <p className="p-6 text-center text-sm text-[var(--text-muted)]">
            {stock?.statementGroup === 'financial'
              ? 'Banka ve finans şirketlerinin tabloları farklı formatta (UFRS) ve bu ekranda henüz gösterilmiyor.'
              : 'Bu şirket için mali tablo bulunamadı.'}
          </p>
        </Panel>
      ) : (
        STATEMENTS.map((st) => (
          <Panel key={st.title} title={st.title}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-[var(--text-muted)]">
                  <tr className="border-b border-[var(--gridline)]">
                    <th className="px-4 py-2 text-left font-medium">Kalem</th>
                    {years.map((y) => (
                      <th key={y} className="px-3 py-2 text-right font-medium">
                        {y}/12
                      </th>
                    ))}
                    <th className="px-4 py-2 text-right font-medium">Yıllık değişim</th>
                  </tr>
                </thead>
                <tbody>
                  {st.rows.map((row) => (
                    <tr key={row.item} className="border-b border-[var(--gridline)] last:border-0">
                      <td
                        className={`px-4 py-1.5 ${
                          row.level === 'total' ? 'font-semibold' : row.level === 'sub' ? 'pl-8 text-[var(--text-secondary)]' : ''
                        }`}
                      >
                        {row.label}
                      </td>
                      {years.map((y, i) => (
                        <td key={y} className={`px-3 py-1.5 text-right tabular-nums ${row.level === 'total' ? 'font-semibold' : ''}`}>
                          {fmt(value(row.item, i), 0)}
                        </td>
                      ))}
                      <td className="px-4 py-1.5 text-right">
                        <Change value={growth(row.item, 0)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ))
      )}

      <p className="text-xs text-[var(--text-muted)]">
        Kaynak: İş Yatırım mali tabloları (sanayi şirketleri, XI_29 formatı). Her yıl, o yılın yıl sonu raporundaki
        değerlerle gösterilir; enflasyon düzeltmeli yeniden düzenlemeler yansımamış olabilir.
      </p>
    </div>
  )
}
