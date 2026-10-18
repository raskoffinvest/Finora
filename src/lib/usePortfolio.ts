import { useCallback, useState } from 'react'

export interface Position {
  id: string
  ticker: string
  quantity: number
  cost: number // hisse başı ortalama maliyet, ₺
}

const KEY = 'finora:portfolio'

function read(): Position[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p): p is Position =>
        typeof p?.id === 'string' && typeof p?.ticker === 'string' && Number.isFinite(p?.quantity) && Number.isFinite(p?.cost),
    )
  } catch {
    return []
  }
}

function write(list: Position[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // depolama yoksa portföy yalnızca bu oturumda tutulur
  }
}

export interface Portfolio {
  positions: Position[]
  add: (p: Omit<Position, 'id'>) => void
  update: (id: string, patch: Partial<Omit<Position, 'id'>>) => void
  remove: (id: string) => void
}

export function usePortfolio(): Portfolio {
  const [positions, setPositions] = useState<Position[]>(read)

  const mutate = useCallback((fn: (prev: Position[]) => Position[]) => {
    setPositions((prev) => {
      const next = fn(prev)
      write(next)
      return next
    })
  }, [])

  return {
    positions,
    add: (p) => mutate((prev) => [...prev, { ...p, id: crypto.randomUUID() }]),
    update: (id, patch) => mutate((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    remove: (id) => mutate((prev) => prev.filter((p) => p.id !== id)),
  }
}
