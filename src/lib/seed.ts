import { iso, todayISO } from './dates'
import { subDays } from 'date-fns'
import type {
  AppData,
  Habit,
  ISODate,
  Settings,
  Skill,
  StudyLog,
  Task,
} from './types'

export const DATA_VERSION = 2

// Identity defaults belong to the OWNER (Krishna) — they are structure, not
// fabricated progress, so a fresh start keeps them. Progress always starts at zero.
export const DEFAULT_SETTINGS: Settings = {
  name: 'Krishna',
  mission:
    'Build QuantReflex into India’s leading aptitude preparation platform while earning admission into a top MBA institute and becoming the best version of myself.',
  birthDate: '2001-08-14',
  catDate: '2026-11-29',
  cetDate: '2027-03-07',
  weatherCity: 'Pune',
  weatherLat: 18.5204,
  weatherLon: 73.8567,
  reduceMotion: false,
  units: 'kg',
}

// Life Domains — the structural categories that organize the OS. They start at
// 0 XP (Level 1); XP is only ever earned through real activity.
export const DOMAIN_SKILLS: Skill[] = [
  { id: 'sk_entre', name: 'Entrepreneur', area: 'qr', xp: 0, icon: '🚀' },
  { id: 'sk_quant', name: 'Quantitative Aptitude', area: 'mba', xp: 0, icon: '🧮' },
  { id: 'sk_comm', name: 'Communication', area: 'personal', xp: 0, icon: '🗣️' },
  { id: 'sk_disc', name: 'Discipline', area: 'personal', xp: 0, icon: '⚔️' },
  { id: 'sk_fit', name: 'Fitness', area: 'gym', xp: 0, icon: '🏋️' },
  { id: 'sk_learn', name: 'Learning', area: 'learn', xp: 0, icon: '🧠' },
  { id: 'sk_sales', name: 'Sales & Outreach', area: 'crm', xp: 0, icon: '🤝' },
]

// ----------------------------------------------------------------------------
// EMPTY first-run data — a clean, trustworthy foundation. Level 1, 0 XP, every
// module empty. This is the default for a new install and for "Reset data".
// ----------------------------------------------------------------------------
export function emptyData(): AppData {
  return {
    version: DATA_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    skills: DOMAIN_SKILLS.map((s) => ({ ...s })),
    xpEvents: [],
    tasks: [],
    habits: [],
    goals: [],
    mba: {
      mocks: [],
      topics: [],
      studyLogs: [],
      pyqsSolved: 0,
      questionBankSolved: 0,
      revisionCycles: 0,
      weeklyPlan: [],
      monthlyTarget: '',
    },
    qr: { items: [], milestones: [], checklist: [], downloads: 0, users: 0, revenue: 0, feedback: [] },
    institutes: [],
    courses: [],
    gym: { weights: [], workouts: [], prs: [], daily: [], measurements: [] },
    finance: { transactions: [], subscriptions: [], savings: 0, monthlyBurn: 0 },
    personal: { meditationMinutes: {}, deepWorkHours: {}, screenTime: {}, pagesRead: {} },
    journal: [],
    dayLogs: [],
    unlockedAchievements: {},
    notes: [],
    vision: [],
  }
}

// Back-compat alias: validation defaults, corruption fallback and reset all want
// the empty foundation (never fabricated data).
export function freshData(): AppData {
  return emptyData()
}

// Does this state contain ANY real user content? Used by the backup/recovery
// layer so an effectively-empty snapshot can never poison recovery or silently
// overwrite real data. Ignores the structural scaffold (settings + zero-XP skills).
export function hasUserContent(d: AppData): boolean {
  if (!d) return false
  const lists = [
    d.xpEvents, d.tasks, d.habits, d.goals, d.institutes, d.courses, d.journal,
    d.dayLogs, d.notes, d.vision,
    d.mba?.mocks, d.mba?.topics, d.mba?.studyLogs,
    d.qr?.items, d.qr?.milestones, d.qr?.checklist, d.qr?.feedback,
    d.gym?.weights, d.gym?.workouts, d.gym?.prs, d.gym?.daily, d.gym?.measurements,
    d.finance?.transactions, d.finance?.subscriptions,
  ]
  if (lists.some((a) => Array.isArray(a) && a.length > 0)) return true
  const m = d.mba
  if (m && (m.pyqsSolved || m.questionBankSolved || m.revisionCycles || m.weeklyPlan?.length || (m.monthlyTarget ?? '').trim())) return true
  const q = d.qr
  if (q && (q.downloads || q.users || q.revenue)) return true
  const f = d.finance
  if (f && (f.savings || f.monthlyBurn)) return true
  const p = d.personal
  if (p && [p.meditationMinutes, p.deepWorkHours, p.screenTime, p.pagesRead].some((r) => r && Object.keys(r).length > 0)) return true
  if (d.skills?.some((s) => s.xp > 0)) return true
  if (d.unlockedAchievements && Object.keys(d.unlockedAchievements).length > 0) return true
  return false
}

