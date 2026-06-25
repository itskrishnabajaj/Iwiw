import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { runRules, topPriority, dailyMission, productivityScore } from '@/lib/intelligence/engine'
import type { Insight, InsightKind } from '@/lib/intelligence/types'

// Memoized access to the intelligence engine. Recomputes only when the data
// that rules depend on (xp events, tasks, habits, mba, gym, institutes) changes.
export function useIntelligence(kinds?: InsightKind[]): Insight[] {
  const xpEvents = useAppStore((s) => s.xpEvents)
  const tasks = useAppStore((s) => s.tasks)
  const habits = useAppStore((s) => s.habits)
  const mba = useAppStore((s) => s.mba)
  const gym = useAppStore((s) => s.gym)
  const institutes = useAppStore((s) => s.institutes)
  const goals = useAppStore((s) => s.goals)
  return useMemo(
    () => runRules(useAppStore.getState(), kinds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [xpEvents, tasks, habits, mba, gym, institutes, goals, kinds],
  )
}

export function useTopPriority(): Insight | null {
  const xpEvents = useAppStore((s) => s.xpEvents)
  const tasks = useAppStore((s) => s.tasks)
  const habits = useAppStore((s) => s.habits)
  const institutes = useAppStore((s) => s.institutes)
  return useMemo(
    () => topPriority(useAppStore.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [xpEvents, tasks, habits, institutes],
  )
}

export function useDailyMission() {
  const tasks = useAppStore((s) => s.tasks)
  const goals = useAppStore((s) => s.goals)
  const habits = useAppStore((s) => s.habits)
  const institutes = useAppStore((s) => s.institutes)
  return useMemo(
    () => dailyMission(useAppStore.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, goals, habits, institutes],
  )
}

export function useProductivityScore(): number {
  const xpEvents = useAppStore((s) => s.xpEvents)
  const tasks = useAppStore((s) => s.tasks)
  const gym = useAppStore((s) => s.gym)
  return useMemo(
    () => productivityScore(useAppStore.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [xpEvents, tasks, gym],
  )
}
