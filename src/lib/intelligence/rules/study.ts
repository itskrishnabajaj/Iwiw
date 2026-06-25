import type { Rule } from '../types'

// Study & exam-prep rules — deterministic, derived from MBA data.
export const studyRules: Rule[] = [
  {
    id: 'weak-topic',
    kinds: ['suggestion'],
    run: (ctx) => {
      const weakest = ctx.weakestTopics[0]
      if (!weakest || weakest.mastery >= 60) return null
      return {
        id: 'weak-topic',
        kind: 'suggestion',
        icon: '🎯',
        title: 'Highest-leverage study move',
        body: `Your weakest topic is ${weakest.topic} (${weakest.mastery}% mastery, ${weakest.section}). A focused 90-minute set here moves your sectional score more than another hour on a strong topic.`,
        tone: 'neutral',
        score: 80 - weakest.mastery,
        why: [
          `${weakest.topic} has the lowest mastery (${weakest.mastery}%)`,
          'Marginal gains are largest on weakest topics',
        ],
        action: { label: 'Open MBA Prep', to: '/mba' },
      }
    },
  },
  {
    id: 'study-velocity',
    kinds: ['prediction'],
    run: (ctx) => {
      const hrs = ctx.weeklyStudyHours
      const perDay = hrs / 7
      if (ctx.data.mba.studyLogs.length < 3) return null
      const tone = perDay >= 4 ? 'good' : perDay >= 2.5 ? 'neutral' : 'warn'
      return {
        id: 'study-velocity',
        kind: 'prediction',
        icon: '⚡',
        title: 'Study velocity',
        body: `You're averaging ${perDay.toFixed(1)}h/day this week (${hrs.toFixed(1)}h total). At this pace, with ${ctx.daysToCAT} days to CAT, you'll log roughly ${Math.round(perDay * ctx.daysToCAT)} more study hours before the exam.`,
        tone,
        score: tone === 'warn' ? 70 : 45,
        why: [
          `Weekly study hours: ${hrs.toFixed(1)}`,
          `${ctx.daysToCAT} days remain to CAT`,
        ],
        action: { label: 'Log study', to: '/mba' },
      }
    },
  },
  {
    id: 'next-mock',
    kinds: ['next-action'],
    run: (ctx) => {
      const mocks = ctx.data.mba.mocks
      if (!mocks.length) return null
      const last = mocks[mocks.length - 1]
      const daysSince = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000)
      if (daysSince < 7) return null
      return {
        id: 'next-mock',
        kind: 'next-action',
        icon: '📝',
        title: 'Time for a mock',
        body: `It's been ${daysSince} days since your last full mock (${last.name}, ${last.percentile} %ile). A weekly mock cadence keeps your percentile curve honest — schedule one today.`,
        tone: 'warn',
        score: Math.min(85, 40 + daysSince * 3),
        why: [`${daysSince} days since last mock`, 'Weekly mocks recommended near exam'],
        action: { label: 'Add mock', to: '/mba' },
      }
    },
  },
]
