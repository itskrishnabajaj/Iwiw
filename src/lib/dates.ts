import {
  differenceInCalendarDays,
  differenceInYears,
  format,
  parseISO,
  subDays,
  startOfWeek,
  addDays,
} from 'date-fns'
import type { ISODate } from './types'

export const todayISO = (): ISODate => format(new Date(), 'yyyy-MM-dd')

export const iso = (d: Date): ISODate => format(d, 'yyyy-MM-dd')

export const fromISO = (d: ISODate): Date => parseISO(d)

export function countdown(target: ISODate) {
  const days = differenceInCalendarDays(parseISO(target), new Date())
  return { days: Math.max(0, days), past: days < 0 }
}

export function ageFrom(birth: ISODate): { years: number; precise: string } {
  const b = parseISO(birth)
  const years = differenceInYears(new Date(), b)
  const ms = Date.now() - b.getTime()
  const decimal = (ms / (365.25 * 24 * 3600 * 1000)).toFixed(4)
  return { years, precise: decimal }
}

export function lastNDates(n: number, end = new Date()): ISODate[] {
  return Array.from({ length: n }, (_, i) => iso(subDays(end, n - 1 - i)))
}

export function weekDates(d = new Date()): ISODate[] {
  const start = startOfWeek(d, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => iso(addDays(start, i)))
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Burning the midnight oil'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

export function prettyDate(d: ISODate | Date = new Date()): string {
  const date = typeof d === 'string' ? parseISO(d) : d
  return format(date, 'EEEE, MMMM d')
}

export function monthGrid(year: number, month: number): (ISODate | null)[] {
  const first = new Date(year, month, 1)
  const startDay = (first.getDay() + 6) % 7 // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (ISODate | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(iso(new Date(year, month, d)))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
