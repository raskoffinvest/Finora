import { useMemo, useState } from 'react'
import { AiView } from './components/AiView'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { MarketView } from './components/MarketView'
import { PortfolioView } from './components/PortfolioView'
import { PricingSection } from './components/PricingSection'
import { RightRail } from './components/RightRail'
import { ScreenerFilters } from './components/ScreenerFilters'
import { Sidebar } from './components/Sidebar'
import { StockDetailPanel } from './components/StockDetailPanel'
import { StockTable } from './components/StockTable'
import { ValuationView } from './components/ValuationView'
import { passesScreener, type ScreenerFilterState } from './lib/scoring'
import { useFavorites } from './lib/useFavorites'
import { useHashRoute } from './lib/useHashRoute'
import { usePortfolio } from './lib/usePortfolio'
import { useMarketData, useStockData } from './lib/useStockData'
import type { Stock } from './types'

const DEFAULT_FILTERS: ScreenerFilterState = {
  query: '',
  sector: 'Hepsi',
  minQuality: 0,
  minDividendYield: 0,
  onlyCheap: false,
}

function LoadError({ message }: { message: string }) {
  return (
    <p className="rounded-lg bg-[var(--status-critical)]/10 p-3 text-sm text-[var(--status-critical)]">
      Veriler yüklenemedi ({message}). Önce <code>npm run data</code> ile veri dosyalarını oluşturun.
    </p>
  )
}

function App() {
  const route = useHashRoute()
  const stockData = useStockData()
  const marketData = useMarketData()
  const favorites = useFavorites()
  const portfolio = usePortfolio()
  const [filters, setFilters] = useState<ScreenerFilterState>(DEFAULT_FILTERS)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)

  const stocks = useMemo(() => (stockData.status === 'ready' ? stockData.data.stocks : []), [stockData])
  const stocksByTicker = useMemo(() => new Map(stocks.map((s) => [s.ticker, s])), [stocks])
  const sectors = useMemo(() => [...new Set(stocks.map((s) => s.sector))].sort((a, b) => a.localeCompare(b, 'tr')), [stocks])
  const filteredStocks = useMemo(() => stocks.filter((stock) => passesScreener(stock, filters)), [stocks, filters])
  const market = marketData.status === 'ready' ? marketData.data : null

  const loadError =
    stockData.status === 'error' ? stockData.message : marketData.status === 'error' ? marketData.message : null
  const loading = stockData.status === 'loading' || marketData.status === 'loading'

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar route={route} />

      <div className="min-w-0 flex-1">
        {route === 'abonelik' ? (
          <main>
            <Hero companyCount={stocks.length} />
            <PricingSection />
          </main>
        ) : (
          <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 xl:flex-row">
            <main className="min-w-0 flex-1">
              {loadError && <LoadError message={loadError} />}
              {loading && <p className="text-sm text-[var(--text-muted)]">Veriler yükleniyor…</p>}

              {route === 'piyasa' && market && stockData.status === 'ready' && (
                <MarketView market={market} stocks={stocks} onSelect={setSelectedStock} />
              )}

              {route === 'tarama' && stockData.status === 'ready' && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Hisse Tarama</h1>
                    <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
                      Borsa İstanbul şirketlerini sektör, Finora Skoru ve temettü verimine göre filtreleyin;
                      sütun başlıklarıyla sıralayın, detay için bir şirkete tıklayın.
                    </p>
                  </div>
                  <ScreenerFilters filters={filters} sectors={sectors} onChange={setFilters} />
                  <p className="text-xs text-[var(--text-muted)]">
                    {filteredStocks.length} / {stocks.length} şirket · Veri tarihi{' '}
                    {new Date(stockData.data.generatedAt).toLocaleString('tr-TR')} · Mali tablolar{' '}
                    {stockData.data.fiscalYears[0]} yıllık
                  </p>
                  <StockTable stocks={filteredStocks} favorites={favorites} onSelect={setSelectedStock} />
                </div>
              )}

              {route === 'gercek-deger' && stockData.status === 'ready' && (
                <ValuationView data={stockData.data} onSelect={setSelectedStock} />
              )}

              {route === 'yapay-zeka' && stockData.status === 'ready' && (
                <AiView data={stockData.data} onSelect={setSelectedStock} />
              )}

              {(route === 'portfoy' || route === 'portfoy-analizi') && stockData.status === 'ready' && (
                <PortfolioView
                  mode={route === 'portfoy' ? 'cuzdan' : 'analiz'}
                  portfolio={portfolio}
                  stocksByTicker={stocksByTicker}
                  benchmark={market?.benchmark ?? []}
                  onSelect={setSelectedStock}
                />
              )}
            </main>

            {stockData.status === 'ready' && (
              <RightRail
                index={market?.quotes.find((q) => q.symbol === 'XU100.IS')}
                favorites={favorites}
                stocksByTicker={stocksByTicker}
                onSelect={setSelectedStock}
              />
            )}
          </div>
        )}

        <Footer sources={stockData.status === 'ready' ? stockData.data.sources : []} />
      </div>

      {selectedStock && stockData.status === 'ready' && (
        <StockDetailPanel
          stock={selectedStock}
          fiscalYear={stockData.data.fiscalYears[0]}
          actions={market?.actions.filter((a) => a.ticker === selectedStock.ticker) ?? []}
          favorite={favorites.has(selectedStock.ticker)}
          onToggleFavorite={() => favorites.toggle(selectedStock.ticker)}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  )
}

export default App
