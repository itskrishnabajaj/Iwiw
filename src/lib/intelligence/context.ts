import type { AppData, AreaKey } from '@/lib/types'
import { todayISO } from '@/lib/dates'
import { currentStreak } from '@/lib/streaks'
import {
  todayProgress,
  studyStreak,
  weeklyXP,
  predictedPercentile,
  todayFocusScore,
  lifeBalance,
} from '@/store/selectors'
import type { IntelCtx } from './types'

function monthlyXP(s: AppData): number {
  const cutoff = Date.now() - 30 * 86400000
  return s.xpEvents.filter((e) => e.ts >= cutoff).reduce((a, e) => a + e.amount, 0)
}

// Composite, deterministic 0-100 productivity score from real signals.
export function productivityScore(s: AppData): number {
  const tp = todayProgress(s)
  const focus = todayFocusScore(s)
  const streak = Math.min(30, studyStreak(s))
  const wxp = Math.min(1500, weeklyXP(s))
  const recovery = s.gym.daily.slice(0, 3)
  const avgRec = recovery.length ? recovery.reduce((a, d) => a + d.recovery, 0) / recovery.length : 70

  const score =
    tp.pct * 0.3 +
    focus * 0.25 +
    (streak / 30) * 100 * 0.2 +
    (wxp / 1500) * 100 * 0.15 +
    avgRec * 0.1
  return Math.round(Math.max(0, Math.min(100, score)))
}

export function buildContext(s: AppData): IntelCtx {
  const tp = todayProgress(s)
  const today = todayISO()
  const gymRecent = s.gym.daily.slice(0, 5)
  const avgSleep = gymRecent.length ? gymRecent.reduce((a, d) => a + d.sleep, 0) / gymRecent.length : 7
  const avgRecovery = gymRecent.length ? gymRecent.reduce((a, d) => a + d.recovery, 0) / gymRecent.length : 70

  const weeklyStudyHours = s.mba.studyLogs
    .filter((l) => Date.now() - new Date(l.date).getTime() < 7 * 86400000)
    .reduce((a, l) => a + l.hours, 0)

  const sortedTopics = [...s.mba.topics].sort((a, b) => a.mastery - b.mastery)
  const staleInstitutes = s.institutes.filter(
    (i) => i.followUp && i.followUp < today && i.stage !== 'partner',
  )

  const habitsAtRisk = s.habits
    .map((h) => ({ habit: h, streak: currentStreak(h.log), doneToday: !!h.log[today] }))
    .filter((x) => x.streak >= 3 && !x.doneToday)
    .sort((a, b) => b.streak - a.streak)

  const balance = lifeBalance(s)
  const leastTouchedArea = [...balance].sort((a, b) => a.value - b.value)[0]?.area ?? 'personal'

  const catDays = Math.max(
    0,
    Math.ceil((new Date(s.settings.catDate).getTime() - Date.now()) / 86400000),
  )

  return {
    data: s,
    today,
    hour: new Date().getHours(),
    todayDone: tp.done,
    todayTotal: tp.total,
    todayPct: tp.pct,
    focus: todayFocusScore(s),
    studyStreak: studyStreak(s),
    weeklyXP: weeklyXP(s),
    monthlyXP: monthlyXP(s),
    weeklyStudyHours,
    avgSleep,
    avgRecovery,
    predictedPercentile: predictedPercentile(s),
    productivity: productivityScore(s),
    weakestTopics: sortedTopics.slice(0, 4),
    strongestTopics: [...sortedTopics].reverse().slice(0, 4),
    staleInstitutes,
    habitsAtRisk,
    balance,
    leastTouchedArea: leastTouchedArea as AreaKey,
    daysToCAT: catDays,
  }
}
