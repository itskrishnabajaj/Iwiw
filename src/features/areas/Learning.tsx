import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { Progress } from '@/components/ui/Progress'
import { Ring } from '@/components/ui/Ring'
import { SectionTitle, Stat, Tag, Input } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Course } from '@/lib/types'

const SOURCE_COLOR: Record<Course['source'], string> = {
  Coursera: '#60a5fa', YouTube: '#fb7185', Book: '#34d399', Podcast: '#a855f7', Article: '#fbbf24', Paper: '#36e6e0',
}

export default function Learning() {
  const s = useAppStore()
  const [open, setOpen] = useState(false)
  const totalHours = s.courses.reduce((a, c) => a + c.hoursInvested, 0)
  const certs = s.courses.filter((c) => c.certificate).length
  const avgProg = s.courses.length ? Math.round(s.courses.reduce((a, c) => a + c.progress, 0) / s.courses.length) : 0

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="📚 Learning" subtitle="Every course, book, and idea — compounding." action={<Button onClick={() => setOpen(true)}>＋ Course</Button>} />

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-5"><Stat label="Hours invested" value={totalHours.toFixed(0)} color="#60a5fa" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Certificates" value={certs} color="#34d399" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Avg. completion" value={`${avgProg}%`} color="#a855f7" /></GlassCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {s.courses.map((c, i) => {
          const color = SOURCE_COLOR[c.source]
          const remaining = Math.max(0, c.totalHours - c.hoursInvested)
          return (
            <GlassCard key={c.id} className="p-5" tilt delay={i * 0.04} glow={color}>
              <div className="flex items-start justify-between">
                <Tag color={color}>{c.source}</Tag>
                {c.certificate && <span title="Certificate earned" className="text-lg">🎓</span>}
              </div>
              <h3 className="mt-3 font-semibold leading-snug">{c.title}</h3>
              <div className="mt-4 flex items-center gap-4">
                <Ring value={c.progress} size={64} stroke={7} color={color}><span className="text-xs font-bold">{c.progress}%</span></Ring>
                <div className="flex-1 space-y-1 text-[11px] text-white/45">
                  <div>⏱ {c.hoursInvested}h invested</div>
                  <div>⏳ {remaining.toFixed(1)}h remaining</div>
                </div>
              </div>
              <Progress value={c.progress} color={color} className="mt-4" height={6} />
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => s.updateCourse(c.id, { progress: Math.min(100, c.progress + 10), certificate: c.progress + 10 >= 100 ? true : c.certificate })} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-white/60 hover:bg-white/10">+10%</button>
                {c.notes && <span className="truncate text-[11px] text-white/30">📝 {c.notes}</span>}
              </div>
            </GlassCard>
          )
        })}
      </div>

      <AddCourseModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function AddCourseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addCourse = useAppStore((s) => s.addCourse)
  const [title, setTitle] = useState('')
  const [source, setSource] = useState<Course['source']>('Coursera')
  const [hours, setHours] = useState('10')

  return (
    <Modal open={open} onClose={onClose} title="Add learning resource">
      <div className="space-y-4">
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SOURCE_COLOR) as Course['source'][]).map((src) => (
            <button key={src} onClick={() => setSource(src)} className={`rounded-lg px-3 py-1.5 text-sm ${source === src ? 'ring-1 ring-accent' : 'bg-white/5 text-white/60'}`} style={source === src ? { background: SOURCE_COLOR[src] + '30' } : undefined}>{src}</button>
          ))}
        </div>
        <div>
          <div className="mb-1.5 text-xs text-white/40">Total hours</div>
          <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (title.trim()) { addCourse({ title: title.trim(), source, progress: 0, totalHours: +hours, hoursInvested: 0, certificate: false, notes: '' }); onClose() } }}>Add</Button>
        </div>
      </div>
    </Modal>
  )
}
