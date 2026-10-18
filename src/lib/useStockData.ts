import { useEffect, useState } from 'react'
import type { MarketDataset, StockDataset } from '../types'

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T }

function useJson<T>(file: string): LoadState<T> {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}data/${file}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<T>
      })
      .then((data) => !cancelled && setState({ status: 'ready', data }))
      .catch((err: Error) => !cancelled && setState({ status: 'error', message: err.message }))
    return () => {
      cancelled = true
    }
  }, [file])

  return state
}

export const useStockData = () => useJson<StockDataset>('stocks.json')
export const useMarketData = () => useJson<MarketDataset>('market.json')
