import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { AREA_META } from '@/store/selectors'
import { GlassCard } from '@/components/ui/GlassCard'
import { Progress } from '@/components/ui/Progress'
import { SectionTitle, Tag, Input, EmptyState } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { goalProgress } from '@/lib/goals'
import type { AreaKey, Goal, GoalHorizon } from '@/lib/types'

const HORIZONS: GoalHorizon[] = ['annual', 'quarterly', 'monthly', 'weekly', 'daily']

export default function Goals() {
  const s = useAppStore()
  const [open, setOpen] = useState(false)
  const roots = useMemo(() => s.goals.filter((g) => !g.parentId), [s.goals])

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="Goals" subtitle="Annual ambitions that cascade down to today’s 25 questions." action={<Button onClick={() => setOpen(true)}>＋ New goal</Button>} />

      {roots.length === 0 ? (
        <EmptyState icon="◎" title="No goals yet" hint="Set an annual ambition and break it down to today." />
      ) : (
        <div className="space-y-4">
          {roots.map((g, i) => (
            <GoalNode key={g.id} goal={g} all={s.goals} depth={0} delay={i * 0.05} />
          ))}
        </div>
      )}

      <NewGoalModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function GoalNode({ goal, all, depth, delay = 0 }: { goal: Goal; all: Goal[]; depth: number; delay?: number }) {
  const s = useAppStore()
  const children = all.filter((g) => g.parentId === goal.id)
  const prog = goalProgress(goal, all)
  const meta = AREA_META[goal.area]
  const isLeaf = children.length === 0

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }} style={{ marginLeft: depth * 18 }}>
      <GlassCard className="p-4" hoverable={depth === 0} glow={depth === 0 ? meta.color : undefined}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {depth > 0 && <span className="text-white/20">↳</span>}
              <span className="truncate font-semibold">{goal.title}</span>
              <Tag color={meta.color}>{goal.horizon}</Tag>
            </div>
            <Progress value={prog} color={meta.color} className="mt-2.5" height={depth === 0 ? 10 : 7} />
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-black tabular-nums" style={{ color: meta.color }}>{prog}%</div>
            {goal.target && <div className="text-[11px] text-white/40">{goal.current}/{goal.target} {goal.unit}</div>}
          </div>
        </div>

        {isLeaf && goal.target && (
          <div className="mt-3 flex items-center gap-2">
            <button onClick={() => s.updateGoal(goal.id, { current: Math.max(0, (goal.current ?? 0) - 1) })} aria-label={`Decrease ${goal.title}`} className="h-9 w-9 rounded-lg bg-white/5 text-white/60 hover:bg-white/10">−</button>
            <button onClick={() => s.updateGoal(goal.id, { current: Math.min(goal.target!, (goal.current ?? 0) + 1) })} aria-label={`Increase ${goal.title}`} className="h-9 w-9 rounded-lg bg-accent/80 font-semibold">＋</button>
            <span className="text-xs text-white/35">log progress</span>
          </div>
        )}
        {isLeaf && !goal.target && (
          <div className="mt-3">
            <input type="range" min={0} max={100} value={goal.progress} onChange={(e) => s.updateGoal(goal.id, { progress: +e.target.value })} className="w-full accent-accent" />
          </div>
        )}
      </GlassCard>

      {children.length > 0 && (
        <div className="mt-3 space-y-3">
          {children.map((c) => (
            <GoalNode key={c.id} goal={c} all={all} depth={depth + 1} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

function NewGoalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useAppStore()
  const [title, setTitle] = useState('')
  const [horizon, setHorizon] = useState<GoalHorizon>('weekly')
  const [area, setArea] = useState<AreaKey>('mba')
  const [parentId, setParentId] = useState<string>('')

  const submit = () => {
    if (!title.trim()) return
    s.addGoal({ title: title.trim(), horizon, area, parentId: parentId || undefined })
    setTitle('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New goal">
      <div className="space-y-4">
        <Input placeholder="Goal title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.5 text-xs text-white/40">Horizon</div>
            <select value={horizon} onChange={(e) => setHorizon(e.target.value as GoalHorizon)} className="w-full rounded-xl border border-white/10 bg-base-700 px-3 py-2.5 text-sm outline-none">
              {HORIZONS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <div className="mb-1.5 text-xs text-white/40">Area</div>
            <select value={area} onChange={(e) => setArea(e.target.value as AreaKey)} className="w-full rounded-xl border border-white/10 bg-base-700 px-3 py-2.5 text-sm outline-none">
              {Object.entries(AREA_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-xs text-white/40">Parent goal (optional)</div>
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-base-700 px-3 py-2.5 text-sm outline-none">
            <option value="">— none (top-level) —</option>
            {s.goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Create goal</Button>
        </div>
      </div>
    </Modal>
  )
}
