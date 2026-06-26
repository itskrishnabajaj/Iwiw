// ============================================================================
// Core domain types for Personal OS
// ============================================================================

export type AreaKey =
  | 'mba'
  | 'qr'
  | 'crm'
  | 'learn'
  | 'gym'
  | 'finance'
  | 'personal'

export type ISODate = string // YYYY-MM-DD

export interface Settings {
  name: string
  mission: string
  birthDate: ISODate
  catDate: ISODate
  cetDate: ISODate
  weatherCity: string
  weatherLat: number
  weatherLon: number
  reduceMotion: boolean
  units?: 'kg' | 'lbs'
}

// ---------------------------------------------------------------------------
// Entity lifecycle (Phase 7)
// ---------------------------------------------------------------------------
// `example` marks an item that came from the opt-in sample dataset, so the UI
// can badge it and "Remove sample data" can strip it. `archived`/`archivedAt`
// soft-delete (history isn't lost). `order` drives manual reordering.
export interface Lifecycle {
  example?: boolean
  archived?: boolean
  archivedAt?: number
  order?: number
}

// ---------------------------------------------------------------------------
// RPG / XP
// ---------------------------------------------------------------------------
export interface Skill {
  id: string
  name: string
  area: AreaKey
  xp: number
  icon: string
  example?: boolean
}

export interface XPEvent {
  id: string
  ts: number
  amount: number
  reason: string
  area: AreaKey
  skillId?: string
  example?: boolean
}

// ---------------------------------------------------------------------------
// Today / Tasks
// ---------------------------------------------------------------------------
export type Block = 'morning' | 'afternoon' | 'evening' | 'night'