// ----------------------------------------------------------------------------
// EXAMPLE data — an opt-in, fully ISOLATED sandbox. It populates module CONTENT
// only (list collections), every item tagged `example: true` so the UI badges it
// and "Remove sample data" strips it. It deliberately does NOT set xpEvents,
// skill XP, scalar counters/metrics (MBA counters/plan, QR downloads/users/revenue,
// finance savings/burn) or personal metrics — so sample data can NEVER affect real
// XP / Level / achievements / streaks / heatmaps / analytics, and loading or
// removing it can never modify a permanent personal metric. Real progression comes
// only from genuine user actions.
// ----------------------------------------------------------------------------
const tag = <T extends object>(arr: T[]): T[] => arr.map((x) => ({ ...x, example: true as const }))

export function exampleData(): AppData {
  const today = todayISO()
  const d = emptyData()

  // NOTE: skills stay at 0 XP, xpEvents stays empty — gamification is never faked.
  d.tasks = tag(TASKS.map((t) => ({ ...t, date: today })))
  d.habits = tag(buildHabits())
  d.goals = tag(buildGoals())

  // MBA: list content only; scalar counters / plan / target stay at empty defaults.
  d.mba = {
    ...d.mba,
    mocks: tag(buildMocks()),
    topics: tag(buildTopics()),
    studyLogs: tag(buildStudyLogs()),
  }

  // QuantReflex: roadmap/milestones/checklist/feedback only; metrics stay 0.
  const qr = buildQR()
  d.qr = {
    ...d.qr,
    items: tag(qr.items),
    milestones: tag(qr.milestones),
    checklist: tag(qr.checklist),
    feedback: tag(qr.feedback),
  }

  d.institutes = tag(buildInstitutes())
  d.courses = tag(buildCourses())

  // Gym: logged entries only (all list-based).
  const gym = buildGym()
  d.gym = {
    weights: tag(gym.weights),
    workouts: tag(gym.workouts),
    prs: tag(gym.prs),
    daily: tag(gym.daily),
    measurements: tag(gym.measurements),
  }

  // Finance: transactions + subscriptions only; savings/burn stay 0.
  const fin = buildFinance()
  d.finance = {
    ...d.finance,
    transactions: tag(fin.transactions),
    subscriptions: tag(fin.subscriptions),
  }

  // personal metrics are intentionally left empty (never part of the sandbox).

  d.journal = tag([
    {
      id: uid('j'), date: today,
      wentWell: 'Hit my QA target before 9 AM and felt sharp.',
      didntGoWell: 'Skipped the second DILR set, got distracted.',
      lessons: 'Phone in another room doubles my focus.',
      gratitude: 'Grateful for a quiet library and a clear goal.',
      ideas: 'QuantReflex could add spaced-repetition for wrong answers.',
      mood: 4,
    },
    {
      id: uid('j'), date: iso(subDays(new Date(), 1)),
      wentWell: 'Closed a strong mock and called two coaching institutes.',
      didntGoWell: 'Stayed up too late coding the leaderboard feature.',
      lessons: 'Protect sleep — late nights tax the next morning study block.',
      gratitude: 'Grateful for momentum on QuantReflex and supportive mentors.',
      ideas: 'A campus ambassador program could drive QuantReflex installs.',
      mood: 5,
    },
    {
      id: uid('j'), date: iso(subDays(new Date(), 2)),
      wentWell: 'Deep work block on Arithmetic felt effortless today.',
      didntGoWell: 'Missed the gym, energy dipped in the evening.',
      lessons: 'Schedule gym before deep work, not after.',
      gratitude: 'Grateful for discipline that is slowly becoming identity.',
      ideas: 'Add a focus timer streak inside the study workflow.',
      mood: 3,
    },
  ])

  d.dayLogs = tag(buildDayLogs())
  d.notes = tag([
    { id: uid('n'), text: 'Email IMS about partnership deck', ts: Date.now() - 3600_000 },
    { id: uid('n'), text: 'Idea: QuantReflex streak-freeze power-up', ts: Date.now() - 7200_000 },
  ])
  d.vision = tag(buildVision())

  return d
}

