import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionTitle, Stat, Tag, Input, Textarea, EmptyState, ExampleBadge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CardActions } from '@/components/ui/CardActions'
import { useTrash } from '@/lib/useTrash'
import { todayISO, iso } from '@/lib/dates'
import { addDays } from 'date-fns'
import type { Institute, PipelineStage } from '@/lib/types'

const STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'lead', label: 'Lead', color: '#94a3b8' },
  { key: 'visited', label: 'Visited', color: '#60a5fa' },
  { key: 'meeting', label: 'Meeting', color: '#a855f7' },
  { key: 'proposal', label: 'Proposal Sent', color: '#fb923c' },
  { key: 'interested', label: 'Interested', color: '#fbbf24' },
  { key: 'partner', label: 'Partner 🎉', color: '#34d399' },
]

export default function CRM() {
  const s = useAppStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Institute | null>(null)
  const institutes = s.institutes.filter((i) => !i.archived)
  const partners = institutes.filter((i) => i.stage === 'partner').length
  const avgProb = institutes.length ? Math.round(institutes.reduce((a, i) => a + i.probability, 0) / institutes.length) : 0

  const today = todayISO()
  const expectedPartners = (institutes.filter((i) => i.stage !== 'partner').reduce((a, i) => a + i.probability, 0) / 100).toFixed(1)
  const overdue = institutes.filter((i) => i.followUp && i.followUp < today && i.stage !== 'partner').sort((a, b) => (a.followUp! < b.followUp! ? -1 : 1))
  const active = institutes.filter((i) => i.stage !== 'partner').length

  if (institutes.length === 0) {
    return (
      <div className="space-y-6 pt-2">
        <SectionTitle title="🤝 Coaching Outreach CRM" subtitle="Your pipeline to partner with India’s coaching institutes." action={<Button onClick={() => setOpen(true)}>＋ Institute</Button>} />
        <GlassCard hoverable={false} className="p-2">
          <EmptyState
            icon="🤝"
            title="Build your outreach pipeline"
            hint="Add the coaching institutes you want to partner with and move them through your pipeline from lead to signed partner."
            action={<Button onClick={() => setOpen(true)}>＋ Add your first institute</Button>}
          />
        </GlassCard>
        <AddInstituteModal open={open} onClose={() => setOpen(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="🤝 Coaching Outreach CRM" subtitle="Your pipeline to partner with India’s coaching institutes." action={<Button onClick={() => setOpen(true)}>＋ Institute</Button>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5"><Stat label="Institutes" value={institutes.length} color="#fb923c" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Partners closed" value={partners} color="#34d399" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Expected partners" value={expectedPartners} sub={`from ${active} active leads`} color="#a855f7" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Avg. probability" value={`${avgProb}%`} color="#fbbf24" /></GlassCard>
      </div>

      {/* Pipeline funnel + follow-up reminders */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Pipeline funnel</h2>
          <div className="space-y-2.5">
            {STAGES.map((stage) => {
              const count = institutes.filter((i) => i.stage === stage.key).length
              const pct = institutes.length ? (count / institutes.length) * 100 : 0
              return (
                <div key={stage.key} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-white/55">{stage.label}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-lg bg-white/[0.04]">
                    <div className="flex h-full items-center justify-end rounded-lg px-2 text-[11px] font-semibold text-base-900" style={{ width: `${Math.max(pct, count ? 12 : 0)}%`, background: stage.color }}>{count || ''}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-3 text-lg font-semibold">Follow-ups due</h2>
          {overdue.length === 0 ? (
            <p className="text-sm text-good">You're all caught up. 🎉</p>
          ) : (
            <div className="space-y-2">
              {overdue.map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-xl bg-bad/10 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{i.name}</div>
                    <div className="text-[11px] text-bad/80">due {i.followUp}</div>
                  </div>
                  <button onClick={() => s.updateInstitute(i.id, { followUp: iso(addDays(new Date(), 7)) })} aria-label={`Snooze follow-up for ${i.name} one week`} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-white/60 hover:bg-white/10">Logged ✓</button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const items = institutes.filter((i) => i.stage === stage.key)
          return (
            <div key={stage.key} className="w-[82vw] shrink-0 snap-start rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 sm:w-72">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold" style={{ color: stage.color }}>{stage.label}</span>
                <span className="text-xs text-white/30">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((inst) => (
                  <InstituteCard key={inst.id} inst={inst} color={stage.color} onEdit={() => setEditing(inst)} />
                ))}
                {items.length === 0 && <div className="px-2 py-6 text-center text-xs text-white/20">—</div>}
              </div>
            </div>
          )
        })}
      </div>

      <AddInstituteModal open={open} onClose={() => setOpen(false)} />
      <EditInstituteModal inst={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function InstituteCard({ inst, color, onEdit }: { inst: Institute; color: string; onEdit: () => void }) {
  const s = useAppStore()
  const trash = useTrash()
  const idx = STAGES.findIndex((x) => x.key === inst.stage)
  return (
    <motion.div layout className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">{inst.name}{inst.example && <ExampleBadge />}</div>
          <div className="text-[11px] text-white/40">📍 {inst.location}</div>
        </div>
        <CardActions label={`Actions for ${inst.name}`} actions={[
          { label: 'Edit', icon: '✎', onClick: onEdit },
          { label: 'Archive', icon: '📦', onClick: () => trash('institute', inst) },
        ]} />
      </div>
      <div className="mt-2 space-y-0.5 text-[11px] text-white/45">
        <div>👤 {inst.contact}</div>
        <div>📞 {inst.phone}</div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <Tag color={color}>{inst.probability}% likely</Tag>
        {inst.followUp && <span className="text-[10px] text-white/30">↻ {inst.followUp.slice(5)}</span>}
      </div>
      <div className="mt-2 flex gap-1">
        {idx > 0 && <button onClick={() => s.moveInstitute(inst.id, STAGES[idx - 1].key)} className="flex-1 rounded-lg bg-white/5 py-1 text-[11px] text-white/50 hover:bg-white/10">← back</button>}
        {idx < STAGES.length - 1 && <button onClick={() => s.moveInstitute(inst.id, STAGES[idx + 1].key)} className="flex-1 rounded-lg bg-accent/20 py-1 text-[11px] text-accent-soft hover:bg-accent/30">advance →</button>}
      </div>
    </motion.div>
  )
}

function AddInstituteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addInstitute = useAppStore((s) => s.addInstitute)
  const [f, setF] = useState({ name: '', location: '', contact: '', phone: '', email: '', notes: '', probability: 30 })
  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }))

  return (
    <Modal open={open} onClose={onClose} title="Add institute" wide>
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Institute name" value={f.name} onChange={(e) => set('name', e.target.value)} autoFocus />
        <Input placeholder="Location" value={f.location} onChange={(e) => set('location', e.target.value)} />
        <Input placeholder="Contact person" value={f.contact} onChange={(e) => set('contact', e.target.value)} />
        <Input placeholder="Phone" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
        <Input placeholder="Email" value={f.email} onChange={(e) => set('email', e.target.value)} className="col-span-2" />
        <Textarea placeholder="Notes" value={f.notes} onChange={(e) => set('notes', e.target.value)} className="col-span-2" rows={2} />
        <div className="col-span-2">
          <div className="mb-1.5 text-xs text-white/40">Partnership probability: {f.probability}%</div>
          <input type="range" min={0} max={100} value={f.probability} onChange={(e) => set('probability', +e.target.value)} className="w-full accent-accent" />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => { if (f.name.trim()) { addInstitute({ ...f, whatsapp: f.phone, stage: 'lead', notes: f.notes }); onClose() } }}>Add to pipeline</Button>
      </div>
    </Modal>
  )
}

function EditInstituteModal({ inst, onClose }: { inst: Institute | null; onClose: () => void }) {
  const updateInstitute = useAppStore((s) => s.updateInstitute)
  const [f, setF] = useState({ name: '', location: '', contact: '', phone: '', email: '', notes: '', probability: 30, followUp: '' })
  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }))
  useEffect(() => {
    if (inst) setF({ name: inst.name, location: inst.location, contact: inst.contact, phone: inst.phone, email: inst.email, notes: inst.notes, probability: inst.probability, followUp: inst.followUp ?? '' })
  }, [inst])
  const submit = () => {
    if (!inst || !f.name.trim()) return
    updateInstitute(inst.id, { name: f.name.trim(), location: f.location, contact: f.contact, phone: f.phone, whatsapp: f.phone, email: f.email, notes: f.notes, probability: f.probability, followUp: f.followUp || undefined })
    onClose()
  }
  return (
    <Modal open={!!inst} onClose={onClose} title="Edit institute" wide>
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Institute name" value={f.name} onChange={(e) => set('name', e.target.value)} autoFocus />
        <Input placeholder="Location" value={f.location} onChange={(e) => set('location', e.target.value)} />
        <Input placeholder="Contact person" value={f.contact} onChange={(e) => set('contact', e.target.value)} />
        <Input placeholder="Phone" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
        <Input placeholder="Email" value={f.email} onChange={(e) => set('email', e.target.value)} className="col-span-2" />
        <Textarea placeholder="Notes" value={f.notes} onChange={(e) => set('notes', e.target.value)} className="col-span-2" rows={2} />
        <div><div className="mb-1.5 text-xs text-white/40">Next follow-up</div><Input type="date" value={f.followUp} onChange={(e) => set('followUp', e.target.value)} /></div>
        <div>
          <div className="mb-1.5 text-xs text-white/40">Probability: {f.probability}%</div>
          <input type="range" min={0} max={100} value={f.probability} onChange={(e) => set('probability', +e.target.value)} className="w-full accent-accent" />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit}>Save</Button>
      </div>
    </Modal>
  )
}
