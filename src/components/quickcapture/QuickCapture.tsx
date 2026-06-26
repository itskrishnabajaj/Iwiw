import { useEffect, useRef, useState, type RefObject } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAppStore, type AppStore } from '@/store/useAppStore'
import { usePrefs } from '@/hooks/usePrefs'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select, Segmented } from '@/components/ui/primitives'
import { todayISO, iso } from '@/lib/dates'
import { addDays } from 'date-fns'
import { AREA_META } from '@/store/selectors'
import type { AreaKey } from '@/lib/types'

// ============================================================================
// Quick Capture — the fastest way to record anything from any screen, then
// return to what you were doing. The FAB auto-hides on scroll-down. Tap → sheet
// with minimal fields + smart defaults; long-press → your most-used captures.
// All writes go through the SAME store actions the modules use (single source of
// truth — no parallel CRUD). Per-type drafts survive accidental dismissal.
// ============================================================================

type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'segmented'
interface Field {
  name: string
  label: string
  type: FieldType
  options?: (s: AppStore) => { label: string; value: string }[]
  def?: (s: AppStore) => string
  placeholder?: string
  required?: boolean
  full?: boolean
}
interface Capture {
  key: string
  label: string
  icon: string
  fields: Field[]
  submit: (v: Record<string, string>, s: AppStore) => boolean // false = invalid
  enabled?: (s: AppStore) => boolean
  disabledHint?: string
}

// time-of-day → study/task block
const blockNow = (): string => {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'
}
const AREA_OPTS = () => (Object.keys(AREA_META) as AreaKey[]).map((k) => ({ label: AREA_META[k].label, value: k }))

