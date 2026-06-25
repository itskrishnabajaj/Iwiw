import type { Skill, XPEvent } from './types'

// Level curve: cumulative XP needed grows quadratically.
// XP for a given level L (to reach it) = 50 * L^2 + 50 * L
export function xpForLevel(level: number): number {
  return 50 * level * level + 50 * level
}

export function levelFromXP(xp: number): {
  level: number
  into: number
  needed: number
  pct: number
} {
  let level = 0
  while (xpForLevel(level + 1) <= xp) level++
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  const into = xp - floor
  const needed = ceil - floor
  return { level, into, needed, pct: Math.round((into / needed) * 100) }
}

export function totalXP(events: XPEvent[]): number {
  return events.reduce((s, e) => s + e.amount, 0)
}

export function skillLevel(skill: Skill) {
  return levelFromXP(skill.xp)
}

export const TITLES: { min: number; title: string }[] = [
  { min: 0, title: 'Initiate' },
  { min: 5, title: 'Apprentice' },
  { min: 10, title: 'Operator' },
  { min: 18, title: 'Strategist' },
  { min: 28, title: 'Architect' },
  { min: 40, title: 'Visionary' },
  { min: 55, title: 'Luminary' },
]

export function titleForLevel(level: number): string {
  let t = TITLES[0].title
  for (const x of TITLES) if (level >= x.min) t = x.title
  return t
}

// Prestige ranks layered on top of levels — a longer progression arc.
export interface Rank {
  min: number
  name: string
  color: string
  icon: string
}
export const RANKS: Rank[] = [
  { min: 0, name: 'Bronze', color: '#c08457', icon: '🥉' },
  { min: 8, name: 'Silver', color: '#c9d1d9', icon: '🥈' },
  { min: 16, name: 'Gold', color: '#f5c451', icon: '🥇' },
  { min: 26, name: 'Platinum', color: '#7c5cff', icon: '💎' },
  { min: 38, name: 'Diamond', color: '#36e6e0', icon: '🔷' },
  { min: 52, name: 'Legend', color: '#f472b6', icon: '👑' },
]

export function rankForLevel(level: number): { rank: Rank; next: Rank | null; pct: number } {
  let idx = 0
  for (let i = 0; i < RANKS.length; i++) if (level >= RANKS[i].min) idx = i
  const rank = RANKS[idx]
  const next = RANKS[idx + 1] ?? null
  const pct = next ? Math.round(((level - rank.min) / (next.min - rank.min)) * 100) : 100
  return { rank, next, pct }
}
