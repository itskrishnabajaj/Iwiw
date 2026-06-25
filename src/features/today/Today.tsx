import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { todaysTasks, todayProgress, AREA_META } from '@/store/selectors'
import { GlassCard } from '@/components/ui/GlassCard'
import { Progress } from '@/components/ui/Progress'
import { SectionTitle, Tag, Input, Segmented } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { bigCelebrate } from '@/components/celebrate/confetti'
import { prettyDate } from '@/lib/dates'
import type { AreaKey, Block } from '@/lib/types'

const BLOCKS: { key: Block; label: string; icon: string; time: string }[] = [
  { key: 'morning', label: 'Morning', icon: '🌅', time: '5 AM – 12 PM' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️', time: '12 – 5 PM' },
  { key: 'evening', label: 'Evening', icon: '🌆', time: '5 – 9 PM' },
  { key: 'night', label: 'Night', icon: '🌙', time: '9 PM – late' },
]

export default function Today() {
  const s = useAppStore()
  const tasks = todaysTasks(s)
  const tp = todayProgress(s)
  const prevDone = useRef(tp.done)
  const [open, setOpen] = useState(false)

  // Celebrate when everything is completed
  useEffect(() => {
    if (tp.total > 0 && tp.done === tp.total && prevDone.current < tp.total) bigCelebrate()
    prevDone.current = tp.done
  }, [tp.done, tp.total])

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle
        title="Today"
        subtitle={`${prettyDate()} · your second brain`}
        action={<Button onClick={() => setOpen(true)}>＋ Add task</Button>}
      />

      <GlassCard hoverable={false} className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/45">Daily completion</div>
            <div className="text-3xl font-bold">
              {tp.done}<span className="text-white/30">/{tp.total}</span> <span className="text-base font-normal text-white/40">tasks</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-gradient">{tp.pct}%</div>
            {tp.pct === 100 && <div className="text-xs text-good">All done — legendary 🎉</div>}
          </div>
        </div>
        <Progress value={tp.pct} className="mt-4" height={12} />
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2">
        {BLOCKS.map((b) => {
          const list = tasks.filter((t) => t.block === b.key)
          const done = list.filter((t) => t.done).length
          return (
            <GlassCard key={b.key} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{b.icon}</span>
                  <div>
                    <div className="font-semibold">{b.label}</div>
                    <div className="text-[11px] text-white/35">{b.time}</div>
                  </div>
                </div>
                <span className="text-xs text-white/40">{done}/{list.length}</span>
              </div>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {list.map((t) => {
                    const meta = AREA_META[t.area]
                    return (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                      >
                        <button
                          onClick={() => s.toggleTask(t.id)}
                          className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
                          style={{ borderColor: t.done ? meta.color : 'rgba(255,255,255,0.2)', background: t.done ? meta.color : 'transparent' }}
                        >
                          {t.done && (
                            <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="12" height="12" viewBox="0 0 12 12" className="text-base-900">
                              <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </motion.svg>
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className={`truncate text-sm transition ${t.done ? 'text-white/35 line-through' : 'text-white/85'}`}>{t.title}</div>
                          <div className="mt-0.5 flex items-center gap-2">
                            {t.time && <span className="text-[10px] text-white/30">{t.time}</span>}
                            <Tag color={meta.color}>{meta.emoji} {meta.label}</Tag>
                            {t.priority && <span className="text-[10px] text-warn">★ priority</span>}
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-accent-soft">+{t.xp}</span>
                        <button onClick={() => s.deleteTask(t.id)} className="text-white/20 opacity-0 transition group-hover:opacity-100 hover:text-bad">×</button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                {list.length === 0 && <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-xs text-white/25">No tasks — a clear block to seize.</div>}
              </div>
            </GlassCard>
          )
        })}
      </div>

      <AddTaskModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function AddTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addTask = useAppStore((s) => s.addTask)
  const [title, setTitle] = useState('')
  const [block, setBlock] = useState<Block>('morning')
  const [area, setArea] = useState<AreaKey>('mba')
  const [xp, setXp] = useState(25)
  const [time, setTime] = useState('')

  const submit = () => {
    if (!title.trim()) return
    addTask({ title: title.trim(), block, area, xp, time: time || undefined, priority: false })
    setTitle('')
    setTime('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a task">
      <div className="space-y-4">
        <Input placeholder="What needs to get done?" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <div>
          <div className="mb-1.5 text-xs text-white/40">Time block</div>
          <Segmented value={block} onChange={setBlock} options={BLOCKS.map((b) => ({ label: b.label, value: b.key }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.5 text-xs text-white/40">Life area</div>
            <select value={area} onChange={(e) => setArea(e.target.value as AreaKey)} className="w-full rounded-xl border border-white/10 bg-base-700 px-3 py-2.5 text-sm outline-none">
              {Object.entries(AREA_META).map(([k, m]) => (
                <option key={k} value={k}>{m.emoji} {m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1.5 text-xs text-white/40">Time (optional)</div>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-xs text-white/40">XP reward: {xp}</div>
          <input type="range" min={5} max={100} step={5} value={xp} onChange={(e) => setXp(+e.target.value)} className="w-full accent-accent" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Add task</Button>
        </div>
      </div>
    </Modal>
  )
}
