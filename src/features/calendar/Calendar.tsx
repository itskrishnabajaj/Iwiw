import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionTitle } from '@/components/ui/primitives'
import { monthGrid, todayISO } from '@/lib/dates'
import { format } from 'date-fns'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MOOD = ['😴', '😐', '🙂', '😀', '🤩']

export default function Calendar() {
  const s = useAppStore()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(todayISO())

  const cells = useMemo(() => monthGrid(year, month), [year, month])
  const logMap = useMemo(() => new Map(s.dayLogs.map((d) => [d.date, d])), [s.dayLogs])
  const xpByDay = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of s.xpEvents) {
      const d = new Date(e.ts).toISOString().slice(0, 10)
      m.set(d, (m.get(d) || 0) + e.amount)
    }
    return m
  }, [s.xpEvents])

  const prev = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1) }

  const selLog = logMap.get(selected)
  const selXP = xpByDay.get(selected) || 0
  const selTasks = s.tasks.filter((t) => t.date === selected)

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="▦ Calendar" subtitle="Your year, day by day." />

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard hoverable={false} className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{format(new Date(year, month), 'MMMM yyyy')}</h2>
            <div className="flex gap-2">
              <button onClick={prev} className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10">‹</button>
              <button onClick={next} className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10">›</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((w) => <div key={w} className="pb-1 text-center text-[11px] text-white/35">{w}</div>)}
            {cells.map((c, i) => {
              if (!c) return <div key={i} />
              const xp = xpByDay.get(c) || 0
              const log = logMap.get(c)
              const isToday = c === todayISO()
              const isSel = c === selected
              const intensity = Math.min(1, xp / 300)
              return (
                <motion.button
                  key={c}
                  whileHover={{ scale: 1.06 }}
                  onClick={() => setSelected(c)}
                  className={`relative aspect-square rounded-xl border p-1.5 text-left text-xs transition ${isSel ? 'border-accent ring-1 ring-accent' : 'border-white/[0.06]'} ${isToday ? 'bg-accent/10' : ''}`}
                  style={{ background: xp > 0 && !isToday ? `rgba(124,92,255,${0.08 + intensity * 0.3})` : undefined }}
                >
                  <span className={`font-medium ${isToday ? 'text-accent-soft' : 'text-white/60'}`}>{+c.slice(8)}</span>
                  {log && <span className="absolute bottom-1 right-1 text-[10px]">{MOOD[log.mood - 1]}</span>}
                </motion.button>
              )
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-1 text-lg font-semibold">{format(new Date(selected), 'EEEE')}</h2>
          <div className="text-sm text-white/40">{format(new Date(selected), 'd MMMM yyyy')}</div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.03] p-3"><div className="text-[11px] text-white/40">XP earned</div><div className="text-xl font-bold text-accent-soft">{selXP}</div></div>
            <div className="rounded-xl bg-white/[0.03] p-3"><div className="text-[11px] text-white/40">Mood</div><div className="text-xl">{selLog ? MOOD[selLog.mood - 1] : '—'}</div></div>
            <div className="rounded-xl bg-white/[0.03] p-3"><div className="text-[11px] text-white/40">Productivity</div><div className="text-xl font-bold text-good">{selLog ? `${selLog.productivity}%` : '—'}</div></div>
            <div className="rounded-xl bg-white/[0.03] p-3"><div className="text-[11px] text-white/40">Tasks</div><div className="text-xl font-bold">{selTasks.length}</div></div>
          </div>

          {selTasks.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-xs uppercase tracking-wider text-white/35">Tasks</div>
              <div className="space-y-1.5">
                {selTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm text-white/70">
                    <span className={t.done ? 'text-good' : 'text-white/25'}>{t.done ? '✓' : '○'}</span>
                    <span className={t.done ? 'line-through text-white/40' : ''}>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
