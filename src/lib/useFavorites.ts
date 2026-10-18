import { useCallback, useState } from 'react'

const KEY = 'finora:favorites'
export const MAX_FAVORITES = 20

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Gizli pencere vb. durumlarda favoriler yalnızca bu oturumda tutulur
  }
}

export interface Favorites {
  list: string[]
  has: (ticker: string) => boolean
  toggle: (ticker: string) => void
}

export function useFavorites(): Favorites {
  const [list, setList] = useState<string[]>(read)

  const toggle = useCallback((ticker: string) => {
    setList((prev) => {
      const next = prev.includes(ticker)
        ? prev.filter((t) => t !== ticker)
        : prev.length >= MAX_FAVORITES
          ? prev
          : [...prev, ticker]
      write(next)
      return next
    })
  }, [])

  return { list, has: (ticker) => list.includes(ticker), toggle }
}
