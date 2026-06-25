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
