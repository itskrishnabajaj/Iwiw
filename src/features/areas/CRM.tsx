import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionTitle, Stat, Tag, Input, Textarea } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
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
  const partners = s.institutes.filter((i) => i.stage === 'partner').length
  const avgProb = s.institutes.length ? Math.round(s.institutes.reduce((a, i) => a + i.probability, 0) / s.institutes.length) : 0

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="🤝 Coaching Outreach CRM" subtitle="Your pipeline to partner with India’s coaching institutes." action={<Button onClick={() => setOpen(true)}>＋ Institute</Button>} />

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-5"><Stat label="Institutes" value={s.institutes.length} color="#fb923c" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Partners closed" value={partners} color="#34d399" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Avg. probability" value={`${avgProb}%`} color="#fbbf24" /></GlassCard>
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const items = s.institutes.filter((i) => i.stage === stage.key)
          return (
            <div key={stage.key} className="w-[82vw] shrink-0 snap-start rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 sm:w-72">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold" style={{ color: stage.color }}>{stage.label}</span>
                <span className="text-xs text-white/30">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((inst) => (
                  <InstituteCard key={inst.id} inst={inst} color={stage.color} />
                ))}
                {items.length === 0 && <div className="px-2 py-6 text-center text-xs text-white/20">—</div>}
              </div>
            </div>
          )
        })}
      </div>

      <AddInstituteModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function InstituteCard({ inst, color }: { inst: Institute; color: string }) {
  const s = useAppStore()
  const idx = STAGES.findIndex((x) => x.key === inst.stage)
  return (
    <motion.div layout className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{inst.name}</div>
          <div className="text-[11px] text-white/40">📍 {inst.location}</div>
        </div>
        <button onClick={() => s.deleteInstitute(inst.id)} aria-label={`Delete ${inst.name}`} className="px-1 text-base leading-none text-white/40 opacity-0 transition hover:text-bad focus-visible:opacity-100 group-hover:opacity-100">×</button>
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
