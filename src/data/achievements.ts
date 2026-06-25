import type { Achievement, AppData } from '@/lib/types'
import { totalXP, levelFromXP } from '@/lib/xp'
import { studyStreak } from '@/store/selectors'

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

function totalStudyHours(s: AppData) {
  return s.mba.studyLogs.reduce((a, l) => a + l.hours, 0)
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'a_study100', title: '100 Hours Studied', description: 'Log 100 total hours of study.', icon: '⏱️', tier: 'bronze', check: (s) => { const h = totalStudyHours(s); return { unlocked: h >= 100, progress: clamp((h / 100) * 100) } } },
  { id: 'a_study500', title: '500 Hours Deep', description: 'Log 500 total study hours.', icon: '📚', tier: 'gold', check: (s) => { const h = totalStudyHours(s); return { unlocked: h >= 500, progress: clamp((h / 500) * 100) } } },
  { id: 'a_streak7', title: 'Week of Fire', description: '7-day study streak.', icon: '🔥', tier: 'bronze', check: (s) => { const st = studyStreak(s); return { unlocked: st >= 7, progress: clamp((st / 7) * 100) } } },
  { id: 'a_streak30', title: '30-Day Monk', description: '30-day study streak.', icon: '🧘', tier: 'silver', check: (s) => { const st = studyStreak(s); return { unlocked: st >= 30, progress: clamp((st / 30) * 100) } } },
  { id: 'a_streak365', title: '365-Day Legend', description: 'A full year, every day.', icon: '👑', tier: 'platinum', check: (s) => { const st = studyStreak(s); return { unlocked: st >= 365, progress: clamp((st / 365) * 100) } } },
  { id: 'a_cert1', title: 'First Certificate', description: 'Earn your first course certificate.', icon: '🎓', tier: 'bronze', check: (s) => { const n = s.courses.filter((c) => c.certificate).length; return { unlocked: n >= 1, progress: n >= 1 ? 100 : 0 } } },
  { id: 'a_cert5', title: 'Lifelong Learner', description: 'Earn 5 certificates.', icon: '📜', tier: 'gold', check: (s) => { const n = s.courses.filter((c) => c.certificate).length; return { unlocked: n >= 5, progress: clamp((n / 5) * 100) } } },
  { id: 'a_meet10', title: '10 Coaching Meetings', description: 'Reach the meeting stage with 10 institutes.', icon: '🤝', tier: 'silver', check: (s) => { const n = s.institutes.filter((i) => ['meeting', 'proposal', 'interested', 'partner'].includes(i.stage)).length; return { unlocked: n >= 10, progress: clamp((n / 10) * 100) } } },
  { id: 'a_partner', title: 'First Partnership', description: 'Close your first coaching partnership.', icon: '🏆', tier: 'gold', check: (s) => { const n = s.institutes.filter((i) => i.stage === 'partner').length; return { unlocked: n >= 1, progress: n >= 1 ? 100 : 0 } } },
  { id: 'a_users1k', title: '1,000 QuantReflex Users', description: 'Grow to 1,000 users.', icon: '🚀', tier: 'platinum', check: (s) => ({ unlocked: s.qr.users >= 1000, progress: clamp((s.qr.users / 1000) * 100) }) },
  { id: 'a_revenue', title: 'First Revenue', description: 'Earn your first rupee from QuantReflex.', icon: '💸', tier: 'silver', check: (s) => ({ unlocked: s.qr.revenue > 0, progress: s.qr.revenue > 0 ? 100 : 0 }) },
  { id: 'a_gym50', title: '50 Gym Sessions', description: 'Complete 50 workouts.', icon: '💪', tier: 'silver', check: (s) => { const n = s.gym.workouts.length; return { unlocked: n >= 50, progress: clamp((n / 50) * 100) } } },
  { id: 'a_p99', title: '99 Percentile', description: 'Score 99%ile in a mock.', icon: '🎯', tier: 'platinum', check: (s) => { const best = Math.max(0, ...s.mba.mocks.map((m) => m.percentile)); return { unlocked: best >= 99, progress: clamp(best) } } },
  { id: 'a_p90', title: '90 Percentile Club', description: 'Cross 90%ile in a mock.', icon: '📈', tier: 'gold', check: (s) => { const best = Math.max(0, ...s.mba.mocks.map((m) => m.percentile)); return { unlocked: best >= 90, progress: clamp(best) } } },
  { id: 'a_level20', title: 'Level 20', description: 'Reach overall level 20.', icon: '⭐', tier: 'gold', check: (s) => { const lvl = levelFromXP(totalXP(s.xpEvents)).level; return { unlocked: lvl >= 20, progress: clamp((lvl / 20) * 100) } } },
  { id: 'a_journal7', title: 'Reflective Mind', description: 'Journal 7 times.', icon: '✍️', tier: 'bronze', check: (s) => { const n = s.journal.length; return { unlocked: n >= 7, progress: clamp((n / 7) * 100) } } },
  { id: 'a_pyq1k', title: '1,000 PYQs', description: 'Solve 1,000 previous-year questions.', icon: '🧩', tier: 'gold', check: (s) => ({ unlocked: s.mba.pyqsSolved >= 1000, progress: clamp((s.mba.pyqsSolved / 1000) * 100) }) },
  { id: 'a_qbank5k', title: '5,000 Questions', description: 'Solve 5,000 questions from the bank.', icon: '🏅', tier: 'platinum', check: (s) => ({ unlocked: s.mba.questionBankSolved >= 5000, progress: clamp((s.mba.questionBankSolved / 5000) * 100) }) },
]

export const TIER_COLOR: Record<Achievement['tier'], string> = {
  bronze: '#c08457',
  silver: '#c9d1d9',
  gold: '#f5c451',
  platinum: '#7c5cff',
}

export function evaluateAchievements(s: AppData) {
  return ACHIEVEMENTS.map((a) => ({ ...a, ...a.check(s) }))
}
