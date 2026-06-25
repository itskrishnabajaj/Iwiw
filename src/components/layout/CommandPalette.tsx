import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { NAV } from './nav'
import { ACHIEVEMENTS } from '@/data/achievements'

interface Result {
  id: string
  label: string
  hint: string
  icon: string
  action: () => void
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const store = useAppStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    ;(window as unknown as { openPalette?: () => void }).openPalette = () => setOpen(true)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) setQ('')
  }, [open])

  const results = useMemo<Result[]>(() => {
    const go = (to: string) => () => {
      navigate(to)
      setOpen(false)
    }
    const all: Result[] = []
    NAV.forEach((n) => all.push({ id: 'nav-' + n.to, label: n.label, hint: 'Page', icon: n.icon, action: go(n.to) }))
    store.goals.forEach((g) => all.push({ id: g.id, label: g.title, hint: 'Goal · ' + g.horizon, icon: '◎', action: go('/goals') }))
    store.tasks.forEach((t) => all.push({ id: t.id, label: t.title, hint: 'Task', icon: '☉', action: go('/today') }))
    store.courses.forEach((c) => all.push({ id: c.id, label: c.title, hint: 'Course · ' + c.source, icon: '📚', action: go('/learning') }))
    store.institutes.forEach((i) => all.push({ id: i.id, label: i.name, hint: 'Coaching · ' + i.location, icon: '🤝', action: go('/crm') }))
    store.qr.items.forEach((i) => all.push({ id: i.id, label: i.title, hint: 'QuantReflex · ' + i.type, icon: '⚡', action: go('/quantreflex') }))
    store.journal.forEach((j) => all.push({ id: j.id, label: j.wentWell || 'Journal entry', hint: 'Journal · ' + j.date, icon: '✍', action: go('/journal') }))
    store.notes.forEach((n) => all.push({ id: n.id, label: n.text, hint: 'Note', icon: '🗒', action: go('/') }))
    ACHIEVEMENTS.forEach((a) => all.push({ id: a.id, label: a.title, hint: 'Achievement', icon: a.icon, action: go('/achievements') }))

    if (!q.trim()) return all.filter((r) => r.hint === 'Page')
    const ql = q.toLowerCase()
    return all.filter((r) => r.label.toLowerCase().includes(ql) || r.hint.toLowerCase().includes(ql)).slice(0, 24)
  }, [q, store, navigate])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.97, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="glass relative z-10 w-full max-w-xl overflow-hidden rounded-2xl shadow-card">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
              <span className="text-white/40">⌕</span>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search goals, tasks, courses, coachings, notes…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/30" />
              <kbd className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">ESC</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2 no-scrollbar">
              {results.length === 0 && <div className="px-3 py-8 text-center text-sm text-white/35">No results for “{q}”</div>}
              {results.map((r) => (
                <button key={r.id} onClick={r.action} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.06]">
                  <span className="w-5 text-center opacity-80">{r.icon}</span>
                  <span className="flex-1 truncate">{r.label}</span>
                  <span className="text-[11px] text-white/30">{r.hint}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
