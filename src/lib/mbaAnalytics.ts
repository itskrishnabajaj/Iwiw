import type { AppData, MBAState } from './types'
import { iso } from './dates'
import { subDays } from 'date-fns'

export type Section = 'QA' | 'VARC' | 'DILR'
export const SECTIONS: Section[] = ['QA', 'VARC', 'DILR']

// Average mastery + volume per section, from topic stats.
export function sectionStats(mba: MBAState) {
  return SECTIONS.map((section) => {
    const topics = mba.topics.filter((t) => t.section === section && !t.archived)
    const mastery = topics.length ? Math.round(topics.reduce((a, t) => a + t.mastery, 0) / topics.length) : 0
    const questions = topics.reduce((a, t) => a + t.questionsSolved, 0)
    return { section, mastery, questions, topicCount: topics.length }
  })
}

// 7-day rolling average of daily study hours over the last `days` days.
export function studyVelocity(mba: MBAState, days = 30) {
  const byDate = new Map(mba.studyLogs.filter((l) => !l.archived).map((l) => [l.date, l.hours]))
  const out: { date: string; rolling: number; raw: number }[] = []
  const now = new Date() // capture once so the loop can't straddle midnight
  for (let i = days - 1; i >= 0; i--) {
    const date = iso(subDays(now, i))
    let sum = 0
    for (let j = 0; j < 7; j++) sum += byDate.get(iso(subDays(now, i + j))) ?? 0
    out.push({ date, rolling: +(sum / 7).toFixed(2), raw: byDate.get(date) ?? 0 })
  }
  return out
}

// Linear projection of percentile toward the exam date, based on recent mock trend.
export function percentileProjection(s: AppData): { current: number; projected: number; trendPerWeek: number } {
  const mocks = s.mba.mocks.filter((m) => !m.archived).slice(-5)
  if (mocks.length < 2) {
    const cur = mocks[0]?.percentile ?? 0
    return { current: cur, projected: cur, trendPerWeek: 0 }
  }
  const first = mocks[0]
  const last = mocks[mocks.length - 1]
  const weeks = Math.max(1, (new Date(last.date).getTime() - new Date(first.date).getTime()) / (7 * 86400000))
  const trendPerWeek = (last.percentile - first.percentile) / weeks
  const weeksToExam = Math.max(0, (new Date(s.settings.catDate).getTime() - Date.now()) / (7 * 86400000))
  const projected = Math.max(0, Math.min(99.9, +(last.percentile + trendPerWeek * weeksToExam).toFixed(1)))
  return { current: last.percentile, projected, trendPerWeek: +trendPerWeek.toFixed(2) }
}

// Topics below a mastery threshold, ordered weakest-first — the revision queue.
export function revisionQueue(mba: MBAState, threshold = 70) {
  return mba.topics.filter((t) => t.mastery < threshold && !t.archived).sort((a, b) => a.mastery - b.mastery)
}