// Deterministic pseudo-random from a string seed (stable across reloads)
function rng(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

function uid(p = 'id'): string {
  return `${p}_${Math.random().toString(36).slice(2, 9)}`
}

// ---- generated history (example dataset only) ------------------------------
function buildStudyLogs(): StudyLog[] {
  const logs: StudyLog[] = []
  for (let i = 120; i >= 0; i--) {
    const date = iso(subDays(new Date(), i))
    const r = rng(date + 's')
    if (r < 0.12) continue // rest days
    const hours = +(2 + r * 5).toFixed(1)
    logs.push({
      date,
      hours,
      questions: Math.round(10 + r * 45),
      focusScore: Math.round(55 + r * 42),
      library: rng(date + 'lib') > 0.45,
    })
  }
  return logs
}

function buildHabitLog(seed: string, density: number): Record<ISODate, boolean> {
  const log: Record<ISODate, boolean> = {}
  for (let i = 95; i >= 0; i--) {
    const date = iso(subDays(new Date(), i))
    if (rng(date + seed) < density) log[date] = true
  }
  return log
}

function buildHabits(): Habit[] {
  return [
    { id: uid('h'), name: 'Wake at 6 AM', area: 'personal', icon: '🌅', log: buildHabitLog('wake', 0.82), createdAt: iso(subDays(new Date(), 95)), targetPerWeek: 7 },
    { id: uid('h'), name: 'Study 4+ hours', area: 'mba', icon: '📚', log: buildHabitLog('study', 0.85), createdAt: iso(subDays(new Date(), 95)), targetPerWeek: 6 },
    { id: uid('h'), name: 'Gym session', area: 'gym', icon: '💪', log: buildHabitLog('gym', 0.7), createdAt: iso(subDays(new Date(), 95)), targetPerWeek: 5 },
    { id: uid('h'), name: 'Meditate', area: 'personal', icon: '🧘', log: buildHabitLog('med', 0.75), createdAt: iso(subDays(new Date(), 95)), targetPerWeek: 7 },
    { id: uid('h'), name: 'Ship QuantReflex code', area: 'qr', icon: '⚡', log: buildHabitLog('qr', 0.6), createdAt: iso(subDays(new Date(), 95)), targetPerWeek: 5 },
    { id: uid('h'), name: 'No social media before noon', area: 'personal', icon: '🚫', log: buildHabitLog('nosm', 0.78), createdAt: iso(subDays(new Date(), 95)), targetPerWeek: 7 },
    { id: uid('h'), name: 'Read 20 pages', area: 'learn', icon: '📖', log: buildHabitLog('read', 0.65), createdAt: iso(subDays(new Date(), 95)), targetPerWeek: 6 },
  ]
}

function buildMocks() {
  const names = ['SIMCAT 1', 'SIMCAT 2', 'AIMCAT 3', 'SIMCAT 4', 'AIMCAT 5', 'SIMCAT 6', 'AIMCAT 7']
  return names.map((name, idx) => {
    const date = iso(subDays(new Date(), (names.length - idx) * 9))
    const base = 78 + idx * 2.6 + rng(name) * 4
    return {
      id: uid('mock'),
      date,
      name,
      kind: 'full' as const,
      percentile: Math.min(99.4, +base.toFixed(1)),
      accuracy: Math.round(62 + idx * 1.8 + rng(name + 'a') * 8),
      attempted: 56 + Math.round(rng(name + 'q') * 10),
      correct: 40 + Math.round(rng(name + 'c') * 12),
    }
  })
}

const TASKS: Omit<Task, 'date'>[] = [
  { id: uid('t'), title: 'Morning meditation + cold shower', block: 'morning', area: 'personal', done: true, xp: 15, time: '06:00', priority: true },
  { id: uid('t'), title: 'QA: Arithmetic — 25 questions', block: 'morning', area: 'mba', done: true, xp: 40, time: '07:00', priority: true },
  { id: uid('t'), title: 'Library deep work block', block: 'morning', area: 'mba', done: false, xp: 50, time: '09:00', priority: true },
  { id: uid('t'), title: 'QuantReflex: ship leaderboard feature', block: 'afternoon', area: 'qr', done: false, xp: 60, time: '13:00', priority: true },
  { id: uid('t'), title: 'Call 2 coaching institutes', block: 'afternoon', area: 'crm', done: false, xp: 35, time: '15:00' },
  { id: uid('t'), title: 'DILR sectional test', block: 'afternoon', area: 'mba', done: false, xp: 45, time: '16:30' },
  { id: uid('t'), title: 'Gym — Push day', block: 'evening', area: 'gym', done: false, xp: 40, time: '18:30', priority: true },
  { id: uid('t'), title: 'Coursera: Financial Markets — 1 module', block: 'evening', area: 'learn', done: false, xp: 25, time: '20:00' },
  { id: uid('t'), title: 'Revise weak topics flashcards', block: 'night', area: 'mba', done: false, xp: 20, time: '21:30' },
  { id: uid('t'), title: 'Journal + plan tomorrow', block: 'night', area: 'personal', done: false, xp: 15, time: '22:30' },
]

function buildGoals() {
  const annual = { id: 'g_cat', title: '99+ CAT Percentile', area: 'mba' as const, horizon: 'annual' as const, progress: 0, done: false }
  const q = { id: 'g_q', title: 'Master Arithmetic & DILR', area: 'mba' as const, horizon: 'quarterly' as const, parentId: 'g_cat', progress: 0, done: false }
  const m = { id: 'g_m', title: 'Finish Arithmetic syllabus', area: 'mba' as const, horizon: 'monthly' as const, parentId: 'g_q', progress: 0, done: false }
  const w = { id: 'g_w', title: 'Solve 300 Arithmetic questions', area: 'mba' as const, horizon: 'weekly' as const, parentId: 'g_m', progress: 0, current: 215, target: 300, unit: 'questions', done: false }
  const d = { id: 'g_d', title: "Today's target: 25 questions", area: 'mba' as const, horizon: 'daily' as const, parentId: 'g_w', progress: 64, current: 16, target: 25, unit: 'questions', done: false }
  const qr1 = { id: 'g_qr', title: 'QuantReflex: 1,000 active users', area: 'qr' as const, horizon: 'annual' as const, progress: 0, current: 340, target: 1000, unit: 'users', done: false }
  const qr2 = { id: 'g_qr2', title: 'Launch on Play Store', area: 'qr' as const, horizon: 'quarterly' as const, parentId: 'g_qr', progress: 70, done: false }
  const gym1 = { id: 'g_gym', title: 'Reach 75kg lean', area: 'gym' as const, horizon: 'annual' as const, progress: 0, current: 71, target: 75, unit: 'kg', done: false }
  return [annual, q, m, w, d, qr1, qr2, gym1]
}

function buildTopics() {
  const data: [string, 'VARC' | 'DILR' | 'QA', number, number][] = [
    ['Arithmetic', 'QA', 82, 640],
    ['Algebra', 'QA', 74, 410],
    ['Number System', 'QA', 88, 380],
    ['Geometry', 'QA', 58, 290],
    ['Modern Math', 'QA', 49, 180],
    ['Reading Comprehension', 'VARC', 71, 220],
    ['Para Jumbles', 'VARC', 64, 140],
    ['Verbal Reasoning', 'VARC', 67, 160],
    ['Logical Reasoning', 'DILR', 60, 240],
    ['Data Interpretation', 'DILR', 55, 210],
    ['Puzzles', 'DILR', 52, 130],
  ]
  return data.map(([topic, section, mastery, q]) => ({ topic, section, mastery, questionsSolved: q }))
}

function buildQR() {
  const titles: [string, 'feature' | 'bug' | 'idea' | 'marketing', 'idea' | 'todo' | 'building' | 'done'][] = [
    ['Adaptive difficulty engine', 'feature', 'done'],
    ['Daily streak system', 'feature', 'done'],
    ['Leaderboard', 'feature', 'building'],
    ['Spaced repetition for wrong answers', 'feature', 'todo'],
    ['Timer drift on slow devices', 'bug', 'todo'],
    ['Crash on result share (Android 12)', 'bug', 'building'],
    ['AI explanation for each question', 'idea', 'idea'],
    ['Reels-style quick quiz', 'idea', 'idea'],
    ['Instagram launch campaign', 'marketing', 'todo'],
    ['Campus ambassador program', 'marketing', 'idea'],
  ]
  return {
    items: titles.map(([title, type, status]) => ({ id: uid('qr'), title, type, status })),
    milestones: [
      { id: uid('ms'), title: 'First 100 users', date: iso(subDays(new Date(), 60)), done: true },
      { id: uid('ms'), title: 'First revenue ₹', date: iso(subDays(new Date(), 30)), done: true },
      { id: uid('ms'), title: 'Play Store launch', date: iso(subDays(new Date(), -20)), done: false },
      { id: uid('ms'), title: '1,000 users', date: iso(subDays(new Date(), -60)), done: false },
    ],
    checklist: [
      { id: uid('c'), label: 'App icon & feature graphic', done: true, group: 'Play Store' },
      { id: uid('c'), label: 'Privacy policy page', done: true, group: 'Play Store' },
      { id: uid('c'), label: 'Screenshots (phone + tablet)', done: false, group: 'Play Store' },
      { id: uid('c'), label: 'Signed release build', done: false, group: 'Play Store' },
      { id: uid('c'), label: 'Firestore security rules', done: true, group: 'Firebase' },
      { id: uid('c'), label: 'Analytics events wired', done: false, group: 'Firebase' },
      { id: uid('c'), label: 'Crashlytics enabled', done: true, group: 'Firebase' },
    ],
    downloads: 612,
    users: 340,
    revenue: 18400,
    feedback: [
      { id: uid('fb'), text: 'The adaptive mode actually pushed my speed up.', author: 'Aditi R.', rating: 5 },
      { id: uid('fb'), text: 'Love the streaks, but want offline mode.', author: 'Rohan K.', rating: 4 },
      { id: uid('fb'), text: 'Best aptitude app I’ve used so far.', author: 'Sneha M.', rating: 5 },
    ],
  }
}

function buildInstitutes() {
  const data: [string, string, string, string, string, import('./types').PipelineStage, number][] = [
    ['IMS Learning', 'Pune', 'Mr. Deshpande', '9820012345', 'pune@ims.in', 'meeting', 65],
    ['TIME Institute', 'Mumbai', 'Ms. Kulkarni', '9820067890', 'mumbai@time.in', 'proposal', 80],
    ['Career Launcher', 'Pune', 'Mr. Sharma', '9820011223', 'cl@cl.in', 'visited', 40],
    ['Endeavor', 'Nagpur', 'Ms. Pillai', '9820099887', 'ngp@endeavor.in', 'lead', 25],
    ['Bull’s Eye', 'Pune', 'Mr. Nair', '9820055667', 'pune@bulls.in', 'interested', 72],
    ['Local Coaching Hub', 'Nashik', 'Mr. Patil', '9820033445', 'nashik@hub.in', 'partner', 95],
  ]
  return data.map(([name, location, contact, phone, email, stage, probability]) => ({
    id: uid('inst'), name, location, contact, phone, email, whatsapp: phone, stage, probability,
    followUp: iso(subDays(new Date(), -Math.round(rng(name) * 14))),
    notes: 'Interested in white-label QuantReflex for their students.',
  }))
}

function buildCourses() {
  const data: [string, import('./types').Course['source'], number, number, number, boolean][] = [
    ['Financial Markets (Yale)', 'Coursera', 100, 30, 30, true],
    ['Learning How to Learn', 'Coursera', 100, 15, 15, true],
    ['Zero to One', 'Book', 70, 8, 5.6, false],
    ['Atomic Habits', 'Book', 100, 7, 7, true],
    ['The Lean Startup', 'Book', 45, 9, 4, false],
    ['Quant shortcuts playlist', 'YouTube', 60, 20, 12, false],
    ['Founders Podcast', 'Podcast', 30, 40, 12, false],
  ]
  return data.map(([title, source, progress, totalHours, hoursInvested, certificate]) => ({
    id: uid('crs'), title, source, progress, totalHours, hoursInvested, certificate,
    notes: 'Key takeaways logged in journal.',
  }))
}

function buildGym() {
  const weights = Array.from({ length: 16 }, (_, i) => {
    const date = iso(subDays(new Date(), (15 - i) * 6))
    return { date, weight: +(73.5 - i * 0.16 + (rng(date) - 0.5) * 0.4).toFixed(1) }
  })
  const workouts = Array.from({ length: 24 }, (_, i) => {
    const date = iso(subDays(new Date(), i * 2 + 1))
    const names = ['Push', 'Pull', 'Legs', 'Upper', 'Lower']
    return { id: uid('w'), date, name: names[i % names.length], volume: 4200 + Math.round(rng(date) * 2400), duration: 55 + Math.round(rng(date + 'd') * 30) }
  })
  return {
    weights,
    workouts,
    prs: [
      { id: uid('pr'), lift: 'Bench Press', value: 80, unit: 'kg', date: iso(subDays(new Date(), 10)) },
      { id: uid('pr'), lift: 'Squat', value: 110, unit: 'kg', date: iso(subDays(new Date(), 20)) },
      { id: uid('pr'), lift: 'Deadlift', value: 140, unit: 'kg', date: iso(subDays(new Date(), 6)) },
    ],
    daily: Array.from({ length: 14 }, (_, i) => {
      const date = iso(subDays(new Date(), i))
      return { date, sleep: +(6.5 + rng(date) * 1.8).toFixed(1), water: +(2.2 + rng(date + 'w') * 1.5).toFixed(1), protein: 110 + Math.round(rng(date + 'p') * 60), calories: 2200 + Math.round(rng(date + 'c') * 600), mood: Math.round(3 + rng(date + 'm') * 2), recovery: Math.round(60 + rng(date + 'r') * 35) }
    }),
    measurements: [
      { date: iso(subDays(new Date(), 60)), chest: 98, waist: 82, arms: 35 },
      { date: iso(subDays(new Date(), 30)), chest: 100, waist: 80, arms: 36 },
      { date: todayISO(), chest: 101, waist: 79, arms: 36.5 },
    ],
  }
}

function buildFinance() {
  const cats = ['Income', 'Food', 'Subscriptions', 'Business', 'Transport', 'Books']
  const transactions = Array.from({ length: 30 }, (_, i) => {
    const date = iso(subDays(new Date(), i))
    const isIncome = i % 9 === 0
    const cat = isIncome ? 'Income' : cats[1 + (i % 5)]
    const amount = isIncome ? 25000 + Math.round(rng(date) * 8000) : -(150 + Math.round(rng(date) * 1200))
    return { id: uid('tx'), date, label: isIncome ? 'QuantReflex revenue' : cat + ' expense', amount, category: cat }
  })
  return {
    transactions,
    subscriptions: [
      { id: uid('sub'), name: 'Firebase Blaze', amount: 800, cycle: 'monthly' as const },
      { id: uid('sub'), name: 'Notion', amount: 400, cycle: 'monthly' as const },
      { id: uid('sub'), name: 'Coursera Plus', amount: 3999, cycle: 'yearly' as const },
      { id: uid('sub'), name: 'ChatGPT Plus', amount: 1700, cycle: 'monthly' as const },
    ],
    savings: 210000,
    monthlyBurn: 18000,
  }
}

function buildDayLogs() {
  return Array.from({ length: 40 }, (_, i) => {
    const date = iso(subDays(new Date(), i))
    return { date, mood: Math.round(2 + rng(date + 'mood') * 3), productivity: Math.round(40 + rng(date + 'prod') * 58), note: '' }
  })
}

function buildVision() {
  const data: [string, string, string, string][] = [
    ['IIM Ahmedabad', 'The dream campus', 'MBA', '🎓'],
    ['QuantReflex HQ', 'A real office, a real team', 'Business', '🏢'],
    ['Sub-12% body fat', 'Lean, strong, disciplined', 'Fitness', '💪'],
    ['₹1 Cr / year', 'Financial freedom', 'Wealth', '💰'],
    ['Speak on stage', 'Confident public speaker', 'Growth', '🎤'],
    ['100k QuantReflex users', 'India’s #1 aptitude app', 'Business', '📈'],
  ]
  return data.map(([title, caption, category, emoji]) => ({ id: uid('v'), title, caption, category, emoji }))
}
