import { useEffect, useState } from 'react'

export const ROUTES = ['piyasa', 'tarama', 'gercek-deger', 'yapay-zeka', 'portfoy', 'portfoy-analizi', 'abonelik'] as const
export type Route = (typeof ROUTES)[number]

const parse = (): Route => {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return (ROUTES as readonly string[]).includes(hash) ? (hash as Route) : 'piyasa'
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(parse)
  useEffect(() => {
    const onChange = () => {
      setRoute(parse())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
