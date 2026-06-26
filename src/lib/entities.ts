import type { AppData } from './types'

// ============================================================================
// Entity registry — the single source of truth for HOW each entity is deleted
// and where it lives. Drives the contextual deletion policy (disposable vs
// historical) and the Archive view, so behaviour is declared once.
//
//  - disposable: easily recreated → instant delete + Undo toast (no dialog)
//  - historical: a life record → trash ARCHIVES it (recoverable); permanent
//    deletion lives only in the Archive view, behind a confirm.
// ============================================================================

export type EntityClass = 'disposable' | 'historical'
export type EntityKind =
  | 'task' | 'note' | 'goal' | 'habit' | 'course' | 'vision' | 'qrItem'
  | 'subscription' | 'topic' | 'milestone' | 'checklist' | 'feedback'
  | 'journal' | 'mock' | 'studyLog' | 'workout' | 'pr' | 'weight'
  | 'gymDaily' | 'measurement' | 'transaction' | 'dayLog' | 'institute'

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface EntityDef {
  class: EntityClass
  label: string // singular, human readable
  module: string // for grouping in the Archive view
  key: 'id' | 'date' | 'topic' // identifying field
  // read the collection from app state
  get: (s: AppData) => any[]
  // produce a state patch that replaces the collection (handles nesting)
  patch: (s: AppData, arr: any[]) => Partial<AppData>
  // a short title for an item, shown in the Archive list
  title: (item: any) => string
}

const t = (v: unknown, fallback = 'Untitled') => (typeof v === 'string' && v.trim() ? v : fallback)

export const ENTITIES: Record<EntityKind, EntityDef> = {
  // -------- disposable (delete + undo) --------
  task: { class: 'disposable', label: 'Task', module: 'Today', key: 'id', get: (s) => s.tasks, patch: (_s, a) => ({ tasks: a as never }), title: (i) => t(i.title) },
  note: { class: 'disposable', label: 'Note', module: 'Notes', key: 'id', get: (s) => s.notes, patch: (_s, a) => ({ notes: a as never }), title: (i) => t(i.text) },
  goal: { class: 'disposable', label: 'Goal', module: 'Goals', key: 'id', get: (s) => s.goals, patch: (_s, a) => ({ goals: a as never }), title: (i) => t(i.title) },
  habit: { class: 'disposable', label: 'Habit', module: 'Habits', key: 'id', get: (s) => s.habits, patch: (_s, a) => ({ habits: a as never }), title: (i) => t(i.name) },
  course: { class: 'disposable', label: 'Course', module: 'Learning', key: 'id', get: (s) => s.courses, patch: (_s, a) => ({ courses: a as never }), title: (i) => t(i.title) },
  vision: { class: 'disposable', label: 'Vision', module: 'Vision', key: 'id', get: (s) => s.vision, patch: (_s, a) => ({ vision: a as never }), title: (i) => t(i.title) },
  qrItem: { class: 'disposable', label: 'QuantReflex item', module: 'QuantReflex', key: 'id', get: (s) => s.qr.items, patch: (s, a) => ({ qr: { ...s.qr, items: a as never } }), title: (i) => t(i.title) },
  subscription: { class: 'disposable', label: 'Subscription', module: 'Finance', key: 'id', get: (s) => s.finance.subscriptions, patch: (s, a) => ({ finance: { ...s.finance, subscriptions: a as never } }), title: (i) => t(i.name) },
  topic: { class: 'disposable', label: 'Topic', module: 'MBA', key: 'topic', get: (s) => s.mba.topics, patch: (s, a) => ({ mba: { ...s.mba, topics: a as never } }), title: (i) => t(i.topic) },
  milestone: { class: 'disposable', label: 'Milestone', module: 'QuantReflex', key: 'id', get: (s) => s.qr.milestones, patch: (s, a) => ({ qr: { ...s.qr, milestones: a as never } }), title: (i) => t(i.title) },
  checklist: { class: 'disposable', label: 'Launch task', module: 'QuantReflex', key: 'id', get: (s) => s.qr.checklist, patch: (s, a) => ({ qr: { ...s.qr, checklist: a as never } }), title: (i) => t(i.label) },
  feedback: { class: 'disposable', label: 'Feedback', module: 'QuantReflex', key: 'id', get: (s) => s.qr.feedback, patch: (s, a) => ({ qr: { ...s.qr, feedback: a as never } }), title: (i) => t(i.text) },

  // -------- historical (archive first) --------
  journal: { class: 'historical', label: 'Journal entry', module: 'Journal', key: 'id', get: (s) => s.journal, patch: (_s, a) => ({ journal: a as never }), title: (i) => t(i.date) },
  mock: { class: 'historical', label: 'Mock test', module: 'MBA', key: 'id', get: (s) => s.mba.mocks, patch: (s, a) => ({ mba: { ...s.mba, mocks: a as never } }), title: (i) => t(i.name) },
  studyLog: { class: 'historical', label: 'Study session', module: 'MBA', key: 'date', get: (s) => s.mba.studyLogs, patch: (s, a) => ({ mba: { ...s.mba, studyLogs: a as never } }), title: (i) => t(i.date) },
  workout: { class: 'historical', label: 'Workout', module: 'Gym', key: 'id', get: (s) => s.gym.workouts, patch: (s, a) => ({ gym: { ...s.gym, workouts: a as never } }), title: (i) => t(i.name) },
  pr: { class: 'historical', label: 'Personal record', module: 'Gym', key: 'id', get: (s) => s.gym.prs, patch: (s, a) => ({ gym: { ...s.gym, prs: a as never } }), title: (i) => t(i.lift) },
  weight: { class: 'historical', label: 'Weight entry', module: 'Gym', key: 'date', get: (s) => s.gym.weights, patch: (s, a) => ({ gym: { ...s.gym, weights: a as never } }), title: (i) => t(i.date) },
  gymDaily: { class: 'historical', label: 'Recovery day', module: 'Gym', key: 'date', get: (s) => s.gym.daily, patch: (s, a) => ({ gym: { ...s.gym, daily: a as never } }), title: (i) => t(i.date) },
  measurement: { class: 'historical', label: 'Measurement', module: 'Gym', key: 'date', get: (s) => s.gym.measurements, patch: (s, a) => ({ gym: { ...s.gym, measurements: a as never } }), title: (i) => t(i.date) },
  transaction: { class: 'historical', label: 'Transaction', module: 'Finance', key: 'id', get: (s) => s.finance.transactions, patch: (s, a) => ({ finance: { ...s.finance, transactions: a as never } }), title: (i) => t(i.label) },
  dayLog: { class: 'historical', label: 'Day log', module: 'Calendar', key: 'date', get: (s) => s.dayLogs, patch: (_s, a) => ({ dayLogs: a as never }), title: (i) => t(i.date) },
  institute: { class: 'historical', label: 'Institute', module: 'CRM', key: 'id', get: (s) => s.institutes, patch: (_s, a) => ({ institutes: a as never }), title: (i) => t(i.name) },
}

export const isHistorical = (kind: EntityKind) => ENTITIES[kind].class === 'historical'
