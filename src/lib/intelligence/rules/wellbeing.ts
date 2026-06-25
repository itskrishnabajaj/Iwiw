import type { Rule } from '../types'

// Burnout, recovery and streak-risk detection.
export const wellbeingRules: Rule[] = [
  {
    id: 'burnout',
    kinds: ['burnout'],
    run: (ctx) => {
      const lowSleep = ctx.avgSleep < 6.5
      const lowRecovery = ctx.avgRecovery < 60
      if (lowSleep || lowRecovery) {
        return {
          id: 'burnout',
          kind: 'burnout',
          icon: '🛑',
          title: 'Burnout risk: elevated',
          body: `Sleep is averaging ${ctx.avgSleep.toFixed(1)}h and recovery ${Math.round(ctx.avgRecovery)}%. Output quietly degrades before you feel it — bank a real rest block today. It's an investment, not a cost.`,
          tone: 'warn',
          score: 75 + (lowSleep && lowRecovery ? 15 : 0),
          why: [
            `Avg sleep ${ctx.avgSleep.toFixed(1)}h (target 7+)`,
            `Avg recovery ${Math.round(ctx.avgRecovery)}% (target 60%+)`,
          ],
          action: { label: 'Check Gym', to: '/gym' },
        }
      }
      return {
        id: 'burnout',
        kind: 'burnout',
        icon: '🟢',
        title: 'Burnout risk: low',
        body: `Sleep (${ctx.avgSleep.toFixed(1)}h) and recovery (${Math.round(ctx.avgRecovery)}%) are healthy. Your engine has room to push harder this week.`,
        tone: 'good',
        score: 30,
        why: ['Sleep and recovery both within healthy range'],
      }
    },
  },
  {
    id: 'streak-risk',
    kinds: ['streak-risk'],
    run: (ctx) => {
      const top = ctx.habitsAtRisk[0]
      if (!top) return null
      const late = ctx.hour >= 18
      return {
        id: 'streak-risk',
        kind: 'streak-risk',
        icon: '🔥',
        title: `${top.streak}-day streak at risk`,
        body: `“${top.habit.name}” isn't checked off today and you're on a ${top.streak}-day run.${late ? ' The day is getting late — protect the streak now.' : ' Knock it out while there’s time.'}`,
        tone: late ? 'bad' : 'warn',
        score: Math.min(95, 50 + top.streak * 2 + (late ? 15 : 0)),
        why: [
          `${top.habit.name} streak = ${top.streak} days`,
          'Not completed today',
          ...(late ? ['After 6pm — limited time left'] : []),
        ],
        action: { label: 'Open Habits', to: '/habits' },
      }
    },
  },
]
