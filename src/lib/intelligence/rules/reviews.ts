import type { Rule } from '../types'

// Weekly & monthly review generators + contextual motivation.
export const reviewRules: Rule[] = [
  {
    id: 'weekly-review',
    kinds: ['weekly'],
    run: (ctx) => {
      const hrs = ctx.weeklyStudyHours
      const mocks = ctx.data.mba.mocks.filter(
        (m) => Date.now() - new Date(m.date).getTime() < 7 * 86400000,
      )
      return {
        id: 'weekly-review',
        kind: 'weekly',
        icon: '📅',
        title: 'This week in review',
        body: `You earned ${ctx.weeklyXP.toLocaleString()} XP, logged ${hrs.toFixed(1)} study hours and took ${mocks.length} mock${mocks.length === 1 ? '' : 's'}. Predicted CAT percentile is holding at ${ctx.predictedPercentile}. Keep the mock cadence weekly and the curve stays pointed up.`,
        tone: ctx.weeklyXP > 800 ? 'good' : 'neutral',
        score: 40,
        why: [
          `Weekly XP ${ctx.weeklyXP}`,
          `${hrs.toFixed(1)} study hours`,
          `${mocks.length} mocks this week`,
        ],
        action: { label: 'Open Analytics', to: '/analytics' },
      }
    },
  },
  {
    id: 'monthly-review',
    kinds: ['monthly'],
    run: (ctx) => {
      const studyDays = ctx.data.mba.studyLogs.filter(
        (l) => Date.now() - new Date(l.date).getTime() < 30 * 86400000 && l.hours > 0,
      ).length
      return {
        id: 'monthly-review',
        kind: 'monthly',
        icon: '🗓️',
        title: 'The last 30 days',
        body: `${ctx.monthlyXP.toLocaleString()} XP across ${studyDays} active study days, productivity holding at ${ctx.productivity}%. Your discipline is compounding — this is how 99%ilers and founders are built.`,
        tone: ctx.productivity >= 60 ? 'good' : 'neutral',
        score: 35,
        why: [`Monthly XP ${ctx.monthlyXP}`, `${studyDays} study days`, `Productivity ${ctx.productivity}%`],
        action: { label: 'Open Analytics', to: '/analytics' },
      }
    },
  },
  {
    id: 'coach',
    kinds: ['coach'],
    run: (ctx) => {
      const lines = [
        'You are not behind. You are exactly where disciplined people are — in the middle of the work.',
        'QuantReflex and a top MBA are not two goals. They are the same goal wearing two outfits: leverage.',
        'The percentile is a lagging indicator. The deep-work block is the leading one. Win the block.',
        'Future-you, walking the IIM campus, is built from today’s 25 questions. Go get them.',
        'Consistency is just discipline that stopped negotiating with itself.',
        'Build something 100 people love before something a million people kind of like.',
      ]
      // Deterministic per calendar day — must NOT change when XP is logged mid-day.
      const idx = new Date().getDate() % lines.length
      return {
        id: 'coach',
        kind: 'coach',
        icon: '🧭',
        title: 'Your coach says',
        body: lines[idx],
        tone: 'good',
        score: 25,
        why: ['Contextual motivation rotated daily'],
      }
    },
  },
]
