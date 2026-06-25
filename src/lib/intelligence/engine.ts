import type { AppData } from '@/lib/types'
import { AREA_META } from '@/store/selectors'
import { buildContext, productivityScore } from './context'
import { registerRules, getRules } from './registry'
import { studyRules } from './rules/study'
import { wellbeingRules } from './rules/wellbeing'
import { productivityRules } from './rules/productivity'
import { reviewRules } from './rules/reviews'
import type { Insight, InsightKind, IntelCtx } from './types'

// Register the built-in rule families once at module load.
registerRules(...studyRules, ...wellbeingRules, ...productivityRules, ...reviewRules)

export { registerRules } from './registry'
export { productivityScore }
export type { Insight, InsightKind, IntelCtx } from './types'

// Run every rule against a single derived context, returning ranked insights.
export function runRules(s: AppData, kinds?: InsightKind[]): Insight[] {
  const ctx = buildContext(s)
  const out: Insight[] = []
  for (const rule of getRules()) {
    if (kinds && !rule.kinds.some((k) => kinds.includes(k))) continue
    try {
      const insight = rule.run(ctx)
      if (insight && (!kinds || kinds.includes(insight.kind))) out.push(insight)
    } catch {
      /* a misbehaving rule must never break the engine */
    }
  }
  return out.sort((a, b) => b.score - a.score)
}

// Back-compat shim: the old API returned exactly one insight for a kind.
export function generateInsight(kind: InsightKind, s: AppData): Insight {
  const matches = runRules(s, [kind])
  if (matches.length) return matches[0]
  return {
    id: `empty-${kind}`,
    kind,
    title: 'All clear',
    body: 'Nothing needs your attention here right now — keep the momentum going.',
    tone: 'good',
    score: 0,
    why: [],
  }
}

// The single most important thing to act on right now.
export function topPriority(s: AppData): Insight | null {
  const all = runRules(s, ['streak-risk', 'next-action', 'suggestion', 'daily', 'burnout'])
  return all[0] ?? null
}

export interface MissionItem {
  id: string
  label: string
  icon: string
  to: string
  done: boolean
}

// Generate "today's mission" — a deterministic shortlist of the day's key moves,
// drawn from real tasks, goals, outreach and gym data.
export function dailyMission(s: AppData): MissionItem[] {
  const ctx: IntelCtx = buildContext(s)
  const items: MissionItem[] = []
  const today = ctx.today

  // 1) priority tasks for today
  const priority = s.tasks.filter((t) => t.date === today && t.priority)
  for (const t of priority.slice(0, 3)) {
    items.push({ id: t.id, label: t.title, icon: AREA_META[t.area].emoji, to: '/today', done: t.done })
  }

  // 2) study target from the daily goal
  const dailyGoal = s.goals.find((g) => g.horizon === 'daily' && g.target)
  if (dailyGoal) {
    const done = (dailyGoal.current ?? 0) >= (dailyGoal.target ?? 0)
    items.push({ id: dailyGoal.id, label: dailyGoal.title, icon: '🎯', to: '/goals', done })
  }

  // 3) streak at risk
  if (ctx.habitsAtRisk[0]) {
    const h = ctx.habitsAtRisk[0].habit
    items.push({ id: `mission-${h.id}`, label: `Keep streak: ${h.name}`, icon: h.icon, to: '/habits', done: false })
  }

  // 4) overdue outreach
  if (ctx.staleInstitutes[0]) {
    items.push({
      id: `mission-${ctx.staleInstitutes[0].id}`,
      label: `Follow up: ${ctx.staleInstitutes[0].name}`,
      icon: '🤝',
      to: '/crm',
      done: false,
    })
  }

  return items.slice(0, 5)
}
