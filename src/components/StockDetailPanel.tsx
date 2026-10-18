import { useEffect } from 'react'
import type { CorporateAction, Stock } from '../types'
import { fmt, fmtBigTl, fmtPct, fmtTl } from '../lib/format'
import { fScoreTier, mScoreTier, qualityTier, valuationLabel, valuationTier, zScoreTier } from '../lib/scoring'
import { stockPayload } from '../lib/ai'
import { AiCommentary } from './AiCommentary'
import { DividendChart } from './DividendChart'
import { PriceChart } from './PriceChart'
import { ScoreBadge } from './ScoreBadge'
import { StarButton } from './ui'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="text-sm font-medium text-[var(--text-secondary)]">{title}</h3>
      {note && <p className="mb-2 text-xs text-[var(--text-muted)]">{note}</p>}
      {children}
    </section>
  )
}

export function StockDetailPanel({
  stock,
  fiscalYear,
  actions,
  favorite,
  onToggleFavorite,
  onClose,
}: {
  stock: Stock
  fiscalYear: number
  actions: CorporateAction[]
  favorite: boolean
  onToggleFavorite: () => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const r = stock.ratios
  const isFinancial = stock.statementGroup !== 'industrial'
  const grahamGap =
    stock.grahamValue != null && stock.price ? (stock.grahamValue / stock.price - 1) * 100 : null

  return (
    <div className="fixed inset-0 z-20 flex justify-end bg-black/30" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-detail-title"
        className="h-full w-full max-w-xl overflow-y-auto bg-[var(--surface-1)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="stock-detail-title" className="flex items-center gap-2 text-xl font-semibold">
              <StarButton
                active={favorite}
                onClick={onToggleFavorite}
                label={favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
              />
              {stock.ticker} <span className="font-normal text-[var(--text-secondary)]">{stock.name}</span>
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {stock.sector} · Son dönem {stock.lastPeriod ?? '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="rounded-md border border-[var(--border-hairline)] px-2 py-1 text-sm text-[var(--text-secondary)] hover:bg-black/[0.03]"
          >
            Kapat
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <ScoreBadge
            tier={valuationTier(stock.valuationScore)}
            label={`Değerleme: ${valuationLabel(stock.valuationScore)}${stock.valuationScore != null ? ` (${stock.valuationScore})` : ''}`}
          />
          <ScoreBadge tier={qualityTier(stock.qualityScore)} label={`Finora Skoru: ${fmt(stock.qualityScore, 1)}/10`} />
          <ScoreBadge tier={fScoreTier(stock.fScore)} label={`F-Score: ${stock.fScore ?? '—'}/9`} />
          <ScoreBadge tier={zScoreTier(stock.zScore)} label={`Z-Score: ${fmt(stock.zScore, 2)}`} />
          <ScoreBadge tier={mScoreTier(stock.mScore)} label={`M-Score: ${fmt(stock.mScore, 2)}`} />
        </div>
        {isFinancial && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Banka ve finans şirketlerinde F-Score, Z-Score ve M-Score anlamlı olmadığı için hesaplanmaz.
          </p>
        )}

        <Section title="Yapay zekâ yorumu">
          <AiCommentary
            key={stock.ticker}
            kind="stock"
            payload={stockPayload(stock, fiscalYear)}
            cta="Gemini ile yorum oluştur"
          />
        </Section>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Field label="Fiyat" value={fmtTl(stock.price)} />
          <Field label="Piyasa Değeri" value={stock.marketCapMnTl == null ? '—' : fmtBigTl(stock.marketCapMnTl * 1e6)} />
          <Field label="Halka Açıklık" value={fmtPct(stock.freeFloatPct)} />
          <Field label="F/K" value={fmt(stock.pe, 1)} />
          <Field label="PD/DD" value={fmt(stock.pb, 1)} />
          <Field label="FD/FAVÖK" value={fmt(stock.evEbitda, 1)} />
          <Field label="FD/Satış" value={fmt(stock.evSales, 1)} />
          <Field label="Temettü Verimi (12 ay)" value={fmtPct(stock.dividendYieldPct)} />
          <Field label="Yıl İçi Getiri" value={fmtPct(stock.returnYtd)} />
        </dl>

        {stock.priceHistory && stock.priceHistory.length > 1 && (
          <Section title="Fiyat — son 52 hafta" note="Haftalık kapanışlar; kesikli çizgiler otomatik destek ve direnç seviyeleridir.">
            <PriceChart data={stock.priceHistory} support={stock.supportLevel} resistance={stock.resistanceLevel} />
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Field label="Destek" value={fmtTl(stock.supportLevel)} />
              <Field label="Direnç" value={fmtTl(stock.resistanceLevel)} />
              <Field label="52H En Düşük" value={fmtTl(stock.low52w)} />
              <Field label="52H En Yüksek" value={fmtTl(stock.high52w)} />
            </dl>
          </Section>
        )}

        {r && (
          <Section title={`Kârlılık, büyüme ve borçluluk — ${fiscalYear} yıllık`}>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="Özsermaye Kârlılığı" value={fmtPct(r.roe)} />
              <Field label="Aktif Kârlılık" value={fmtPct(r.roa)} />
              <Field label="Brüt Marj" value={fmtPct(r.grossMargin)} />
              <Field label="Faaliyet Marjı" value={fmtPct(r.operatingMargin)} />
              <Field label="Net Marj" value={fmtPct(r.netMargin)} />
              <Field label="Satış Büyümesi" value={fmtPct(r.revenueGrowth)} />
              <Field label="Net Kâr Büyümesi" value={fmtPct(r.netIncomeGrowth)} />
              <Field label="Cari Oran" value={fmt(r.currentRatio)} />
              <Field label="Finansal Borç / Özkaynak" value={fmt(r.debtToEquity)} />
              <Field label="Net Borç" value={fmtBigTl(r.netDebt)} />
              <Field label="Serbest Nakit Akışı" value={fmtBigTl(r.freeCashFlow)} />
            </dl>
          </Section>
        )}

        {stock.grahamValue != null && (
          <Section title="Gerçek değer — Graham modeli" note="√(22,5 × hisse başı kâr × hisse başı defter değeri). Tek başına alım-satım sinyali değildir.">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Graham Değeri" value={fmtTl(stock.grahamValue)} />
              <Field label="Fiyata Göre Fark" value={grahamGap == null ? '—' : `${grahamGap >= 0 ? '+' : ''}${fmtPct(grahamGap, 0)}`} />
            </dl>
          </Section>
        )}

        {stock.dividendHistory && stock.dividendHistory.length > 0 && (
          <Section title="Temettü geçmişi" note="Hisse başına yıllık toplam brüt temettü; dolar karşılığı ödeme tarihindeki kurla hesaplanır.">
            <DividendChart data={stock.dividendHistory} />
          </Section>
        )}

        {actions.length > 0 && (
          <Section title={`Şirket olayları — ${actions[0].date.slice(0, 4)}`}>
            <ul className="divide-y divide-[var(--gridline)] text-sm">
              {actions.map((a, i) => (
                <li key={`${a.date}-${a.type}-${i}`} className="flex justify-between gap-4 py-2">
                  <span>
                    {new Date(`${a.date}T00:00:00`).toLocaleDateString('tr-TR')} ·{' '}
                    {a.type === 'temettu' ? 'Nakit temettü' : a.type === 'bedelli' ? 'Bedelli artırım' : 'Bedelsiz artırım'}
                  </span>
                  <span className="tabular-nums">
                    {a.type === 'temettu' ? `${fmt(a.perShare, 4)} ₺/hisse` : `%${fmt(a.ratioPct)}`}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <p className="mt-8 rounded-lg bg-black/[0.03] p-3 text-xs text-[var(--text-muted)]">
          Veriler halka açık kaynaklardan otomatik derlenir ve gecikmeli olabilir. Skorlar Finora'nın açık
          formülleriyle hesaplanır. Yatırım tavsiyesi niteliği taşımaz.
        </p>
      </div>
    </div>
  )
}
