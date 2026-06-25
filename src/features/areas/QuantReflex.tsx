import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { CountUp } from '@/components/ui/CountUp'
import { Progress } from '@/components/ui/Progress'
import { SectionTitle, Stat, Tag, Input } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { format, parseISO } from 'date-fns'
import type { QRStatus } from '@/lib/types'

const COLUMNS: { key: QRStatus; label: string; color: string }[] = [
  { key: 'idea', label: 'Ideas', color: '#a855f7' },
  { key: 'todo', label: 'To Do', color: '#fbbf24' },
  { key: 'building', label: 'Building', color: '#36e6e0' },
  { key: 'done', label: 'Shipped', color: '#34d399' },
]

const TYPE_EMOJI = { feature: '✨', bug: '🐛', idea: '💡', marketing: '📣' }

export default function QuantReflex() {
  const s = useAppStore()
  const [open, setOpen] = useState(false)
  const checklistGroups = [...new Set(s.qr.checklist.map((c) => c.group))]

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="⚡ QuantReflex" subtitle="India’s leading aptitude prep platform — in the making." action={<Button onClick={() => setOpen(true)}>＋ Item</Button>} />

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5" glow="#36e6e0"><Stat label="Active users" value={<CountUp value={s.qr.users} />} sub="goal 1,000" color="#36e6e0" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Downloads" value={<CountUp value={s.qr.downloads} />} color="#7c5cff" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Revenue" value={<CountUp value={s.qr.revenue} prefix="₹" />} color="#34d399" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Avg rating" value="4.7★" sub={`${s.qr.feedback.length} reviews`} color="#fbbf24" /></GlassCard>
      </div>

      {/* Board */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = s.qr.items.filter((i) => i.status === col.key)
          return (
            <div key={col.key} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold" style={{ color: col.color }}>{col.label}</span>
                <span className="text-xs text-white/30">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((i) => (
                  <motion.div key={i.id} layout className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm">{TYPE_EMOJI[i.type]} {i.title}</span>
                      <button onClick={() => s.deleteQRItem(i.id)} className="text-white/20 opacity-0 transition group-hover:opacity-100 hover:text-bad">×</button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Tag color={col.color}>{i.type}</Tag>
                      <div className="flex gap-1">
                        {COLUMNS.filter((c) => c.key !== i.status).map((c) => (
                          <button key={c.key} onClick={() => s.moveQRItem(i.id, c.key)} title={`Move to ${c.label}`} className="h-5 w-5 rounded text-[10px] text-white/40 hover:bg-white/10" style={{ color: c.color }}>
                            {c.key === 'done' ? '✓' : '→'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {items.length === 0 && <div className="px-2 py-4 text-center text-xs text-white/20">Empty</div>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Milestones + Checklists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Milestones</h2>
          <div className="relative space-y-4 pl-6">
            <div className="absolute left-[7px] top-1 h-full w-px bg-white/10" />
            {s.qr.milestones.map((m) => (
              <div key={m.id} className="relative">
                <div className="absolute -left-[22px] top-0.5 h-3.5 w-3.5 rounded-full border-2" style={{ borderColor: m.done ? '#34d399' : '#7c5cff', background: m.done ? '#34d399' : 'transparent' }} />
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${m.done ? 'text-white/80' : 'text-white/60'}`}>{m.title}</span>
                  <span className="text-[11px] text-white/35">{format(parseISO(m.date), 'd MMM yyyy')}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Launch checklists</h2>
          <div className="space-y-5">
            {checklistGroups.map((g) => {
              const items = s.qr.checklist.filter((c) => c.group === g)
              const done = items.filter((c) => c.done).length
              return (
                <div key={g}>
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold text-accent-soft">
                    <span>{g}</span><span className="text-xs text-white/40">{done}/{items.length}</span>
                  </div>
                  <Progress value={(done / items.length) * 100} className="mb-3" height={5} />
                  <div className="space-y-1.5">
                    {items.map((c) => (
                      <button key={c.id} onClick={() => s.toggleChecklist(c.id)} className="flex w-full items-center gap-2.5 text-left text-sm">
                        <span className="flex h-4 w-4 items-center justify-center rounded border-2 text-[10px]" style={{ borderColor: c.done ? '#34d399' : 'rgba(255,255,255,0.2)', background: c.done ? '#34d399' : 'transparent', color: '#07080d' }}>{c.done && '✓'}</span>
                        <span className={c.done ? 'text-white/40 line-through' : 'text-white/70'}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </div>

      {/* Feedback */}
      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">User feedback</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {s.qr.feedback.map((f) => (
            <div key={f.id} className="rounded-xl bg-white/[0.03] p-4">
              <div className="text-sm text-warn">{'★'.repeat(f.rating)}<span className="text-white/15">{'★'.repeat(5 - f.rating)}</span></div>
              <p className="mt-2 text-sm text-white/70">“{f.text}”</p>
              <div className="mt-2 text-[11px] text-white/35">— {f.author}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <AddItemModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function AddItemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addQRItem = useAppStore((s) => s.addQRItem)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'feature' | 'bug' | 'idea' | 'marketing'>('feature')

  return (
    <Modal open={open} onClose={onClose} title="New QuantReflex item">
      <div className="space-y-4">
        <Input placeholder="What is it?" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <div className="flex gap-2">
          {(['feature', 'bug', 'idea', 'marketing'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={`rounded-xl px-3 py-2 text-sm ${type === t ? 'bg-accent/30 ring-1 ring-accent' : 'bg-white/5 text-white/60'}`}>{TYPE_EMOJI[t]} {t}</button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (title.trim()) { addQRItem({ title: title.trim(), type, status: type === 'idea' ? 'idea' : 'todo' }); setTitle(''); onClose() } }}>Add</Button>
        </div>
      </div>
    </Modal>
  )
}
