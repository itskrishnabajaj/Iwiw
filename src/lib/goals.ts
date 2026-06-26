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
// `visited` guards against a malformed parentId cycle causing infinite recursion.
export function goalProgress(goal: Goal, all: Goal[], visited: Set<string> = new Set()): number {
  if (visited.has(goal.id)) return leafProgress(goal)
  visited.add(goal.id)
  const children = all.filter((g) => g.parentId === goal.id && !g.archived)
  if (children.length === 0) return leafProgress(goal)
  return clamp(children.reduce((sum, c) => sum + goalProgress(c, all, visited), 0) / children.length)
}
