import type { AppData, ISODate, TopicStat, Institute, Habit, AreaKey } from '@/lib/types'

export type InsightKind =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'coach'
  | 'burnout'
  | 'suggestion'
  | 'streak-risk'
  | 'next-action'
  | 'prediction'
  | 'balance'
  | 'schedule'

export type Tone = 'good' | 'neutral' | 'warn' | 'bad'

// Every insight is explainable: `why` lists the deterministic reasons it fired.
export interface Insight {
  id: string
  kind: InsightKind
  title: string
  body: string
  tone: Tone
  score: number // 0-100 priority/severity, used for ranking
  why: string[]
  icon?: string
  action?: { label: string; to: string }
}

export interface HabitRisk {
  habit: Habit
  streak: number
  doneToday: boolean
}

// A single derived snapshot fed to every rule — computed once per run.
export interface IntelCtx {
  data: AppData
  today: ISODate
  hour: number
  todayDone: number
  todayTotal: number
  todayPct: number
  focus: number
  studyStreak: number
  weeklyXP: number
  monthlyXP: number
  weeklyStudyHours: number
  avgSleep: number
  avgRecovery: number
  predictedPercentile: number
  productivity: number
  weakestTopics: TopicStat[]
  strongestTopics: TopicStat[]
  staleInstitutes: Institute[]
  habitsAtRisk: HabitRisk[]
  balance: { area: AreaKey; value: number }[]
  leastTouchedArea: AreaKey
  daysToCAT: number
}

// A rule is a pure function: context in, at most one insight out.
export interface Rule {
  id: string
  kinds: InsightKind[]
  run: (ctx: IntelCtx) => Insight | null
}
