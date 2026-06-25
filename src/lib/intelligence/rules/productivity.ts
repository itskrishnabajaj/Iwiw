import type { Rule } from '../types'
import { AREA_META } from '@/store/selectors'

// Daily review, workload balance, outreach and schedule rules.
export const productivityRules: Rule[] = [
  {
    id: 'daily-review',
    kinds: ['daily'],
    run: (ctx) => {
      if (ctx.todayTotal === 0) {
        return {
          id: 'daily-review',
          kind: 'daily',
          icon: '🌅',
          title: 'A blank canvas',
          body: 'No tasks yet today — block your first deep-work session and momentum follows.',
          tone: 'neutral',
          score: 50,
          why: ['No tasks scheduled today'],
          action: { label: 'Plan today', to: '/today' },
        }
      }
      if (ctx.todayPct >= 80) {
        return {
          id: 'daily-review',
          kind: 'daily',
          icon: '🏆',
          title: 'Elite execution',
          body: `You've cleared ${ctx.todayDone}/${ctx.todayTotal} tasks with a ${ctx.focus} focus score. This is exactly what a 99%iler's day looks like. Protect your ${ctx.studyStreak}-day streak.`,
          tone: 'good',
          score: 35,
          why: [`${ctx.todayPct}% of today done`, `Focus score ${ctx.focus}`],
        }
      }
      if (ctx.todayPct >= 40) {
        return {
          id: 'daily-review',
          kind: 'daily',
          icon: '⚙️',
          title: 'Solid — finish strong',
          body: `Halfway there (${ctx.todayDone}/${ctx.todayTotal}). The highest-XP blocks are usually the hardest — knock out your priority task next.`,
          tone: 'neutral',
          score: 55,
          why: [`${ctx.todayPct}% of today done`],
          action: { label: 'Open Today', to: '/today' },
        }
      }
      return {
        id: 'daily-review',
        kind: 'daily',
        icon: '🎯',
        title: 'The day is yours to reclaim',
        body: `Only ${ctx.todayDone}/${ctx.todayTotal} done. One focused 50-minute block changes the entire shape of today. Start now.`,
        tone: 'warn',
        score: 70,
        why: [`Only ${ctx.todayPct}% of today done`],
        action: { label: 'Enter Focus', to: '/focus' },
      }
    },
  },
  {
    id: 'balance',
    kinds: ['balance'],
    run: (ctx) => {
      const least = ctx.balance.find((b) => b.area === ctx.leastTouchedArea)
      if (!least || least.value > 25) return null
      const meta = AREA_META[ctx.leastTouchedArea]
      return {
        id: 'balance',
        kind: 'balance',
        icon: '⚖️',
        title: 'One area is drifting',
        body: `${meta.label} has had the least attention over the last two weeks. A small win there today rebalances your life wheel.`,
        tone: 'neutral',
        score: 45,
        why: [`${meta.label} is your lowest-XP area (relative ${least.value}%)`],
        action: { label: `Open ${meta.label}`, to: meta.route },
      }
    },
  },
  {
    id: 'outreach-stale',
    kinds: ['suggestion', 'next-action'],
    run: (ctx) => {
      const stale = ctx.staleInstitutes
      if (!stale.length) return null
      return {
        id: 'outreach-stale',
        kind: 'next-action',
        icon: '🤝',
        title: 'Pipeline needs attention',
        body: `${stale.length} coaching institute${stale.length > 1 ? 's are' : ' is'} overdue for follow-up. Warm leads cool fast — send a message today.`,
        tone: 'warn',
        score: 60 + Math.min(20, stale.length * 5),
        why: stale.slice(0, 3).map((i) => `${i.name} follow-up was due ${i.followUp}`),
        action: { label: 'Open CRM', to: '/crm' },
      }
    },
  },
  {
    id: 'schedule',
    kinds: ['schedule'],
    run: (ctx) => {
      const logs = ctx.data.mba.studyLogs
      if (logs.length < 5) return null
      return {
        id: 'schedule',
        kind: 'schedule',
        icon: '⏰',
        title: 'Schedule optimization',
        body: 'Your highest focus scores cluster in the morning. Move your hardest QA set to your first block and shield it from meetings and messages.',
        tone: 'good',
        score: 40,
        why: ['Morning sessions historically score highest focus'],
        action: { label: 'Open Today', to: '/today' },
      }
    },
  },
]
