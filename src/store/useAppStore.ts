import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storage as storageService } from '@/lib/storage/StorageService'
import { emptyData, exampleData, DATA_VERSION } from '@/lib/seed'
import { todayISO } from '@/lib/dates'
import type {
  AppData,
  AreaKey,
  Task,
  Habit,
  Goal,
  ISODate,
  QRItem,
  QRStatus,
  Milestone,
  ChecklistItem,
  Feedback,
  Institute,
  PipelineStage,
  Course,
  JournalEntry,
  VisionItem,
  MockTest,
  TopicStat,
  StudyLog,
  Workout,
  PR,
  GymDaily,
  Measurement,
  Transaction,
  Subscription,
  DayLog,
  Skill,
  PersonalState,
  Settings,
} from '@/lib/types'

const id = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`

// ---- generic list helpers (id-keyed) --------------------------------------
type WithId = { id: string; archived?: boolean; archivedAt?: number; order?: number; example?: boolean }
const updId = <T extends WithId>(arr: T[], itemId: string, patch: Partial<T>): T[] =>
  arr.map((x) => (x.id === itemId ? { ...x, ...patch } : x))
const rmId = <T extends WithId>(arr: T[], itemId: string): T[] => arr.filter((x) => x.id !== itemId)
const archId = <T extends WithId>(arr: T[], itemId: string): T[] =>
  arr.map((x) => (x.id === itemId ? { ...x, archived: true, archivedAt: Date.now() } : x))
const restId = <T extends WithId>(arr: T[], itemId: string): T[] =>
  arr.map((x) => (x.id === itemId ? { ...x, archived: false, archivedAt: undefined } : x))
const dupId = <T extends WithId>(arr: T[], itemId: string, prefix: string): T[] => {
  const o = arr.find((x) => x.id === itemId)
  if (!o) return arr
  const copy = { ...o, id: id(prefix), example: undefined, archived: false, archivedAt: undefined } as T
  const idx = arr.findIndex((x) => x.id === itemId)
  return [...arr.slice(0, idx + 1), copy, ...arr.slice(idx + 1)]
}
const reorderIds = <T extends WithId>(arr: T[], ids: string[]): T[] =>
  arr.map((x) => {
    const i = ids.indexOf(x.id)
    return i >= 0 ? { ...x, order: i } : x
  })

// ---- date-keyed helpers ----------------------------------------------------
type WithDate = { date: string; archived?: boolean; example?: boolean }
const updDate = <T extends WithDate>(arr: T[], date: string, patch: Partial<T>): T[] =>
  arr.map((x) => (x.date === date ? { ...x, ...patch } : x))
const rmDate = <T extends WithDate>(arr: T[], date: string): T[] => arr.filter((x) => x.date !== date)

// Drop example-tagged items but keep everything the user created.
const real = <T extends { example?: boolean }>(arr: T[]): T[] => arr.filter((x) => !x.example)

export interface AppStore extends AppData {
  hydrated: boolean
  lastLevel: number
  pendingLevelUp: number | null
  newlyUnlocked: string[]

  // XP
  addXP: (amount: number, reason: string, area: AreaKey, skillId?: string) => void

  // Tasks
  toggleTask: (taskId: string) => void
  addTask: (t: Omit<Task, 'id' | 'done' | 'date'>) => void
  updateTask: (taskId: string, patch: Partial<Task>) => void
  deleteTask: (taskId: string) => void
  archiveTask: (taskId: string) => void
  restoreTask: (taskId: string) => void
  duplicateTask: (taskId: string) => void
  reorderTasks: (ids: string[]) => void

  // Habits
  toggleHabit: (habitId: string, date: ISODate) => void
  addHabit: (h: Pick<Habit, 'name' | 'area' | 'icon' | 'targetPerWeek'>) => void
  updateHabit: (habitId: string, patch: Partial<Habit>) => void
  deleteHabit: (habitId: string) => void
  archiveHabit: (habitId: string) => void
  restoreHabit: (habitId: string) => void
  reorderHabits: (ids: string[]) => void

  // Goals
  updateGoal: (goalId: string, patch: Partial<Goal>) => void
  addGoal: (g: Omit<Goal, 'id' | 'done' | 'progress'> & { progress?: number }) => void
  deleteGoal: (goalId: string) => void
  archiveGoal: (goalId: string) => void
  restoreGoal: (goalId: string) => void
  duplicateGoal: (goalId: string) => void
  reorderGoals: (ids: string[]) => void

  // MBA
  logStudy: (hours: number, questions: number, focusScore: number, library: boolean) => void
  updateStudyLog: (date: ISODate, patch: Partial<StudyLog>) => void
  deleteStudyLog: (date: ISODate) => void
  addMock: (m: Omit<MockTest, 'id'>) => void
  updateMock: (mockId: string, patch: Partial<MockTest>) => void
  deleteMock: (mockId: string) => void
  archiveMock: (mockId: string) => void
  restoreMock: (mockId: string) => void
  bumpTopic: (topic: string, delta: number) => void
  addTopic: (t: Omit<TopicStat, 'mastery' | 'questionsSolved'> & { mastery?: number; questionsSolved?: number }) => void
  updateTopic: (topic: string, patch: Partial<TopicStat>) => void
  deleteTopic: (topic: string) => void
  updateMBA: (patch: Partial<Pick<AppData['mba'], 'pyqsSolved' | 'questionBankSolved' | 'revisionCycles' | 'monthlyTarget' | 'weeklyPlan'>>) => void

  // QuantReflex
  addQRItem: (i: Omit<QRItem, 'id'>) => void
  moveQRItem: (itemId: string, status: QRStatus) => void
  updateQRItem: (itemId: string, patch: Partial<QRItem>) => void
  deleteQRItem: (itemId: string) => void
  archiveQRItem: (itemId: string) => void
  restoreQRItem: (itemId: string) => void
  reorderQRItems: (ids: string[]) => void
  toggleChecklist: (cid: string) => void
  addChecklist: (label: string, group: string) => void
  updateChecklist: (cid: string, patch: Partial<ChecklistItem>) => void
  deleteChecklist: (cid: string) => void
  addMilestone: (m: Omit<Milestone, 'id'>) => void
  updateMilestone: (mid: string, patch: Partial<Milestone>) => void
  toggleMilestone: (mid: string) => void
  deleteMilestone: (mid: string) => void
  addFeedback: (f: Omit<Feedback, 'id'>) => void
  updateFeedback: (fid: string, patch: Partial<Feedback>) => void
  deleteFeedback: (fid: string) => void
  updateQRMetrics: (patch: Partial<Pick<AppData['qr'], 'downloads' | 'users' | 'revenue'>>) => void

  // CRM
  addInstitute: (i: Omit<Institute, 'id'>) => void
  moveInstitute: (instId: string, stage: PipelineStage) => void
  updateInstitute: (instId: string, patch: Partial<Institute>) => void
  deleteInstitute: (instId: string) => void
  archiveInstitute: (instId: string) => void
  restoreInstitute: (instId: string) => void

  // Learning
  updateCourse: (cid: string, patch: Partial<Course>) => void
  addCourse: (c: Omit<Course, 'id'>) => void
  deleteCourse: (cid: string) => void
  archiveCourse: (cid: string) => void
  restoreCourse: (cid: string) => void
  duplicateCourse: (cid: string) => void
  reorderCourses: (ids: string[]) => void

  // Gym
  addWeight: (weight: number) => void
  updateWeight: (date: ISODate, weight: number) => void
  deleteWeight: (date: ISODate) => void
  addWorkout: (w: Omit<Workout, 'id'>) => void
  updateWorkout: (wid: string, patch: Partial<Workout>) => void
  deleteWorkout: (wid: string) => void
  addPR: (p: Omit<PR, 'id'>) => void
  updatePR: (pid: string, patch: Partial<PR>) => void
  deletePR: (pid: string) => void
  upsertGymDaily: (date: ISODate, patch: Partial<GymDaily>) => void
  deleteGymDaily: (date: ISODate) => void
  addMeasurement: (m: Measurement) => void
  updateMeasurement: (date: ISODate, patch: Partial<Measurement>) => void
  deleteMeasurement: (date: ISODate) => void

  // Finance
  addTransaction: (label: string, amount: number, category: string) => void
  updateTransaction: (txId: string, patch: Partial<Transaction>) => void
  deleteTransaction: (txId: string) => void
  addSubscription: (s: Omit<Subscription, 'id'>) => void
  updateSubscription: (sid: string, patch: Partial<Subscription>) => void
  deleteSubscription: (sid: string) => void
  updateFinance: (patch: Partial<Pick<AppData['finance'], 'savings' | 'monthlyBurn'>>) => void

  // Personal
  setMetric: (kind: keyof PersonalState, date: ISODate, value: number) => void
  deleteMetric: (kind: keyof PersonalState, date: ISODate) => void

  // Journal
  addJournal: (j: Omit<JournalEntry, 'id' | 'date'>) => void
  updateJournal: (jid: string, patch: Partial<JournalEntry>) => void
  deleteJournal: (jid: string) => void
  archiveJournal: (jid: string) => void
  restoreJournal: (jid: string) => void

  // Day logs
  upsertDayLog: (date: ISODate, patch: Partial<DayLog>) => void
  deleteDayLog: (date: ISODate) => void

  // Notes
  addNote: (text: string) => void
  updateNote: (noteId: string, text: string) => void
  deleteNote: (noteId: string) => void

  // Vision
  addVision: (v: Omit<VisionItem, 'id'>) => void
  updateVision: (vid: string, patch: Partial<VisionItem>) => void
  deleteVision: (vid: string) => void
  archiveVision: (vid: string) => void
  restoreVision: (vid: string) => void
  duplicateVision: (vid: string) => void
  reorderVision: (ids: string[]) => void

  // Skills / domains (reference data)
  addSkill: (s: Pick<Skill, 'name' | 'area' | 'icon'>) => void
  updateSkill: (skillId: string, patch: Partial<Pick<Skill, 'name' | 'icon' | 'area'>>) => void
  deleteSkill: (skillId: string) => void

  // Settings
  updateSettings: (patch: Partial<Settings>) => void

  // Achievements
  markUnlocked: (ids: string[]) => void
  clearUnlockToast: () => void
  clearLevelUp: () => void

  // Sample data
  loadSampleData: () => void
  removeSampleData: () => void
  hasSampleData: () => boolean

  resetData: () => void
}

function applyXP(state: AppData, amount: number, reason: string, area: AreaKey, skillId?: string) {
  state.xpEvents.push({ id: id('xp'), ts: Date.now(), amount, reason, area, skillId })
  if (skillId) {
    const sk = state.skills.find((s) => s.id === skillId)
    if (sk) sk.xp += amount
  }
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...emptyData(),
      hydrated: false,
      lastLevel: 0,
      pendingLevelUp: null,
      newlyUnlocked: [],

      addXP: (amount, reason, area, skillId) =>
        set((s) => {
          applyXP(s, amount, reason, area, skillId)
          return { xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),

      // ---- Tasks ----
      toggleTask: (taskId) =>
        set((s) => {
          const tasks = s.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
          const t = tasks.find((x) => x.id === taskId)!
          if (t.done) applyXP(s, t.xp, `Task: ${t.title}`, t.area)
          return { tasks, xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),
      addTask: (t) =>
        set((s) => ({ tasks: [...s.tasks, { ...t, id: id('t'), done: false, date: todayISO() }] })),
      updateTask: (taskId, patch) => set((s) => ({ tasks: updId(s.tasks, taskId, patch) })),
      deleteTask: (taskId) => set((s) => ({ tasks: rmId(s.tasks, taskId) })),
      archiveTask: (taskId) => set((s) => ({ tasks: archId(s.tasks, taskId) })),
      restoreTask: (taskId) => set((s) => ({ tasks: restId(s.tasks, taskId) })),
      duplicateTask: (taskId) => set((s) => ({ tasks: dupId(s.tasks, taskId, 't') })),
      reorderTasks: (ids) => set((s) => ({ tasks: reorderIds(s.tasks, ids) })),

      // ---- Habits ----
      toggleHabit: (habitId, date) =>
        set((s) => {
          const habits = s.habits.map((h) => {
            if (h.id !== habitId) return h
            const log = { ...h.log }
            if (log[date]) delete log[date]
            else log[date] = true
            return { ...h, log }
          })
          const h = habits.find((x) => x.id === habitId)!
          if (h.log[date]) applyXP(s, 12, `Habit: ${h.name}`, h.area)
          return { habits, xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),
      addHabit: (h) =>
        set((s) => ({ habits: [...s.habits, { ...h, id: id('h'), log: {}, createdAt: todayISO() }] })),
      updateHabit: (habitId, patch) => set((s) => ({ habits: updId(s.habits, habitId, patch) })),
      deleteHabit: (habitId) => set((s) => ({ habits: rmId(s.habits, habitId) })),
      archiveHabit: (habitId) => set((s) => ({ habits: archId(s.habits, habitId) })),
      restoreHabit: (habitId) => set((s) => ({ habits: restId(s.habits, habitId) })),
      reorderHabits: (ids) => set((s) => ({ habits: reorderIds(s.habits, ids) })),

      // ---- Goals ----
      updateGoal: (goalId, patch) => set((s) => ({ goals: updId(s.goals, goalId, patch) })),
      addGoal: (g) =>
        set((s) => ({ goals: [...s.goals, { ...g, id: id('g'), done: false, progress: g.progress ?? 0 }] })),
      deleteGoal: (goalId) =>
        set((s) => {
          // Re-parent children to the deleted goal's parent so none are orphaned.
          const g = s.goals.find((x) => x.id === goalId)
          const newParent = g?.parentId
          return {
            goals: rmId(s.goals, goalId).map((x) => (x.parentId === goalId ? { ...x, parentId: newParent } : x)),
          }
        }),
      archiveGoal: (goalId) => set((s) => ({ goals: archId(s.goals, goalId) })),
      restoreGoal: (goalId) => set((s) => ({ goals: restId(s.goals, goalId) })),
      duplicateGoal: (goalId) => set((s) => ({ goals: dupId(s.goals, goalId, 'g') })),
      reorderGoals: (ids) => set((s) => ({ goals: reorderIds(s.goals, ids) })),

      // ---- MBA ----
      logStudy: (hours, questions, focusScore, library) =>
        set((s) => {
          const date = todayISO()
          const logs = s.mba.studyLogs.filter((l) => l.date !== date)
          logs.push({ date, hours, questions, focusScore, library })
          applyXP(s, Math.round(hours * 10 + questions), 'Study session logged', 'mba', 'sk_quant')
          return { mba: { ...s.mba, studyLogs: logs }, xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),
      updateStudyLog: (date, patch) =>
        set((s) => ({ mba: { ...s.mba, studyLogs: updDate(s.mba.studyLogs, date, patch) } })),
      deleteStudyLog: (date) =>
        set((s) => ({ mba: { ...s.mba, studyLogs: rmDate(s.mba.studyLogs, date) } })),
      addMock: (m) =>
        set((s) => {
          applyXP(s, 80, `Mock: ${m.name}`, 'mba', 'sk_quant')
          return { mba: { ...s.mba, mocks: [...s.mba.mocks, { ...m, id: id('mock') }] }, xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),
      updateMock: (mockId, patch) => set((s) => ({ mba: { ...s.mba, mocks: updId(s.mba.mocks, mockId, patch) } })),
      deleteMock: (mockId) => set((s) => ({ mba: { ...s.mba, mocks: rmId(s.mba.mocks, mockId) } })),
      archiveMock: (mockId) => set((s) => ({ mba: { ...s.mba, mocks: archId(s.mba.mocks, mockId) } })),
      restoreMock: (mockId) => set((s) => ({ mba: { ...s.mba, mocks: restId(s.mba.mocks, mockId) } })),
      bumpTopic: (topic, delta) =>
        set((s) => ({
          mba: {
            ...s.mba,
            topics: s.mba.topics.map((t) =>
              t.topic === topic ? { ...t, mastery: Math.max(0, Math.min(100, t.mastery + delta)) } : t,
            ),
          },
        })),
      addTopic: (t) =>
        set((s) => ({
          mba: { ...s.mba, topics: [...s.mba.topics, { mastery: 0, questionsSolved: 0, ...t }] },
        })),
      updateTopic: (topic, patch) =>
        set((s) => ({ mba: { ...s.mba, topics: s.mba.topics.map((t) => (t.topic === topic ? { ...t, ...patch } : t)) } })),
      deleteTopic: (topic) =>
        set((s) => ({ mba: { ...s.mba, topics: s.mba.topics.filter((t) => t.topic !== topic) } })),
      updateMBA: (patch) => set((s) => ({ mba: { ...s.mba, ...patch } })),

      // ---- QuantReflex ----
      addQRItem: (i) => set((s) => ({ qr: { ...s.qr, items: [...s.qr.items, { ...i, id: id('qr') }] } })),
      moveQRItem: (itemId, status) => set((s) => ({ qr: { ...s.qr, items: updId(s.qr.items, itemId, { status }) } })),
      updateQRItem: (itemId, patch) => set((s) => ({ qr: { ...s.qr, items: updId(s.qr.items, itemId, patch) } })),
      deleteQRItem: (itemId) => set((s) => ({ qr: { ...s.qr, items: rmId(s.qr.items, itemId) } })),
      archiveQRItem: (itemId) => set((s) => ({ qr: { ...s.qr, items: archId(s.qr.items, itemId) } })),
      restoreQRItem: (itemId) => set((s) => ({ qr: { ...s.qr, items: restId(s.qr.items, itemId) } })),
      reorderQRItems: (ids) => set((s) => ({ qr: { ...s.qr, items: reorderIds(s.qr.items, ids) } })),
      toggleChecklist: (cid) =>
        set((s) => ({ qr: { ...s.qr, checklist: s.qr.checklist.map((c) => (c.id === cid ? { ...c, done: !c.done } : c)) } })),
      addChecklist: (label, group) =>
        set((s) => ({ qr: { ...s.qr, checklist: [...s.qr.checklist, { id: id('c'), label, group, done: false }] } })),
      updateChecklist: (cid, patch) => set((s) => ({ qr: { ...s.qr, checklist: updId(s.qr.checklist, cid, patch) } })),
      deleteChecklist: (cid) => set((s) => ({ qr: { ...s.qr, checklist: rmId(s.qr.checklist, cid) } })),
      addMilestone: (m) => set((s) => ({ qr: { ...s.qr, milestones: [...s.qr.milestones, { ...m, id: id('ms') }] } })),
      updateMilestone: (mid, patch) => set((s) => ({ qr: { ...s.qr, milestones: updId(s.qr.milestones, mid, patch) } })),
      toggleMilestone: (mid) =>
        set((s) => ({ qr: { ...s.qr, milestones: s.qr.milestones.map((m) => (m.id === mid ? { ...m, done: !m.done } : m)) } })),
      deleteMilestone: (mid) => set((s) => ({ qr: { ...s.qr, milestones: rmId(s.qr.milestones, mid) } })),
      addFeedback: (f) => set((s) => ({ qr: { ...s.qr, feedback: [...s.qr.feedback, { ...f, id: id('fb') }] } })),
      updateFeedback: (fid, patch) => set((s) => ({ qr: { ...s.qr, feedback: updId(s.qr.feedback, fid, patch) } })),
      deleteFeedback: (fid) => set((s) => ({ qr: { ...s.qr, feedback: rmId(s.qr.feedback, fid) } })),
      updateQRMetrics: (patch) => set((s) => ({ qr: { ...s.qr, ...patch } })),

      // ---- CRM ----
      addInstitute: (i) => set((s) => ({ institutes: [...s.institutes, { ...i, id: id('inst') }] })),
      moveInstitute: (instId, stage) =>
        set((s) => {
          const institutes = updId(s.institutes, instId, { stage })
          if (stage === 'partner') applyXP(s, 150, 'New partnership!', 'crm', 'sk_sales')
          else applyXP(s, 20, 'Outreach progress', 'crm', 'sk_sales')
          return { institutes, xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),
      updateInstitute: (instId, patch) => set((s) => ({ institutes: updId(s.institutes, instId, patch) })),
      deleteInstitute: (instId) => set((s) => ({ institutes: rmId(s.institutes, instId) })),
      archiveInstitute: (instId) => set((s) => ({ institutes: archId(s.institutes, instId) })),
      restoreInstitute: (instId) => set((s) => ({ institutes: restId(s.institutes, instId) })),

      // ---- Learning ----
      updateCourse: (cid, patch) => set((s) => ({ courses: updId(s.courses, cid, patch) })),
      addCourse: (c) => set((s) => ({ courses: [...s.courses, { ...c, id: id('crs') }] })),
      deleteCourse: (cid) => set((s) => ({ courses: rmId(s.courses, cid) })),
      archiveCourse: (cid) => set((s) => ({ courses: archId(s.courses, cid) })),
      restoreCourse: (cid) => set((s) => ({ courses: restId(s.courses, cid) })),
      duplicateCourse: (cid) => set((s) => ({ courses: dupId(s.courses, cid, 'crs') })),
      reorderCourses: (ids) => set((s) => ({ courses: reorderIds(s.courses, ids) })),

      // ---- Gym ----
      addWeight: (weight) =>
        set((s) => ({ gym: { ...s.gym, weights: [...s.gym.weights.filter((w) => w.date !== todayISO()), { date: todayISO(), weight }] } })),
      updateWeight: (date, weight) => set((s) => ({ gym: { ...s.gym, weights: updDate(s.gym.weights, date, { weight }) } })),
      deleteWeight: (date) => set((s) => ({ gym: { ...s.gym, weights: rmDate(s.gym.weights, date) } })),
      addWorkout: (w) =>
        set((s) => {
          applyXP(s, 40, `Workout: ${w.name}`, 'gym', 'sk_fit')
          return { gym: { ...s.gym, workouts: [{ ...w, id: id('w') }, ...s.gym.workouts] }, xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),
      updateWorkout: (wid, patch) => set((s) => ({ gym: { ...s.gym, workouts: updId(s.gym.workouts, wid, patch) } })),
      deleteWorkout: (wid) => set((s) => ({ gym: { ...s.gym, workouts: rmId(s.gym.workouts, wid) } })),
      addPR: (p) => set((s) => ({ gym: { ...s.gym, prs: [{ ...p, id: id('pr') }, ...s.gym.prs] } })),
      updatePR: (pid, patch) => set((s) => ({ gym: { ...s.gym, prs: updId(s.gym.prs, pid, patch) } })),
      deletePR: (pid) => set((s) => ({ gym: { ...s.gym, prs: rmId(s.gym.prs, pid) } })),
      upsertGymDaily: (date, patch) =>
        set((s) => {
          const exists = s.gym.daily.some((d) => d.date === date)
          const daily = exists
            ? updDate(s.gym.daily, date, patch)
            : [{ date, sleep: 7, water: 3, protein: 120, calories: 2200, mood: 3, recovery: 70, ...patch }, ...s.gym.daily]
          return { gym: { ...s.gym, daily } }
        }),
      deleteGymDaily: (date) => set((s) => ({ gym: { ...s.gym, daily: rmDate(s.gym.daily, date) } })),
      addMeasurement: (m) =>
        set((s) => ({ gym: { ...s.gym, measurements: [...s.gym.measurements.filter((x) => x.date !== m.date), m] } })),
      updateMeasurement: (date, patch) => set((s) => ({ gym: { ...s.gym, measurements: updDate(s.gym.measurements, date, patch) } })),
      deleteMeasurement: (date) => set((s) => ({ gym: { ...s.gym, measurements: rmDate(s.gym.measurements, date) } })),

      // ---- Finance ----
      addTransaction: (label, amount, category) =>
        set((s) => ({
          finance: { ...s.finance, transactions: [{ id: id('tx'), date: todayISO(), label, amount, category }, ...s.finance.transactions] },
        })),
      updateTransaction: (txId, patch) => set((s) => ({ finance: { ...s.finance, transactions: updId(s.finance.transactions, txId, patch) } })),
      deleteTransaction: (txId) => set((s) => ({ finance: { ...s.finance, transactions: rmId(s.finance.transactions, txId) } })),
      addSubscription: (sub) => set((s) => ({ finance: { ...s.finance, subscriptions: [...s.finance.subscriptions, { ...sub, id: id('sub') }] } })),
      updateSubscription: (sid, patch) => set((s) => ({ finance: { ...s.finance, subscriptions: updId(s.finance.subscriptions, sid, patch) } })),
      deleteSubscription: (sid) => set((s) => ({ finance: { ...s.finance, subscriptions: rmId(s.finance.subscriptions, sid) } })),
      updateFinance: (patch) => set((s) => ({ finance: { ...s.finance, ...patch } })),

      // ---- Personal ----
      setMetric: (kind, date, value) =>
        set((s) => ({ personal: { ...s.personal, [kind]: { ...s.personal[kind], [date]: value } } })),
      deleteMetric: (kind, date) =>
        set((s) => {
          const m = { ...s.personal[kind] }
          delete m[date]
          return { personal: { ...s.personal, [kind]: m } }
        }),

      // ---- Journal ----
      addJournal: (j) =>
        set((s) => {
          applyXP(s, 15, 'Daily journal', 'personal', 'sk_disc')
          return { journal: [{ ...j, id: id('j'), date: todayISO() }, ...s.journal], xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),
      updateJournal: (jid, patch) => set((s) => ({ journal: updId(s.journal, jid, patch) })),
      deleteJournal: (jid) => set((s) => ({ journal: rmId(s.journal, jid) })),
      archiveJournal: (jid) => set((s) => ({ journal: archId(s.journal, jid) })),
      restoreJournal: (jid) => set((s) => ({ journal: restId(s.journal, jid) })),

      // ---- Day logs ----
      upsertDayLog: (date, patch) =>
        set((s) => {
          const exists = s.dayLogs.some((d) => d.date === date)
          const dayLogs = exists
            ? updDate(s.dayLogs, date, patch)
            : [{ date, mood: 3, productivity: 50, note: '', ...patch }, ...s.dayLogs]
          return { dayLogs }
        }),
      deleteDayLog: (date) => set((s) => ({ dayLogs: rmDate(s.dayLogs, date) })),

      // ---- Notes ----
      addNote: (text) => set((s) => ({ notes: [{ id: id('n'), text, ts: Date.now() }, ...s.notes] })),
      updateNote: (noteId, text) => set((s) => ({ notes: updId(s.notes, noteId, { text }) })),
      deleteNote: (noteId) => set((s) => ({ notes: rmId(s.notes, noteId) })),

      // ---- Vision ----
      addVision: (v) => set((s) => ({ vision: [...s.vision, { ...v, id: id('v') }] })),
      updateVision: (vid, patch) => set((s) => ({ vision: updId(s.vision, vid, patch) })),
      deleteVision: (vid) => set((s) => ({ vision: rmId(s.vision, vid) })),
      archiveVision: (vid) => set((s) => ({ vision: archId(s.vision, vid) })),
      restoreVision: (vid) => set((s) => ({ vision: restId(s.vision, vid) })),
      duplicateVision: (vid) => set((s) => ({ vision: dupId(s.vision, vid, 'v') })),
      reorderVision: (ids) => set((s) => ({ vision: reorderIds(s.vision, ids) })),

      // ---- Skills / domains ----
      addSkill: (sk) => set((s) => ({ skills: [...s.skills, { ...sk, id: id('sk'), xp: 0 }] })),
      updateSkill: (skillId, patch) => set((s) => ({ skills: updId<Skill>(s.skills, skillId, patch) })),
      deleteSkill: (skillId) =>
        set((s) => ({
          skills: rmId(s.skills, skillId),
          // Detach any xp events so they no longer point at a missing skill.
          xpEvents: s.xpEvents.map((e) => (e.skillId === skillId ? { ...e, skillId: undefined } : e)),
        })),

      // ---- Settings ----
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      // ---- Achievements ----
      markUnlocked: (ids) =>
        set((s) => {
          const fresh = ids.filter((aid) => !s.unlockedAchievements[aid])
          if (fresh.length === 0) return s
          const next = { ...s.unlockedAchievements }
          const ts = Date.now()
          for (const aid of fresh) next[aid] = ts
          return { unlockedAchievements: next, newlyUnlocked: fresh }
        }),
      clearUnlockToast: () => set({ newlyUnlocked: [] }),
      clearLevelUp: () => set({ pendingLevelUp: null }),

      // ---- Sample data (opt-in showcase) ----
      hasSampleData: () => {
        const s = get()
        return (
          s.xpEvents.some((e) => e.example) ||
          s.tasks.some((t) => t.example) ||
          s.mba.mocks.some((m) => m.example) ||
          s.gym.workouts.some((w) => w.example) ||
          s.finance.transactions.some((t) => t.example)
        )
      },
      loadSampleData: () =>
        set((s) => {
          const ex = exampleData()
          return {
            skills: s.skills.map((sk) => {
              const e = ex.skills.find((x) => x.id === sk.id)
              return e ? { ...sk, xp: e.xp } : sk
            }),
            xpEvents: [...real(s.xpEvents), ...ex.xpEvents],
            tasks: [...real(s.tasks), ...ex.tasks],
            habits: [...real(s.habits), ...ex.habits],
            goals: [...real(s.goals), ...ex.goals],
            mba: {
              ...ex.mba,
              mocks: [...real(s.mba.mocks), ...ex.mba.mocks],
              topics: [...real(s.mba.topics), ...ex.mba.topics],
              studyLogs: [...real(s.mba.studyLogs), ...ex.mba.studyLogs],
            },
            qr: {
              ...ex.qr,
              items: [...real(s.qr.items), ...ex.qr.items],
              milestones: [...real(s.qr.milestones), ...ex.qr.milestones],
              checklist: [...real(s.qr.checklist), ...ex.qr.checklist],
              feedback: [...real(s.qr.feedback), ...ex.qr.feedback],
            },
            institutes: [...real(s.institutes), ...ex.institutes],
            courses: [...real(s.courses), ...ex.courses],
            gym: {
              weights: [...real(s.gym.weights), ...ex.gym.weights],
              workouts: [...real(s.gym.workouts), ...ex.gym.workouts],
              prs: [...real(s.gym.prs), ...ex.gym.prs],
              daily: [...real(s.gym.daily), ...ex.gym.daily],
              measurements: [...real(s.gym.measurements), ...ex.gym.measurements],
            },
            finance: {
              ...ex.finance,
              transactions: [...real(s.finance.transactions), ...ex.finance.transactions],
              subscriptions: [...real(s.finance.subscriptions), ...ex.finance.subscriptions],
            },
            personal: ex.personal,
            journal: [...real(s.journal), ...ex.journal],
            dayLogs: [...real(s.dayLogs), ...ex.dayLogs],
            notes: [...real(s.notes), ...ex.notes],
            vision: [...real(s.vision), ...ex.vision],
          }
        }),
      removeSampleData: () =>
        set((s) => {
          const empty = emptyData()
          const realEvents = real(s.xpEvents)
          return {
            // Recompute each domain's XP from the user's REAL ledger only.
            skills: s.skills.map((sk) => ({
              ...sk,
              xp: realEvents.filter((e) => e.skillId === sk.id).reduce((a, e) => a + e.amount, 0),
            })),
            xpEvents: realEvents,
            tasks: real(s.tasks),
            habits: real(s.habits),
            goals: real(s.goals),
            mba: {
              ...empty.mba,
              mocks: real(s.mba.mocks),
              topics: real(s.mba.topics),
              studyLogs: real(s.mba.studyLogs),
            },
            qr: {
              ...empty.qr,
              items: real(s.qr.items),
              milestones: real(s.qr.milestones),
              checklist: real(s.qr.checklist),
              feedback: real(s.qr.feedback),
            },
            institutes: real(s.institutes),
            courses: real(s.courses),
            gym: {
              weights: real(s.gym.weights),
              workouts: real(s.gym.workouts),
              prs: real(s.gym.prs),
              daily: real(s.gym.daily),
              measurements: real(s.gym.measurements),
            },
            finance: {
              ...empty.finance,
              transactions: real(s.finance.transactions),
              subscriptions: real(s.finance.subscriptions),
            },
            personal: empty.personal,
            journal: real(s.journal),
            dayLogs: real(s.dayLogs),
            notes: real(s.notes),
            vision: real(s.vision),
          }
        }),

      resetData: () => set({ ...emptyData(), hydrated: true, lastLevel: 0, pendingLevelUp: null, newlyUnlocked: [] }),
    }),
    {
      name: 'personal-os-v1',
      version: DATA_VERSION,
      storage: createJSONStorage(() => storageService.createZustandStorage()),
      partialize: (s) => {
        const { hydrated: _h, pendingLevelUp: _p, newlyUnlocked: _n, ...rest } = s
        return rest
      },
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hydrated: true })
      },
    },
  ),
)
