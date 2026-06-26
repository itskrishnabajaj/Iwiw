import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { CountUp } from '@/components/ui/CountUp'
import { Ring } from '@/components/ui/Ring'
import { Progress } from '@/components/ui/Progress'
import { SectionTitle, Stat, Tag, Input, EmptyState, ExampleBadge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CardActions } from '@/components/ui/CardActions'
import { format, parseISO } from 'date-fns'
import { todayISO } from '@/lib/dates'
import type { QRItem, QRStatus } from '@/lib/types'

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
  const [editing, setEditing] = useState<QRItem | null>(null)
  const [metricsOpen, setMetricsOpen] = useState(false)
  const [msOpen, setMsOpen] = useState(false)
  const [clOpen, setClOpen] = useState(false)
  const [fbOpen, setFbOpen] = useState(false)

  const items = s.qr.items.filter((i) => !i.archived)
  const milestones = s.qr.milestones.filter((m) => !m.archived)
  const checklist = s.qr.checklist.filter((c) => !c.archived)
  const feedback = s.qr.feedback.filter((f) => !f.archived)
  const checklistGroups = [...new Set(checklist.map((c) => c.group))]

  const checklistDone = checklist.filter((c) => c.done).length
  const readiness = checklist.length ? Math.round((checklistDone / checklist.length) * 100) : 0
  const shipped = items.filter((i) => i.status === 'done').length
  const ideas = items.filter((i) => i.type === 'idea')
  const bugs = items.filter((i) => i.type === 'bug' && i.status !== 'done').length
  const userGoalPct = Math.min(100, Math.round((s.qr.users / 1000) * 100))
  const avgRating = feedback.length ? (feedback.reduce((a, f) => a + f.rating, 0) / feedback.length).toFixed(1) : '—'

  const fresh = items.length === 0 && milestones.length === 0 && checklist.length === 0 && feedback.length === 0 && s.qr.users === 0 && s.qr.downloads === 0

  if (fresh) {
    return (
      <div className="space-y-6 pt-2">
        <SectionTitle title="⚡ QuantReflex" subtitle="India’s leading aptitude prep platform — in the making." action={<Button onClick={() => setOpen(true)}>＋ Item</Button>} />
        <GlassCard hoverable={false} className="p-2">
          <EmptyState
            icon="⚡"
            title="Your startup command center"
            hint="Plan features, track bugs, log milestones, manage your launch checklist and record user feedback — all in one board."
            action={
              <>
                <Button onClick={() => setOpen(true)}>＋ Add a roadmap item</Button>
                <Button variant="glass" onClick={() => setMetricsOpen(true)}>Set metrics</Button>
              </>
            }
          />
        </GlassCard>
        <AddItemModal open={open} onClose={() => setOpen(false)} />
        <QRMetricsModal open={metricsOpen} onClose={() => setMetricsOpen(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="⚡ QuantReflex" subtitle="India’s leading aptitude prep platform — in the making." action={
        <div className="flex flex-wrap gap-2">
          <Button variant="glass" onClick={() => setMetricsOpen(true)}>Edit metrics</Button>
          <Button onClick={() => setOpen(true)}>＋ Item</Button>
        </div>
      } />

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5" glow="#36e6e0"><Stat label="Active users" value={<CountUp value={s.qr.users} />} sub={`${userGoalPct}% to 1,000 goal`} color="#36e6e0" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Downloads" value={<CountUp value={s.qr.downloads} />} color="#7c5cff" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Revenue" value={<CountUp value={s.qr.revenue} prefix="₹" />} color="#34d399" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Avg rating" value={`${avgRating}★`} sub={`${feedback.length} reviews`} color="#fbbf24" /></GlassCard>
      </div>

      {/* Launch readiness + growth */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="flex items-center gap-5 p-6" glow="#34d399">
          <Ring value={readiness} size={104} color="#34d399"><div className="text-center"><div className="text-2xl font-black">{readiness}%</div><div className="text-[10px] uppercase tracking-wider text-white/40">Ready</div></div></Ring>
          <div>
            <div className="text-sm font-semibold">Launch readiness</div>
            <p className="mt-1 text-xs text-white/45">{checklistDone}/{checklist.length} launch tasks complete across Play Store & Firebase.</p>
            {bugs > 0 && <p className="mt-1 text-xs text-bad">{bugs} open bug{bugs > 1 ? 's' : ''} to squash first.</p>}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="text-sm font-semibold">User growth to goal</div>
          <div className="mt-3 text-3xl font-black text-accent-cyan"><CountUp value={s.qr.users} /> <span className="text-base font-normal text-white/40">/ 1,000</span></div>
          <Progress value={userGoalPct} color="#36e6e0" className="mt-3" />
        </GlassCard>
        <GlassCard className="p-6">
          <div className="text-sm font-semibold">Build momentum</div>
          <div className="mt-3 flex gap-6">
            <div><div className="text-2xl font-black text-good">{shipped}</div><div className="text-xs text-white/40">shipped</div></div>
            <div><div className="text-2xl font-black text-accent-soft">{ideas.length}</div><div className="text-xs text-white/40">ideas in vault</div></div>
            <div><div className="text-2xl font-black text-bad">{bugs}</div><div className="text-xs text-white/40">open bugs</div></div>
          </div>
        </GlassCard>
      </div>

      {/* Board */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const colItems = items.filter((i) => i.status === col.key)
          return (
            <div key={col.key} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold" style={{ color: col.color }}>{col.label}</span>
                <span className="text-xs text-white/30">{colItems.length}</span>
              </div>
              <div className="space-y-2">
                {colItems.map((i) => (
                  <motion.div key={i.id} layout className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm">{TYPE_EMOJI[i.type]} {i.title}</span>
                      <CardActions label={`Actions for ${i.title}`} actions={[
                        { label: 'Edit', icon: '✎', onClick: () => setEditing(i) },
                        { label: 'Archive', icon: '📦', onClick: () => { s.archiveQRItem(i.id); toast('Item archived') } },
                        { label: 'Delete', icon: '🗑', danger: true, onClick: () => { s.deleteQRItem(i.id); toast('Item deleted') } },
                      ]} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Tag color={col.color}>{i.type}</Tag>
                        {i.example && <ExampleBadge />}
                      </div>
                      <div className="flex gap-1">
                        {COLUMNS.filter((c) => c.key !== i.status).map((c) => (
                          <button key={c.key} onClick={() => s.moveQRItem(i.id, c.key)} aria-label={`Move "${i.title}" to ${c.label}`} title={`Move to ${c.label}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-xs hover:bg-white/10" style={{ color: c.color }}>
                            {c.key === 'done' ? '✓' : '→'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {colItems.length === 0 && <div className="px-2 py-4 text-center text-xs text-white/20">Empty</div>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Milestones + Checklists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Milestones</h2>
            <Button size="sm" variant="glass" onClick={() => setMsOpen(true)}>＋</Button>
          </div>
          {milestones.length === 0 ? (
            <p className="text-sm text-white/35">No milestones yet — mark the moments that matter.</p>
          ) : (
          <div className="relative space-y-4 pl-6">
            <div className="absolute left-[7px] top-1 h-full w-px bg-white/10" />
            {milestones.map((m) => (
              <div key={m.id} className="group relative">
                <button onClick={() => s.toggleMilestone(m.id)} aria-label={`Toggle ${m.title}`} className="absolute -left-[22px] top-0.5 h-3.5 w-3.5 rounded-full border-2" style={{ borderColor: m.done ? '#34d399' : '#7c5cff', background: m.done ? '#34d399' : 'transparent' }} />
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm ${m.done ? 'text-white/80' : 'text-white/60'}`}>{m.title}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-white/35">{format(parseISO(m.date), 'd MMM yyyy')}</span>
                    <button onClick={() => { s.deleteMilestone(m.id); toast('Milestone removed') }} aria-label={`Delete ${m.title}`} className="px-1 text-white/30 opacity-0 transition hover:text-bad group-hover:opacity-100">×</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Launch checklists</h2>
            <Button size="sm" variant="glass" onClick={() => setClOpen(true)}>＋</Button>
          </div>
          {checklist.length === 0 ? (
            <p className="text-sm text-white/35">No launch tasks yet — add the steps to ship.</p>
          ) : (
          <div className="space-y-5">
            {checklistGroups.map((g) => {
              const gItems = checklist.filter((c) => c.group === g)
              const done = gItems.filter((c) => c.done).length
              return (
                <div key={g}>
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold text-accent-soft">
                    <span>{g}</span><span className="text-xs text-white/40">{done}/{gItems.length}</span>
                  </div>
                  <Progress value={(done / gItems.length) * 100} className="mb-3" height={5} />
                  <div className="space-y-1.5">
                    {gItems.map((c) => (
                      <div key={c.id} className="group flex items-center gap-2.5">
                        <button onClick={() => s.toggleChecklist(c.id)} role="checkbox" aria-checked={c.done} aria-label={c.label} className="flex flex-1 items-center gap-2.5 py-0.5 text-left text-sm">
                          <span className="flex h-4 w-4 items-center justify-center rounded border-2 text-[10px]" style={{ borderColor: c.done ? '#34d399' : 'rgba(255,255,255,0.2)', background: c.done ? '#34d399' : 'transparent', color: '#07080d' }}>{c.done && '✓'}</span>
                          <span className={c.done ? 'text-white/40 line-through' : 'text-white/70'}>{c.label}</span>
                        </button>
                        <button onClick={() => { s.deleteChecklist(c.id); toast('Task removed') }} aria-label={`Delete ${c.label}`} className="px-1 text-white/25 opacity-0 transition hover:text-bad group-hover:opacity-100">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          )}
        </GlassCard>
      </div>

      {/* Feedback */}
      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">User feedback</h2>
          <Button size="sm" variant="glass" onClick={() => setFbOpen(true)}>＋</Button>
        </div>
        {feedback.length === 0 ? (
          <p className="text-sm text-white/35">No feedback captured yet — log what your users tell you.</p>
        ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {feedback.map((f) => (
            <div key={f.id} className="group relative rounded-xl bg-white/[0.03] p-4">
              <div className="flex items-start justify-between">
                <div className="text-sm text-warn">{'★'.repeat(f.rating)}<span className="text-white/15">{'★'.repeat(5 - f.rating)}</span></div>
                <button onClick={() => { s.deleteFeedback(f.id); toast('Feedback removed') }} aria-label="Delete feedback" className="px-1 text-white/25 opacity-0 transition hover:text-bad group-hover:opacity-100">×</button>
              </div>
              <p className="mt-2 text-sm text-white/70">“{f.text}”</p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-white/35">— {f.author} {f.example && <ExampleBadge />}</div>
            </div>
          ))}
        </div>
        )}
      </GlassCard>

      <AddItemModal open={open} onClose={() => setOpen(false)} />
      <EditQRItemModal item={editing} onClose={() => setEditing(null)} />
      <QRMetricsModal open={metricsOpen} onClose={() => setMetricsOpen(false)} />
      <AddMilestoneModal open={msOpen} onClose={() => setMsOpen(false)} />
      <AddChecklistModal open={clOpen} onClose={() => setClOpen(false)} groups={checklistGroups} />
      <AddFeedbackModal open={fbOpen} onClose={() => setFbOpen(false)} />
    </div>
  )
}

function EditQRItemModal({ item, onClose }: { item: QRItem | null; onClose: () => void }) {
  if (!item) return null
  return <EditQRItemInner key={item.id} item={item} onClose={onClose} />
}

function EditQRItemInner({ item, onClose }: { item: QRItem; onClose: () => void }) {
  const updateQRItem = useAppStore((s) => s.updateQRItem)
  const [t, setT] = useState(item.title)
  const [ty, setTy] = useState<QRItem['type']>(item.type)
  const save = () => { if (t.trim()) { updateQRItem(item.id, { title: t.trim(), type: ty }); onClose() } }
  return (
    <Modal open onClose={onClose} title="Edit item">
      <div className="space-y-4">
        <Input value={t} onChange={(e) => setT(e.target.value)} autoFocus />
        <div className="flex flex-wrap gap-2">
          {(['feature', 'bug', 'idea', 'marketing'] as const).map((x) => (
            <button key={x} onClick={() => setTy(x)} className={`rounded-xl px-3 py-2 text-sm ${ty === x ? 'bg-accent/30 ring-1 ring-accent' : 'bg-white/5 text-white/60'}`}>{TYPE_EMOJI[x]} {x}</button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}

function QRMetricsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useAppStore()
  const [downloads, setDownloads] = useState(String(s.qr.downloads))
  const [users, setUsers] = useState(String(s.qr.users))
  const [revenue, setRevenue] = useState(String(s.qr.revenue))
  return (
    <Modal open={open} onClose={onClose} title="Edit metrics">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div><div className="mb-1.5 text-xs text-white/40">Downloads</div><Input type="number" value={downloads} onChange={(e) => setDownloads(e.target.value)} /></div>
          <div><div className="mb-1.5 text-xs text-white/40">Users</div><Input type="number" value={users} onChange={(e) => setUsers(e.target.value)} /></div>
          <div><div className="mb-1.5 text-xs text-white/40">Revenue (₹)</div><Input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { s.updateQRMetrics({ downloads: +downloads, users: +users, revenue: +revenue }); onClose() }}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}

function AddMilestoneModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addMilestone = useAppStore((s) => s.addMilestone)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayISO())
  return (
    <Modal open={open} onClose={onClose} title="Add milestone">
      <div className="space-y-4">
        <Input placeholder="Milestone (e.g. 1,000 users)" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <div><div className="mb-1.5 text-xs text-white/40">Target date</div><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (title.trim()) { addMilestone({ title: title.trim(), date, done: false }); onClose() } }}>Add</Button>
        </div>
      </div>
    </Modal>
  )
}

function AddChecklistModal({ open, onClose, groups }: { open: boolean; onClose: () => void; groups: string[] }) {
  const addChecklist = useAppStore((s) => s.addChecklist)
  const [label, setLabel] = useState('')
  const [group, setGroup] = useState(groups[0] ?? 'Launch')
  return (
    <Modal open={open} onClose={onClose} title="Add launch task">
      <div className="space-y-4">
        <Input placeholder="Task" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
        <div><div className="mb-1.5 text-xs text-white/40">Group</div><Input placeholder="e.g. Play Store" value={group} onChange={(e) => setGroup(e.target.value)} /></div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (label.trim()) { addChecklist(label.trim(), group.trim() || 'Launch'); onClose() } }}>Add</Button>
        </div>
      </div>
    </Modal>
  )
}

function AddFeedbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addFeedback = useAppStore((s) => s.addFeedback)
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const [rating, setRating] = useState('5')
  return (
    <Modal open={open} onClose={onClose} title="Add feedback">
      <div className="space-y-4">
        <Input placeholder="What did they say?" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <div><div className="mb-1.5 text-xs text-white/40">Rating: {rating}★</div><input type="range" min={1} max={5} value={rating} onChange={(e) => setRating(e.target.value)} className="w-full accent-accent" /></div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (text.trim()) { addFeedback({ text: text.trim(), author: author.trim() || 'Anonymous', rating: +rating }); onClose() } }}>Add</Button>
        </div>
      </div>
    </Modal>
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
