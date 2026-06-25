import type { AppData } from './types'
import { todayProgress, studyStreak, weeklyXP, predictedPercentile, todayFocusScore } from '@/store/selectors'
import { currentStreak } from './streaks'
import { todayISO } from './dates'

export type InsightKind = 'daily' | 'weekly' | 'coach' | 'burnout' | 'suggestion'

export interface Insight {
  kind: InsightKind
  title: string
  body: string
  tone: 'good' | 'neutral' | 'warn'
}

// Local heuristic "AI" — pure functions over real data. Swap for an LLM later.
export function generateInsight(kind: InsightKind, s: AppData): Insight {
  switch (kind) {
    case 'daily':
      return dailyReview(s)
    case 'weekly':
      return weeklyReview(s)
    case 'coach':
      return coach(s)
    case 'burnout':
      return burnout(s)
    case 'suggestion':
      return suggestion(s)
  }
}

function dailyReview(s: AppData): Insight {
  const tp = todayProgress(s)
  const focus = todayFocusScore(s)
  const streak = studyStreak(s)
  if (tp.total === 0)
    return { kind: 'daily', title: 'A blank canvas', body: 'No tasks yet today — block your first deep-work session and the momentum will follow.', tone: 'neutral' }
  if (tp.pct >= 80)
    return { kind: 'daily', title: 'Elite execution', body: `You've cleared ${tp.done}/${tp.total} tasks with a ${focus} focus score. This is exactly what a 99%iler's day looks like. Protect this streak of ${streak} days.`, tone: 'good' }
  if (tp.pct >= 40)
    return { kind: 'daily', title: 'Solid, finish strong', body: `Halfway there (${tp.done}/${tp.total}). The hardest blocks are usually the highest-XP ones — knock out your priority task next.`, tone: 'neutral' }
  return { kind: 'daily', title: 'The day is yours to reclaim', body: `Only ${tp.done}/${tp.total} done. One focused 50-minute block changes the entire shape of today. Start now.`, tone: 'warn' }
}

function weeklyReview(s: AppData): Insight {
  const xp = weeklyXP(s)
  const pct = predictedPercentile(s)
  const study = s.mba.studyLogs.filter((l) => Date.now() - new Date(l.date).getTime() < 7 * 86400000)
  const hours = study.reduce((a, l) => a + l.hours, 0)
  return {
    kind: 'weekly',
    title: 'This week in review',
    body: `You earned ${xp.toLocaleString()} XP and logged ${hours.toFixed(1)} study hours. Predicted CAT percentile is holding at ${pct}. Keep your mock cadence weekly and your percentile curve stays pointed up.`,
    tone: xp > 800 ? 'good' : 'neutral',
  }
}

function coach(s: AppData): Insight {
  const lines = [
    'You are not behind. You are exactly where disciplined people are — in the middle of the work.',
    'QuantReflex and a top MBA are not two goals. They are the same goal wearing two outfits: leverage.',
    'The percentile is a lagging indicator. The deep-work block is the leading one. Win the block.',
    'Future-you, walking the IIM campus, is built from today’s 25 questions. Go get them.',
    'Consistency is just discipline that stopped negotiating with itself.',
  ]
  const idx = (new Date().getDate() + s.xpEvents.length) % lines.length
  return { kind: 'coach', title: 'Your coach says', body: lines[idx], tone: 'good' }
}

function burnout(s: AppData): Insight {
  const recoveries = s.gym.daily.slice(0, 5).map((d) => d.recovery)
  const avgRecovery = recoveries.length ? recoveries.reduce((a, b) => a + b, 0) / recoveries.length : 70
  const sleep = s.gym.daily.slice(0, 5).map((d) => d.sleep)
  const avgSleep = sleep.length ? sleep.reduce((a, b) => a + b, 0) / sleep.length : 7
  if (avgSleep < 6.5 || avgRecovery < 60)
    return { kind: 'burnout', title: 'Burnout risk: elevated', body: `Sleep is averaging ${avgSleep.toFixed(1)}h and recovery is ${Math.round(avgRecovery)}%. Your output will quietly degrade. Schedule a genuine rest block today — it's an investment, not a cost.`, tone: 'warn' }
  return { kind: 'burnout', title: 'Burnout risk: low', body: `Sleep (${avgSleep.toFixed(1)}h) and recovery (${Math.round(avgRecovery)}%) are healthy. Your engine has room to push harder this week.`, tone: 'good' }
}

function suggestion(s: AppData): Insight {
  const weakest = [...s.mba.topics].sort((a, b) => a.mastery - b.mastery)[0]
  const stale = s.institutes.filter((i) => i.followUp && i.followUp < todayISO())
  if (weakest && weakest.mastery < 60)
    return { kind: 'suggestion', title: 'Highest-leverage move', body: `Your weakest topic is ${weakest.topic} (${weakest.mastery}% mastery). A focused 90-minute set there will move your sectional score more than another hour on Arithmetic.`, tone: 'neutral' }
  if (stale.length)
    return { kind: 'suggestion', title: 'Pipeline needs attention', body: `${stale.length} coaching institute(s) are overdue for follow-up. Warm leads cool fast — send a message today.`, tone: 'warn' }
  return { kind: 'suggestion', title: 'Schedule optimization', body: 'Your highest focus scores cluster in the morning. Move your hardest QA set to your first block and protect it from meetings.', tone: 'good' }
}

export function allInsights(s: AppData): Insight[] {
  return (['daily', 'suggestion', 'burnout', 'coach'] as InsightKind[]).map((k) => generateInsight(k, s))
}
