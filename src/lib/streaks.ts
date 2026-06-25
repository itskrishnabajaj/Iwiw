import { subDays } from 'date-fns'
import { iso } from './dates'
import type { ISODate } from './types'

// Current streak: consecutive days up to today (or yesterday) that are true.
export function currentStreak(log: Record<ISODate, boolean>): number {
  let streak = 0
  let day = new Date()
  // allow today to be incomplete without breaking streak
  if (!log[iso(day)]) day = subDays(day, 1)
  while (log[iso(day)]) {
    streak++
    day = subDays(day, 1)
  }
  return streak
}

export function bestStreak(log: Record<ISODate, boolean>): number {
  const days = Object.keys(log)
    .filter((d) => log[d])
    .sort()
  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const d of days) {
    const cur = new Date(d)
    if (prev && (cur.getTime() - prev.getTime()) / 86400000 === 1) run++
    else run = 1
    best = Math.max(best, run)
    prev = cur
  }
  return best
}

export function successRate(log: Record<ISODate, boolean>, createdAt: ISODate): number {
  const start = new Date(createdAt).getTime()
  const days = Math.max(1, Math.round((Date.now() - start) / 86400000) + 1)
  const hits = Object.values(log).filter(Boolean).length
  return Math.min(100, Math.round((hits / days) * 100))
}

export function consistencyScore(log: Record<ISODate, boolean>): number {
  // weighted: recent 30 days count more
  let score = 0
  let weightTotal = 0
  for (let i = 0; i < 30; i++) {
    const d = iso(subDays(new Date(), i))
    const w = 30 - i
    weightTotal += w
    if (log[d]) score += w
  }
  return Math.round((score / weightTotal) * 100)
}
