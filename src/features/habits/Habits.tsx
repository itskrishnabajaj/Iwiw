import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { AREA_META, sortByOrder } from '@/store/selectors'
import { currentStreak, bestStreak, successRate, consistencyScore } from '@/lib/streaks'
import { lastNDates, todayISO } from '@/lib/dates'
import toast from 'react-hot-toast'
import { GlassCard } from '@/components/ui/GlassCard'
import { Ring } from '@/components/ui/Ring'
import { SectionTitle, Input, Segmented, EmptyState, ExampleBadge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CardActions } from '@/components/ui/CardActions'
import { useTrash } from '@/lib/useTrash'
import type { AreaKey, Habit } from '@/lib/types'

export default function Habits() {
  const s = useAppStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const today = todayISO()
  const habits = sortByOrder(s.habits.filter((h) => !h.archived))
  const move = (i: number, dir: -1 | 1) => {
    const ids = habits.map((h) => h.id)
    const j = i + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    s.reorderHabits(ids)
  }

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="Habits" subtitle="Not checkboxes — streaks, heatmaps and consistency you can feel." action={<Button onClick={() => setOpen(true)}>＋ New habit</Button>} />

      {habits.length === 0 ? (
        <EmptyState
          icon="⚡"
          title="Build your first habit"
          hint="Small daily wins compound into life-changing momentum. Track streaks and consistency for the routines that matter."
          action={<Button onClick={() => setOpen(true)}>＋ Create a habit</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {habits.map((h, i) => (
            <HabitCard
              key={h.id}
              habit={h}
              delay={i * 0.04}
              today={today}
              onEdit={() => setEditing(h)}
              onMoveUp={i > 0 ? () => move(i, -1) : undefined}
              onMoveDown={i < habits.length - 1 ? () => move(i, 1) : undefined}
            />
          ))}
        </div>
      )}

      <NewHabitModal open={open} onClose={() => setOpen(false)} />
      <EditHabitModal habit={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function HabitCard({ habit, delay, today, onEdit, onMoveUp, onMoveDown }: { habit: Habit; delay: number; today: string; onEdit: () => void; onMoveUp?: () => void; onMoveDown?: () => void }) {
  const s = useAppStore()
  const trash = useTrash()
  const meta = AREA_META[habit.area]
  const cur = currentStreak(habit.log)
  const best = bestStreak(habit.log)
  const rate = successRate(habit.log, habit.createdAt)
  const consistency = consistencyScore(habit.log)
  const doneToday = !!habit.log[today]
  const last30 = lastNDates(30)

  return (
    <GlassCard className="p-5" delay={delay} glow={meta.color}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: `${meta.color}1f` }}>{habit.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{habit.name}</span>
              {habit.example && <ExampleBadge />}
            </div>
            <div className="text-[11px] text-white/40">{meta.label} · {habit.targetPerWeek}×/week</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => s.toggleHabit(habit.id, today)}
            role="checkbox"
            aria-checked={doneToday}
            aria-label={`${doneToday ? 'Done today' : 'Mark done'}: ${habit.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-lg transition-colors"
            style={{ borderColor: doneToday ? meta.color : 'rgba(255,255,255,0.2)', background: doneToday ? meta.color : 'transparent', color: doneToday ? '#07080d' : 'rgba(255,255,255,0.4)' }}
          >
            {doneToday ? '✓' : '＋'}
          </motion.button>
          <CardActions
            label={`Actions for ${habit.name}`}
            actions={[
              { label: 'Edit', icon: '✎', onClick: onEdit },
              ...(onMoveUp ? [{ label: 'Move up', icon: '↑', onClick: onMoveUp }] : []),
              ...(onMoveDown ? [{ label: 'Move down', icon: '↓', onClick: onMoveDown }] : []),
              { label: 'Delete', icon: '🗑', danger: true, onClick: () => trash('habit', habit) },
            ]}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Mini label="Current" value={`${cur}🔥`} />
        <Mini label="Best" value={`${best}`} />
        <Mini label="Success" value={`${rate}%`} />
      </div>

      {/* monthly dots */}
      <div className="mt-4 flex flex-wrap gap-1">
        {last30.map((d) => (
          <div key={d} title={d} className="h-3.5 w-3.5 rounded-[4px] transition-transform hover:scale-125" style={{ background: habit.log[d] ? meta.color : 'rgba(255,255,255,0.06)', opacity: habit.log[d] ? 1 : 1 }} />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ring value={consistency} size={56} stroke={6} color={meta.color}>
            <span className="text-xs font-bold">{consistency}</span>
          </Ring>
          <div className="text-xs text-white/45">Consistency<br />score</div>
        </div>
        <div className="text-right text-[11px] text-white/30">{best > 0 ? `best ${best}🔥` : 'keep going'}</div>
      </div>
    </GlassCard>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-2.5 text-center">
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/35">{label}</div>
    </div>
  )
}

function NewHabitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addHabit = useAppStore((s) => s.addHabit)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('✨')
  const [area, setArea] = useState<AreaKey>('personal')
  const [target, setTarget] = useState<string>('7')
  const icons = ['✨', '📚', '💪', '🧘', '🌅', '💧', '📖', '⚡', '🏃', '🚫']

  const submit = () => {
    if (!name.trim()) return
    addHabit({ name: name.trim(), icon, area, targetPerWeek: +target })
    setName('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New habit">
      <div className="space-y-4">
        <Input placeholder="Habit name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <div>
          <div className="mb-1.5 text-xs text-white/40">Icon</div>
          <div className="flex flex-wrap gap-2">
            {icons.map((ic) => (
              <button key={ic} onClick={() => setIcon(ic)} className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${icon === ic ? 'bg-accent/30 ring-1 ring-accent' : 'bg-white/5'}`}>{ic}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-xs text-white/40">Life area</div>
          <Segmented value={area} onChange={setArea} options={(['mba', 'qr', 'gym', 'personal', 'learn'] as AreaKey[]).map((a) => ({ label: AREA_META[a].label.split(' ')[0], value: a }))} />
        </div>
        <div>
          <div className="mb-1.5 text-xs text-white/40">Target per week: {target}</div>
          <input type="range" min={1} max={7} value={target} onChange={(e) => setTarget(e.target.value)} className="w-full accent-accent" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Create</Button>
        </div>
      </div>
    </Modal>
  )
}

function EditHabitModal({ habit, onClose }: { habit: Habit | null; onClose: () => void }) {
  const updateHabit = useAppStore((s) => s.updateHabit)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('✨')
  const [area, setArea] = useState<AreaKey>('personal')
  const [target, setTarget] = useState('7')
  const icons = ['✨', '📚', '💪', '🧘', '🌅', '💧', '📖', '⚡', '🏃', '🚫']

  useEffect(() => {
    if (habit) { setName(habit.name); setIcon(habit.icon); setArea(habit.area); setTarget(String(habit.targetPerWeek)) }
  }, [habit])

  const submit = () => {
    if (!habit || !name.trim()) return
    updateHabit(habit.id, { name: name.trim(), icon, area, targetPerWeek: +target })
    onClose()
  }

  return (
    <Modal open={!!habit} onClose={onClose} title="Edit habit">
      <div className="space-y-4">
        <Input placeholder="Habit name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <div>
          <div className="mb-1.5 text-xs text-white/40">Icon</div>
          <div className="flex flex-wrap gap-2">
            {icons.map((ic) => (
              <button key={ic} onClick={() => setIcon(ic)} className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${icon === ic ? 'bg-accent/30 ring-1 ring-accent' : 'bg-white/5'}`}>{ic}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-xs text-white/40">Life area</div>
          <Segmented value={area} onChange={setArea} options={(['mba', 'qr', 'gym', 'personal', 'learn'] as AreaKey[]).map((a) => ({ label: AREA_META[a].label.split(' ')[0], value: a }))} />
        </div>
        <div>
          <div className="mb-1.5 text-xs text-white/40">Target per week: {target}</div>
          <input type="range" min={1} max={7} value={target} onChange={(e) => setTarget(e.target.value)} className="w-full accent-accent" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}