export interface Task extends Lifecycle {
  id: string
  title: string
  block: Block
  area: AreaKey
  done: boolean
  xp: number
  time?: string // e.g. "07:00"
  priority?: boolean
  date: ISODate
}

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------
export interface Habit extends Lifecycle {
  id: string
  name: string
  area: AreaKey
  icon: string
  // map of ISODate -> completed
  log: Record<ISODate, boolean>
  createdAt: ISODate
  targetPerWeek: number
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------
export type GoalHorizon = 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'daily'

export interface Goal extends Lifecycle {
  id: string
  title: string
  area: AreaKey
  horizon: GoalHorizon
  parentId?: string
  progress: number // 0-100, used for leaf goals
  target?: number
  current?: number
  unit?: string
  due?: ISODate
  done: boolean
}

// ---------------------------------------------------------------------------
// MBA
// ---------------------------------------------------------------------------
export interface MockTest extends Lifecycle {
  id: string
  date: ISODate
  name: string
  kind: 'full' | 'sectional'
  section?: 'VARC' | 'DILR' | 'QA'
  percentile: number
  accuracy: number
  attempted: number
  correct: number
}

export interface TopicStat extends Lifecycle {
  topic: string
  section: 'VARC' | 'DILR' | 'QA'
  mastery: number // 0-100
  questionsSolved: number
}

export interface StudyLog extends Lifecycle {
  date: ISODate
  hours: number
  questions: number
  focusScore: number
  library: boolean
}

export interface MBAState {
  mocks: MockTest[]
  topics: TopicStat[]
  studyLogs: StudyLog[]
  pyqsSolved: number
  questionBankSolved: number
  revisionCycles: number
  weeklyPlan: string[]
  monthlyTarget: string
}

// ---------------------------------------------------------------------------
// QuantReflex
// ---------------------------------------------------------------------------
export type QRStatus = 'idea' | 'todo' | 'building' | 'done'
export interface QRItem extends Lifecycle {
  id: string
  title: string
  type: 'feature' | 'bug' | 'idea' | 'marketing'
  status: QRStatus
  notes?: string
}
export interface Milestone extends Lifecycle {
  id: string
  title: string
  date: ISODate
  done: boolean
}
export interface ChecklistItem extends Lifecycle {
  id: string
  label: string
  done: boolean
  group: string
}
export interface Feedback extends Lifecycle {
  id: string
  text: string
  author: string
  rating: number
}
export interface QRState {
  items: QRItem[]
  milestones: Milestone[]
  checklist: ChecklistItem[]
  downloads: number
  users: number
  revenue: number
  feedback: Feedback[]
}

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------
export type PipelineStage =
  | 'lead'
  | 'visited'
  | 'meeting'
  | 'proposal'
  | 'interested'
  | 'partner'

export interface Institute extends Lifecycle {
  id: string
  name: string
  location: string
  contact: string
  phone: string
  email: string
  whatsapp: string
  stage: PipelineStage
  probability: number
  followUp?: ISODate
  notes: string
}

// ---------------------------------------------------------------------------
// Learning
// ---------------------------------------------------------------------------
export interface Course extends Lifecycle {
  id: string
  title: string
  source: 'Coursera' | 'YouTube' | 'Book' | 'Podcast' | 'Article' | 'Paper'
  progress: number
  totalHours: number
  hoursInvested: number
  certificate: boolean
  notes: string
}

// ---------------------------------------------------------------------------
// Gym
// ---------------------------------------------------------------------------
export interface WeightEntry extends Lifecycle {
  date: ISODate
  weight: number
}
export interface Workout extends Lifecycle {
  id: string
  date: ISODate
  name: string
  volume: number
  duration: number
}
export interface PR extends Lifecycle {
  id: string
  lift: string
  value: number
  unit: string
  date: ISODate
}
export interface GymDaily extends Lifecycle {
  date: ISODate
  sleep: number
  water: number
  protein: number
  calories: number
  mood: number
  recovery: number
}
export interface Measurement extends Lifecycle {
  date: ISODate
  chest: number
  waist: number
  arms: number
}
export interface GymState {
  weights: WeightEntry[]
  workouts: Workout[]
  prs: PR[]
  daily: GymDaily[]
  measurements: Measurement[]
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------
export interface Transaction extends Lifecycle {
  id: string
  date: ISODate
  label: string
  amount: number // positive income, negative expense
  category: string
}
export interface Subscription extends Lifecycle {
  id: string
  name: string
  amount: number
  cycle: 'monthly' | 'yearly'
}
export interface FinanceState {
  transactions: Transaction[]
  subscriptions: Subscription[]
  savings: number
  monthlyBurn: number
}

// ---------------------------------------------------------------------------
// Personal growth
// ---------------------------------------------------------------------------
export interface PersonalState {
  meditationMinutes: Record<ISODate, number>
  deepWorkHours: Record<ISODate, number>
  screenTime: Record<ISODate, number>
  pagesRead: Record<ISODate, number>
}

// ---------------------------------------------------------------------------
// Journal & Calendar
// ---------------------------------------------------------------------------
export interface JournalEntry extends Lifecycle {
  id: string
  date: ISODate
  wentWell: string
  didntGoWell: string
  lessons: string
  gratitude: string
  ideas: string
  mood: number
}

export interface DayLog extends Lifecycle {
  date: ISODate
  mood: number
  productivity: number
  note: string
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  tier: AchievementTier
  hidden?: boolean // masked until unlocked
  // predicate evaluated against AppState snapshot
  check: (s: AppData) => { unlocked: boolean; progress: number }
}

// ---------------------------------------------------------------------------
// Notes / misc
// ---------------------------------------------------------------------------
export interface QuickNote extends Lifecycle {
  id: string
  text: string
  ts: number
}

export interface VisionItem extends Lifecycle {
  id: string
  title: string
  caption: string
  category: string
  image?: string // data url
  emoji: string
}

// ---------------------------------------------------------------------------
// Root persisted data
// ---------------------------------------------------------------------------
export interface AppData {
  version: number
  settings: Settings
  skills: Skill[]
  xpEvents: XPEvent[]
  tasks: Task[]
  habits: Habit[]
  goals: Goal[]
  mba: MBAState
  qr: QRState
  institutes: Institute[]
  courses: Course[]
  gym: GymState
  finance: FinanceState
  personal: PersonalState
  journal: JournalEntry[]
  dayLogs: DayLog[]
  unlockedAchievements: Record<string, number> // id -> ts
  notes: QuickNote[]
  vision: VisionItem[]
}