const CAPTURES: Capture[] = [
  {
    key: 'task', label: 'Task', icon: '☑', fields: [
      { name: 'title', label: 'Task', type: 'text', required: true, full: true, placeholder: 'What needs doing?' },
      { name: 'block', label: 'Block', type: 'segmented', def: blockNow, options: () => [{ label: 'AM', value: 'morning' }, { label: 'Noon', value: 'afternoon' }, { label: 'Eve', value: 'evening' }, { label: 'Night', value: 'night' }] },
      { name: 'area', label: 'Area', type: 'select', def: () => 'personal', options: AREA_OPTS },
    ], submit: (v, s) => { if (!v.title?.trim()) return false; s.addTask({ title: v.title.trim(), block: v.block as never, area: v.area as AreaKey, xp: 25, priority: false }); return true },
  },
  {
    key: 'note', label: 'Note', icon: '🗒', fields: [{ name: 'text', label: 'Note', type: 'textarea', required: true, full: true, placeholder: 'Capture a thought…' }],
    submit: (v, s) => { if (!v.text?.trim()) return false; s.addNote(v.text.trim()); return true },
  },
  {
    key: 'journal', label: 'Journal', icon: '✍', fields: [
      { name: 'wentWell', label: 'Reflection', type: 'textarea', required: true, full: true, placeholder: 'How did today go?' },
      { name: 'mood', label: 'Mood', type: 'segmented', def: () => '4', options: () => ['1', '2', '3', '4', '5'].map((n) => ({ label: ['😞', '😕', '😐', '🙂', '😄'][+n - 1], value: n })) },
    ], submit: (v, s) => { if (!v.wentWell?.trim()) return false; s.addJournal({ wentWell: v.wentWell.trim(), didntGoWell: '', lessons: '', gratitude: '', ideas: '', mood: +v.mood || 4 }); return true },
  },
  {
    key: 'study', label: 'Study session', icon: '📚', fields: [
      { name: 'hours', label: 'Hours', type: 'number', def: () => '1' },
      { name: 'questions', label: 'Questions', type: 'number', def: () => '0' },
    ], submit: (v, s) => { s.logStudy(+v.hours || 0, +v.questions || 0, 80, false); return true },
  },
  {
    key: 'mock', label: 'Mock result', icon: '🎯', fields: [
      { name: 'name', label: 'Mock', type: 'text', required: true, full: true, placeholder: 'e.g. AIMCAT 9' },
      { name: 'percentile', label: 'Percentile', type: 'number', def: () => '85' },
    ], submit: (v, s) => { if (!v.name?.trim()) return false; s.addMock({ name: v.name.trim(), date: todayISO(), kind: 'full', percentile: +v.percentile || 0, accuracy: 70, attempted: 60, correct: 45 }); return true },
  },
  {
    key: 'workout', label: 'Workout', icon: '💪', fields: [
      { name: 'name', label: 'Workout', type: 'text', required: true, full: true, def: () => 'Workout', placeholder: 'Push / Pull / Legs…' },
      { name: 'volume', label: 'Volume (kg)', type: 'number', def: () => '0' },
      { name: 'duration', label: 'Minutes', type: 'number', def: () => '45' },
    ], submit: (v, s) => { if (!v.name?.trim()) return false; s.addWorkout({ date: todayISO(), name: v.name.trim(), volume: +v.volume || 0, duration: +v.duration || 0 }); return true },
  },
  {
    key: 'habit', label: 'Habit check-in', icon: '⟲', enabled: (s) => s.habits.some((h) => !h.archived), disabledHint: 'Add a habit first.', fields: [
      { name: 'habitId', label: 'Habit', type: 'select', full: true, options: (s) => s.habits.filter((h) => !h.archived).map((h) => ({ label: `${h.icon} ${h.name}`, value: h.id })), def: (s) => s.habits.find((h) => !h.archived)?.id ?? '' },
    ], submit: (v, s) => { if (!v.habitId) return false; s.toggleHabit(v.habitId, todayISO()); return true },
  },
  {
    key: 'expense', label: 'Expense', icon: '💸', fields: [
      { name: 'label', label: 'For', type: 'text', required: true, full: true, placeholder: 'What did you spend on?' },
      { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
      { name: 'category', label: 'Category', type: 'text', def: () => 'Food' },
    ], submit: (v, s) => { if (!v.label?.trim() || !v.amount) return false; s.addTransaction(v.label.trim(), -Math.abs(+v.amount), v.category?.trim() || 'Other'); return true },
  },
  {
    key: 'income', label: 'Income', icon: '💰', fields: [
      { name: 'label', label: 'Source', type: 'text', required: true, full: true, placeholder: 'Where from?' },
      { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
    ], submit: (v, s) => { if (!v.label?.trim() || !v.amount) return false; s.addTransaction(v.label.trim(), Math.abs(+v.amount), 'Income'); return true },
  },
  {
    key: 'goal', label: 'Goal', icon: '◎', fields: [
      { name: 'title', label: 'Goal', type: 'text', required: true, full: true, placeholder: 'What do you want to achieve?' },
      { name: 'horizon', label: 'Horizon', type: 'select', def: () => 'weekly', options: () => ['annual', 'quarterly', 'monthly', 'weekly', 'daily'].map((h) => ({ label: h, value: h })) },
      { name: 'area', label: 'Area', type: 'select', def: () => 'mba', options: AREA_OPTS },
    ], submit: (v, s) => { if (!v.title?.trim()) return false; s.addGoal({ title: v.title.trim(), horizon: v.horizon as never, area: v.area as AreaKey }); return true },
  },
  {
    key: 'crm', label: 'CRM follow-up', icon: '🤝', enabled: (s) => s.institutes.some((i) => !i.archived), disabledHint: 'Add an institute first.', fields: [
      { name: 'instituteId', label: 'Institute', type: 'select', full: true, options: (s) => s.institutes.filter((i) => !i.archived).map((i) => ({ label: i.name, value: i.id })), def: (s) => s.institutes.find((i) => !i.archived)?.id ?? '' },
      { name: 'date', label: 'Follow up on', type: 'text', def: () => iso(addDays(new Date(), 7)) },
    ], submit: (v, s) => { if (!v.instituteId) return false; s.updateInstitute(v.instituteId, { followUp: v.date }); return true },
  },
  {
    key: 'course', label: 'Course progress', icon: '🎓', enabled: (s) => s.courses.some((c) => !c.archived), disabledHint: 'Add a course first.', fields: [
      { name: 'courseId', label: 'Course', type: 'select', full: true, options: (s) => s.courses.filter((c) => !c.archived).map((c) => ({ label: `${c.title} (${c.progress}%)`, value: c.id })), def: (s) => s.courses.find((c) => !c.archived)?.id ?? '' },
    ], submit: (v, s) => { const c = s.courses.find((x) => x.id === v.courseId); if (!c) return false; s.updateCourse(c.id, { progress: Math.min(100, c.progress + 10), certificate: c.progress + 10 >= 100 ? true : c.certificate }); return true },
  },
  {
    key: 'qrIdea', label: 'QuantReflex idea', icon: '⚡', fields: [{ name: 'title', label: 'Idea', type: 'text', required: true, full: true, placeholder: 'A spark for QuantReflex…' }],
    submit: (v, s) => { if (!v.title?.trim()) return false; s.addQRItem({ title: v.title.trim(), type: 'idea', status: 'idea' }); return true },
  },
  {
    key: 'vision', label: 'Vision item', icon: '✧', fields: [{ name: 'title', label: 'Vision', type: 'text', required: true, full: true, placeholder: 'A future worth building…' }],
    submit: (v, s) => { if (!v.title?.trim()) return false; s.addVision({ title: v.title.trim(), caption: '', category: 'Vision', emoji: '🎯' }); return true },
  },
]
const BY_KEY = Object.fromEntries(CAPTURES.map((c) => [c.key, c]))

export function QuickCapture({ scrollRef }: { scrollRef: RefObject<HTMLElement> }) {
  const [prefs, setPrefs] = usePrefs()
  const [open, setOpen] = useState(false)
  const [popup, setPopup] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  // Per-type drafts survive dismissal (cleared only on successful save).
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({})
  const longPress = useRef<number | null>(null)
  const didLong = useRef(false)

  // Auto-hide on scroll-down, reveal on scroll-up.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let last = el.scrollTop
    let queued = false
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        const y = el.scrollTop
        if (y > last + 8 && y > 80) setHidden(true)
        else if (y < last - 8) setHidden(false)
        last = y
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollRef])

  const ordered = [...CAPTURES].sort((a, b) => (prefs.captureCounts[b.key] ?? 0) - (prefs.captureCounts[a.key] ?? 0))
  const topUsed = ordered.filter((c) => (prefs.captureCounts[c.key] ?? 0) > 0).slice(0, 6)
  const longPressList = (topUsed.length ? topUsed : CAPTURES.slice(0, 6))

  const openType = (key: string) => {
    const s = useAppStore.getState()
    const cap = BY_KEY[key]
    if (cap.enabled && !cap.enabled(s)) {
      toast(cap.disabledHint ?? 'Not available yet')
      return
    }
    if (!drafts[key]) {
      const init: Record<string, string> = {}
      for (const f of cap.fields) init[f.name] = f.def ? f.def(s) : ''
      setDrafts((d) => ({ ...d, [key]: init }))
    }
    setActive(key)
    setOpen(true)
    setPopup(false)
  }

  const save = () => {
    if (!active) return
    const cap = BY_KEY[active]
    const ok = cap.submit(drafts[active] ?? {}, useAppStore.getState())
    if (!ok) { toast.error('Fill the required field'); return }
    setPrefs({ captureCounts: { ...prefs.captureCounts, [cap.key]: (prefs.captureCounts[cap.key] ?? 0) + 1 } })
    setDrafts((d) => { const n = { ...d }; delete n[cap.key]; return n }) // clear this draft
    toast.success(`${cap.label} saved`)
    setActive(null)
    setOpen(false)
  }

  const startPress = () => {
    didLong.current = false
    longPress.current = window.setTimeout(() => { didLong.current = true; setPopup(true) }, 450)
  }
  const endPress = () => {
    if (longPress.current) { clearTimeout(longPress.current); longPress.current = null }
    if (!didLong.current) { setActive(null); setOpen(true) } // tap → full sheet
  }

  return (
    <>
      {/* FAB */}
      <motion.div
        className="fixed bottom-5 right-5 z-30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        animate={{ y: hidden ? 96 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      >
        <AnimatePresence>
          {popup && (
            <>
              <div className="fixed inset-0 -z-10" onClick={() => setPopup(false)} />
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} className="glass absolute bottom-16 right-0 w-52 overflow-hidden rounded-2xl border border-white/10 p-1 shadow-card">
                {longPressList.map((c) => (
                  <button key={c.key} onClick={() => openType(c.key)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/10">
                    <span className="w-5 text-center">{c.icon}</span>{c.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <button
          aria-label="Quick capture"
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={() => { if (longPress.current) { clearTimeout(longPress.current); longPress.current = null } }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-white shadow-glow transition active:scale-95"
        >
          ＋
        </button>
      </motion.div>

      {/* Sheet */}
      <Modal open={open} onClose={() => setOpen(false)} title={active ? BY_KEY[active].label : 'Quick capture'}>
        {!active ? (
          <div className="grid grid-cols-3 gap-2">
            {ordered.map((c) => (
              <button key={c.key} onClick={() => openType(c.key)} className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-center transition hover:bg-white/[0.07]">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-[11px] leading-tight text-white/70">{c.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <CaptureForm
            capture={BY_KEY[active]}
            values={drafts[active] ?? {}}
            onChange={(name, val) => setDrafts((d) => ({ ...d, [active]: { ...(d[active] ?? {}), [name]: val } }))}
            onBack={() => setActive(null)}
            onSave={save}
          />
        )}
      </Modal>
    </>
  )
}

function CaptureForm({ capture, values, onChange, onBack, onSave }: { capture: Capture; values: Record<string, string>; onChange: (n: string, v: string) => void; onBack: () => void; onSave: () => void }) {
  const s = useAppStore()
  const enterSave = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !(e.target as HTMLElement).matches('textarea')) onSave() }
  return (
    <div className="space-y-4" onKeyDown={enterSave}>
      <div className="grid grid-cols-2 gap-3">
        {capture.fields.map((f) => (
          <div key={f.name} className={f.full || f.type === 'textarea' ? 'col-span-2' : ''}>
            <label className="mb-1.5 block text-xs text-white/40">{f.label}</label>
            {f.type === 'textarea' ? (
              <Textarea rows={3} autoFocus placeholder={f.placeholder} value={values[f.name] ?? ''} onChange={(e) => onChange(f.name, e.target.value)} />
            ) : f.type === 'select' ? (
              <Select value={values[f.name] ?? ''} onChange={(e) => onChange(f.name, e.target.value)}>
                {f.options?.(s).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            ) : f.type === 'segmented' ? (
              <Segmented value={values[f.name] ?? ''} onChange={(v: string) => onChange(f.name, v)} options={f.options?.(s) ?? []} />
            ) : (
              <Input type={f.type === 'number' ? 'number' : 'text'} autoFocus={f.full} placeholder={f.placeholder} value={values[f.name] ?? ''} onChange={(e) => onChange(f.name, e.target.value)} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="ghost" onClick={onBack}>← All</Button>
        <Button onClick={onSave}>Save</Button>
      </div>
    </div>
  )
}
