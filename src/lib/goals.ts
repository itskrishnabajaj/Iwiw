import type { Goal } from './types'

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

// Progress for a single leaf goal — guards against divide-by-zero and undefined.
export function leafProgress(goal: Goal): number {
  if (goal.target && goal.target > 0) {
    return clamp(((goal.current ?? 0) / goal.target) * 100)
  }
  return clamp(goal.progress ?? 0)
}

// Progress for any goal, rolling up the average of its children when present.
export function goalProgress(goal: Goal, all: Goal[]): number {
  const children = all.filter((g) => g.parentId === goal.id)
  if (children.length === 0) return leafProgress(goal)
  return clamp(children.reduce((sum, c) => sum + goalProgress(c, all), 0) / children.length)
}
