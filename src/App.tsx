import { useMemo, useState } from 'react'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { PricingSection } from './components/PricingSection'
import { ScreenerFilters, type ScreenerFilterState } from './components/ScreenerFilters'
import { StockDetailPanel } from './components/StockDetailPanel'
import { StockTable } from './components/StockTable'
import { mockStocks } from './data/mockStocks'
import { passesScreener } from './lib/scoring'
import type { Stock } from './types'

const DEFAULT_FILTERS: ScreenerFilterState = {
  sector: 'Hepsi',
  minProScore: 0,
  minDividendYield: 0,
  onlyCheap: false,
}

function App() {
  const [filters, setFilters] = useState<ScreenerFilterState>(DEFAULT_FILTERS)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)

  const filteredStocks = useMemo(
    () => mockStocks.filter((stock) => passesScreener(stock, filters)),
    [filters],
  )

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />

      <section id="tarama" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Hisse Taraması</h2>
        <p className="mt-2 max-w-xl text-[var(--text-secondary)]">
          Sektör, kalite skoru ve temettü verimine göre filtreleyin; detay için bir
          şirkete tıklayın.
        </p>
        <div className="mt-6 space-y-4">
          <ScreenerFilters filters={filters} onChange={setFilters} />
          <p className="text-xs text-[var(--text-muted)]">
            {filteredStocks.length} / {mockStocks.length} şirket gösteriliyor
          </p>
          <StockTable stocks={filteredStocks} onSelect={setSelectedStock} />
        </div>
      </section>

      <PricingSection />
      <Footer />

      {selectedStock && (
        <StockDetailPanel stock={selectedStock} onClose={() => setSelectedStock(null)} />
      )}
    </div>
  )
}

export default App
