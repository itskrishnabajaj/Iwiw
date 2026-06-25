import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storage as storageService } from '@/lib/storage/StorageService'
import { freshData, DATA_VERSION } from '@/lib/seed'
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
  Institute,
  PipelineStage,
  Course,
  JournalEntry,
  QuickNote,
  VisionItem,
  MockTest,
  Settings,
} from '@/lib/types'

const id = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`

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
  deleteTask: (taskId: string) => void

  // Habits
  toggleHabit: (habitId: string, date: ISODate) => void
  addHabit: (h: Pick<Habit, 'name' | 'area' | 'icon' | 'targetPerWeek'>) => void
  deleteHabit: (habitId: string) => void

  // Goals
  updateGoal: (goalId: string, patch: Partial<Goal>) => void
  addGoal: (g: Omit<Goal, 'id' | 'done' | 'progress'> & { progress?: number }) => void

  // MBA
  logStudy: (hours: number, questions: number, focusScore: number, library: boolean) => void
  addMock: (m: Omit<MockTest, 'id'>) => void
  bumpTopic: (topic: string, delta: number) => void

  // QuantReflex
  addQRItem: (i: Omit<QRItem, 'id'>) => void
  moveQRItem: (itemId: string, status: QRStatus) => void
  deleteQRItem: (itemId: string) => void
  toggleChecklist: (cid: string) => void

  // CRM
  addInstitute: (i: Omit<Institute, 'id'>) => void
  moveInstitute: (instId: string, stage: PipelineStage) => void
  updateInstitute: (instId: string, patch: Partial<Institute>) => void
  deleteInstitute: (instId: string) => void

  // Learning
  updateCourse: (cid: string, patch: Partial<Course>) => void
  addCourse: (c: Omit<Course, 'id'>) => void

  // Gym
  addWeight: (weight: number) => void

  // Finance
  addTransaction: (label: string, amount: number, category: string) => void

  // Journal
  addJournal: (j: Omit<JournalEntry, 'id' | 'date'>) => void

  // Notes
  addNote: (text: string) => void
  deleteNote: (noteId: string) => void

  // Vision
  addVision: (v: Omit<VisionItem, 'id'>) => void

  // Settings
  updateSettings: (patch: Partial<Settings>) => void

  // Achievements
  markUnlocked: (ids: string[]) => void
  clearUnlockToast: () => void
  clearLevelUp: () => void

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
    (set) => ({
      ...freshData(),
      hydrated: false,
      lastLevel: 0,
      pendingLevelUp: null,
      newlyUnlocked: [],

      addXP: (amount, reason, area, skillId) =>
        set((s) => {
          applyXP(s, amount, reason, area, skillId)
          return { xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),

      toggleTask: (taskId) =>
        set((s) => {
          const tasks = s.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
          const t = tasks.find((x) => x.id === taskId)!
          if (t.done) applyXP(s, t.xp, `Task: ${t.title}`, t.area)
          return { tasks, xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),

      addTask: (t) =>
        set((s) => ({ tasks: [...s.tasks, { ...t, id: id('t'), done: false, date: todayISO() }] })),

      deleteTask: (taskId) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) })),

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
          return { habits, xpEvents: [...s.xpEvents] }
        }),

      addHabit: (h) =>
        set((s) => ({
          habits: [
            ...s.habits,
            { ...h, id: id('h'), log: {}, createdAt: todayISO() },
          ],
        })),

      deleteHabit: (habitId) => set((s) => ({ habits: s.habits.filter((h) => h.id !== habitId) })),

      updateGoal: (goalId, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === goalId ? { ...g, ...patch } : g)) })),

      addGoal: (g) =>
        set((s) => ({ goals: [...s.goals, { ...g, id: id('g'), done: false, progress: g.progress ?? 0 }] })),

      logStudy: (hours, questions, focusScore, library) =>
        set((s) => {
          const date = todayISO()
          const logs = s.mba.studyLogs.filter((l) => l.date !== date)
          logs.push({ date, hours, questions, focusScore, library })
          applyXP(s, Math.round(hours * 10 + questions), 'Study session logged', 'mba', 'sk_quant')
          return { mba: { ...s.mba, studyLogs: logs }, xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),

      addMock: (m) =>
        set((s) => {
          applyXP(s, 80, `Mock: ${m.name}`, 'mba', 'sk_quant')
          return { mba: { ...s.mba, mocks: [...s.mba.mocks, { ...m, id: id('mock') }] }, xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),

      bumpTopic: (topic, delta) =>
        set((s) => ({
          mba: {
            ...s.mba,
            topics: s.mba.topics.map((t) =>
              t.topic === topic ? { ...t, mastery: Math.max(0, Math.min(100, t.mastery + delta)) } : t,
            ),
          },
        })),

      addQRItem: (i) => set((s) => ({ qr: { ...s.qr, items: [...s.qr.items, { ...i, id: id('qr') }] } })),
      moveQRItem: (itemId, status) =>
        set((s) => ({ qr: { ...s.qr, items: s.qr.items.map((i) => (i.id === itemId ? { ...i, status } : i)) } })),
      deleteQRItem: (itemId) => set((s) => ({ qr: { ...s.qr, items: s.qr.items.filter((i) => i.id !== itemId) } })),
      toggleChecklist: (cid) =>
        set((s) => ({ qr: { ...s.qr, checklist: s.qr.checklist.map((c) => (c.id === cid ? { ...c, done: !c.done } : c)) } })),

      addInstitute: (i) => set((s) => ({ institutes: [...s.institutes, { ...i, id: id('inst') }] })),
      moveInstitute: (instId, stage) =>
        set((s) => {
          const institutes = s.institutes.map((i) => (i.id === instId ? { ...i, stage } : i))
          if (stage === 'partner') applyXP(s, 150, 'New partnership!', 'crm', 'sk_sales')
          else applyXP(s, 20, 'Outreach progress', 'crm', 'sk_sales')
          return { institutes, xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),
      updateInstitute: (instId, patch) =>
        set((s) => ({ institutes: s.institutes.map((i) => (i.id === instId ? { ...i, ...patch } : i)) })),
      deleteInstitute: (instId) => set((s) => ({ institutes: s.institutes.filter((i) => i.id !== instId) })),

      updateCourse: (cid, patch) =>
        set((s) => ({ courses: s.courses.map((c) => (c.id === cid ? { ...c, ...patch } : c)) })),
      addCourse: (c) => set((s) => ({ courses: [...s.courses, { ...c, id: id('crs') }] })),

      addWeight: (weight) =>
        set((s) => ({ gym: { ...s.gym, weights: [...s.gym.weights, { date: todayISO(), weight }] } })),

      addTransaction: (label, amount, category) =>
        set((s) => ({
          finance: { ...s.finance, transactions: [{ id: id('tx'), date: todayISO(), label, amount, category }, ...s.finance.transactions] },
        })),

      addJournal: (j) =>
        set((s) => {
          applyXP(s, 15, 'Daily journal', 'personal', 'sk_disc')
          return { journal: [{ ...j, id: id('j'), date: todayISO() }, ...s.journal], xpEvents: [...s.xpEvents], skills: [...s.skills] }
        }),

      addNote: (text) => set((s) => ({ notes: [{ id: id('n'), text, ts: Date.now() }, ...s.notes] })),
      deleteNote: (noteId) => set((s) => ({ notes: s.notes.filter((n) => n.id !== noteId) })),

      addVision: (v) => set((s) => ({ vision: [...s.vision, { ...v, id: id('v') }] })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      markUnlocked: (ids) =>
        set((s) => {
          const next = { ...s.unlockedAchievements }
          const fresh: string[] = []
          for (const aid of ids) {
            if (!next[aid]) {
              next[aid] = Date.now()
              fresh.push(aid)
            }
          }
          return { unlockedAchievements: next, newlyUnlocked: fresh.length ? fresh : s.newlyUnlocked }
        }),
      clearUnlockToast: () => set({ newlyUnlocked: [] }),
      clearLevelUp: () => set({ pendingLevelUp: null }),

      resetData: () => set({ ...freshData(), hydrated: true, lastLevel: 0, pendingLevelUp: null, newlyUnlocked: [] }),
    }),
    {
      name: 'personal-os-v1',
      version: DATA_VERSION,
      // All persistence flows through StorageService: validation, migration,
      // backup snapshots and corruption recovery happen inside the adapter.
      storage: createJSONStorage(() => storageService.createZustandStorage()),
      partialize: (s) => {
        // exclude transient UI flags from persistence
        const { hydrated: _h, pendingLevelUp: _p, newlyUnlocked: _n, ...rest } = s
        return rest
      },
      onRehydrateStorage: () => () => {
        // runs after state is restored (or on fresh start)
        useAppStore.setState({ hydrated: true })
      },
    },
  ),
)
