import type { AppData, AreaKey } from '@/lib/types'
import { levelFromXP, totalXP } from '@/lib/xp'
import { lastNDates, todayISO } from '@/lib/dates'
import { currentStreak } from '@/lib/streaks'

export const AREA_META: Record<AreaKey, { label: string; color: string; emoji: string; route: string }> = {
  mba: { label: 'MBA Prep', color: '#7c5cff', emoji: '🎯', route: '/mba' },
  qr: { label: 'QuantReflex', color: '#36e6e0', emoji: '⚡', route: '/quantreflex' },
  crm: { label: 'Outreach CRM', color: '#fb923c', emoji: '🤝', route: '/crm' },
  learn: { label: 'Learning', color: '#60a5fa', emoji: '📚', route: '/learning' },
  gym: { label: 'Gym', color: '#34d399', emoji: '💪', route: '/gym' },
  finance: { label: 'Finance', color: '#fbbf24', emoji: '💰', route: '/finance' },
  personal: { label: 'Personal', color: '#f472b6', emoji: '🌱', route: '/personal' },
}

export function getLevel(s: AppData) {
  return levelFromXP(totalXP(s.xpEvents))
}

export function todaysTasks(s: AppData) {
  const today = todayISO()
  return s.tasks.filter((t) => t.date === today)
}

export function todayProgress(s: AppData) {
  const tasks = todaysTasks(s)
  const done = tasks.filter((t) => t.done).length
  return { done, total: tasks.length, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 }
}

export function studyStreak(s: AppData): number {
  const log: Record<string, boolean> = {}
  for (const l of s.mba.studyLogs) if (l.hours > 0) log[l.date] = true
  return currentStreak(log)
}

// Combined daily activity (XP per day) for the contribution heatmap
export function activityHeatmap(s: AppData, days = 119): { date: string; value: number }[] {
  const dates = lastNDates(days)
  const map = new Map<string, number>()
  for (const d of dates) map.set(d, 0)
  for (const e of s.xpEvents) {
    const d = new Date(e.ts).toISOString().slice(0, 10)
    if (map.has(d)) map.set(d, (map.get(d) || 0) + e.amount)
  }
  return dates.map((date) => ({ date, value: map.get(date) || 0 }))
}

export function todayFocusScore(s: AppData): number {
  const today = todayISO()
  const log = s.mba.studyLogs.find((l) => l.date === today)
  const tp = todayProgress(s)
  const fromStudy = log?.focusScore ?? 0
  return Math.round(fromStudy * 0.5 + tp.pct * 0.5)
}

export function predictedPercentile(s: AppData): number {
  const recent = [...s.mba.mocks].slice(-3)
  if (!recent.length) return 0
  const avg = recent.reduce((a, m) => a + m.percentile, 0) / recent.length
  // small optimistic trend bump
  const trend = recent.length > 1 ? recent[recent.length - 1].percentile - recent[0].percentile : 0
  return Math.min(99.9, +(avg + Math.max(0, trend) * 0.3).toFixed(1))
}

export function lifeBalance(s: AppData): { area: AreaKey; value: number }[] {
  const cutoff = Date.now() - 14 * 86400000
  const totals: Record<string, number> = {}
  for (const e of s.xpEvents) if (e.ts >= cutoff) totals[e.area] = (totals[e.area] || 0) + e.amount
  const areas: AreaKey[] = ['mba', 'qr', 'crm', 'learn', 'gym', 'finance', 'personal']
  const max = Math.max(1, ...areas.map((a) => totals[a] || 0))
  return areas.map((area) => ({ area, value: Math.round(((totals[area] || 0) / max) * 100) }))
}

export function weeklyXP(s: AppData): number {
  const cutoff = Date.now() - 7 * 86400000
  return s.xpEvents.filter((e) => e.ts >= cutoff).reduce((a, e) => a + e.amount, 0)
}

export function runwayMonths(s: AppData): number {
  return Math.round(s.finance.savings / Math.max(1, s.finance.monthlyBurn))
}
