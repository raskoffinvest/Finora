import type { Ipo } from '../types'

export const istanbulToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' })

export type IpoStatus = 'aktif' | 'gerceklesen' | 'ertelendi'

export function ipoStatus(ipo: Ipo, now = istanbulToday()): IpoStatus {
  if (/ertelen/i.test(ipo.subscriptionText ?? '')) return 'ertelendi'
  if (ipo.firstTradeDate && ipo.firstTradeDate <= now) return 'gerceklesen'
  return 'aktif' // talep toplama sürüyor ya da işlem başlangıcı bekleniyor
}
