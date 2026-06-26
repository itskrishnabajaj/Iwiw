import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppStore } from '@/store/useAppStore'
import { sortByOrder } from '@/store/selectors'
import { GlassCard } from '@/components/ui/GlassCard'
import { Progress } from '@/components/ui/Progress'
import { Ring } from '@/components/ui/Ring'
import { SectionTitle, Stat, Tag, Input, EmptyState, ExampleBadge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CardActions } from '@/components/ui/CardActions'
import { useTrash } from '@/lib/useTrash'
import type { Course } from '@/lib/types'

const SOURCE_COLOR: Record<Course['source'], string> = {
  Coursera: '#60a5fa', YouTube: '#fb7185', Book: '#34d399', Podcast: '#a855f7', Article: '#fbbf24', Paper: '#36e6e0',
}

export default function Learning() {
  const s = useAppStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const trash = useTrash()
  const courses = sortByOrder(s.courses.filter((c) => !c.archived))
  const move = (i: number, dir: -1 | 1) => {
    const ids = courses.map((c) => c.id)
    const j = i + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    s.reorderCourses(ids)
  }
  const totalHours = courses.reduce((a, c) => a + c.hoursInvested, 0)
  const certs = courses.filter((c) => c.certificate).length
  const avgProg = courses.length ? Math.round(courses.reduce((a, c) => a + c.progress, 0) / courses.length) : 0

  // Recommend the in-progress course closest to the finish line.
  const upNext = [...courses].filter((c) => c.progress > 0 && c.progress < 100).sort((a, b) => b.progress - a.progress)[0]
  const hoursBySource = courses.reduce<Record<string, number>>((acc, c) => { acc[c.source] = (acc[c.source] ?? 0) + c.hoursInvested; return acc }, {})

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="📚 Learning" subtitle="Every course, book, and idea — compounding." action={<Button onClick={() => setOpen(true)}>＋ Course</Button>} />

      {courses.length === 0 && (
        <GlassCard hoverable={false} className="p-2">
          <EmptyState
            icon="📚"
            title="Start your learning library"
            hint="Add a course, book, podcast or video and track hours, progress and certificates as you go."
            action={<Button onClick={() => setOpen(true)}>＋ Add a resource</Button>}
          />
        </GlassCard>
      )}

      {courses.length > 0 && (
      <>


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5"><Stat label="Hours invested" value={totalHours.toFixed(0)} color="#60a5fa" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Certificates" value={certs} color="#34d399" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Avg. completion" value={`${avgProg}%`} color="#a855f7" /></GlassCard>
        <GlassCard className="p-5"><Stat label="In progress" value={courses.filter((c) => c.progress > 0 && c.progress < 100).length} color="#fbbf24" /></GlassCard>
      </div>

      {upNext && (
        <GlassCard className="p-6" glow={SOURCE_COLOR[upNext.source]}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40">✦ Continue learning</div>
              <div className="mt-1 text-lg font-semibold">{upNext.title}</div>
              <div className="mt-0.5 text-sm text-white/45">{upNext.progress}% done · {Math.max(0, upNext.totalHours - upNext.hoursInvested).toFixed(1)}h to finish · {upNext.source}</div>
            </div>
            <button onClick={() => s.updateCourse(upNext.id, { progress: Math.min(100, upNext.progress + 10), certificate: upNext.progress + 10 >= 100 ? true : upNext.certificate })} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold shadow-glow">Log 10% →</button>
          </div>
          <Progress value={upNext.progress} color={SOURCE_COLOR[upNext.source]} className="mt-4" />
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(hoursBySource).map(([src, h]) => (
              <span key={src} className="rounded-full px-2.5 py-0.5 text-[11px]" style={{ background: SOURCE_COLOR[src as Course['source']] + '22', color: SOURCE_COLOR[src as Course['source']] }}>{src}: {h.toFixed(0)}h</span>
            ))}
          </div>
        </GlassCard>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c, i) => {
          const color = SOURCE_COLOR[c.source]
          const remaining = Math.max(0, c.totalHours - c.hoursInvested)
          return (
            <GlassCard key={c.id} className="p-5" tilt delay={i * 0.04} glow={color}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag color={color}>{c.source}</Tag>
                  {c.example && <ExampleBadge />}
                </div>
                <div className="flex items-center gap-1">
                  {c.certificate && <span title="Certificate earned" className="text-lg">🎓</span>}
                  <CardActions
                    label={`Actions for ${c.title}`}
                    actions={[
                      { label: 'Edit', icon: '✎', onClick: () => setEditing(c) },
                      ...(i > 0 ? [{ label: 'Move up', icon: '↑', onClick: () => move(i, -1) }] : []),
                      ...(i < courses.length - 1 ? [{ label: 'Move down', icon: '↓', onClick: () => move(i, 1) }] : []),
                      { label: 'Duplicate', icon: '⧉', onClick: () => s.duplicateCourse(c.id) },
                      { label: 'Delete', icon: '🗑', danger: true, onClick: () => trash('course', c) },
                    ]}
                  />
                </div>
              </div>
              <h3 className="mt-3 line-clamp-2 min-h-[2.6em] font-semibold leading-snug">{c.title}</h3>
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
      </>
      )}

      <AddCourseModal open={open} onClose={() => setOpen(false)} />
      <EditCourseModal course={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function EditCourseModal({ course, onClose }: { course: Course | null; onClose: () => void }) {
  const updateCourse = useAppStore((s) => s.updateCourse)
  const [title, setTitle] = useState('')
  const [source, setSource] = useState<Course['source']>('Coursera')
  const [totalHours, setTotalHours] = useState('10')
  const [hoursInvested, setHoursInvested] = useState('0')
  const [progress, setProgress] = useState('0')
  const [certificate, setCertificate] = useState(false)
  const [notes, setNotes] = useState('')
  useEffect(() => {
    if (course) {
      setTitle(course.title); setSource(course.source); setTotalHours(String(course.totalHours))
      setHoursInvested(String(course.hoursInvested)); setProgress(String(course.progress))
      setCertificate(course.certificate); setNotes(course.notes)
    }
  }, [course])
  const submit = () => {
    if (!course || !title.trim()) return
    updateCourse(course.id, { title: title.trim(), source, totalHours: +totalHours, hoursInvested: +hoursInvested, progress: +progress, certificate, notes })
    onClose()
  }
  return (
    <Modal open={!!course} onClose={onClose} title="Edit resource">
      <div className="space-y-4">
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SOURCE_COLOR) as Course['source'][]).map((src) => (
            <button key={src} onClick={() => setSource(src)} className={`rounded-lg px-3 py-1.5 text-sm ${source === src ? 'ring-1 ring-accent' : 'bg-white/5 text-white/60'}`} style={source === src ? { background: SOURCE_COLOR[src] + '30' } : undefined}>{src}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><div className="mb-1.5 text-xs text-white/40">Total h</div><Input type="number" value={totalHours} onChange={(e) => setTotalHours(e.target.value)} /></div>
          <div><div className="mb-1.5 text-xs text-white/40">Invested h</div><Input type="number" value={hoursInvested} onChange={(e) => setHoursInvested(e.target.value)} /></div>
          <div><div className="mb-1.5 text-xs text-white/40">Progress %</div><Input type="number" value={progress} onChange={(e) => setProgress(e.target.value)} /></div>
        </div>
        <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={certificate} onChange={(e) => setCertificate(e.target.checked)} className="accent-accent" /> Certificate earned
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </div>
      </div>
    </Modal>
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
