import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionTitle, Stat, Input, EmptyState } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LineChart } from '@/components/charts/Charts'
import { Sparkline } from '@/components/ui/Sparkline'
import { lastNDates, todayISO } from '@/lib/dates'
import { format, parseISO } from 'date-fns'

export default function Personal() {
  const s = useAppStore()
  const p = s.personal
  const [open, setOpen] = useState(false)
  const dates = useMemo(() => lastNDates(30), [])

  const series = (rec: Record<string, number>) => dates.map((d) => rec[d] ?? 0)
  const med = series(p.meditationMinutes)
  const deep = series(p.deepWorkHours)
  const screen = series(p.screenTime)
  const pages = series(p.pagesRead)

  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
  const avg = (a: number[]) => (a.length ? sum(a) / a.length : 0)

  const cards = [
    { label: 'Meditation', total: `${sum(med)} min`, data: med, color: '#a855f7' },
    { label: 'Deep work', total: `${sum(deep).toFixed(1)} h`, data: deep, color: '#7c5cff' },
    { label: 'Screen time', total: `${avg(screen).toFixed(1)} h/day`, data: screen, color: '#fb7185' },
    { label: 'Pages read', total: `${sum(pages)}`, data: pages, color: '#34d399' },
  ]

  const empty = sum(med) === 0 && sum(deep) === 0 && sum(screen) === 0 && sum(pages) === 0

  if (empty) {
    return (
      <div className="space-y-6 pt-2">
        <SectionTitle title="🌱 Personal Growth" subtitle="Discipline, deep work, and the inner game — 30-day view." action={<Button onClick={() => setOpen(true)}>＋ Log today</Button>} />
        <GlassCard hoverable={false} className="p-2">
          <EmptyState
            icon="🌱"
            title="Track your inner game"
            hint="Log meditation, deep work, screen time and pages read each day to see your discipline compound over 30 days."
            action={<Button onClick={() => setOpen(true)}>＋ Log today's metrics</Button>}
          />
        </GlassCard>
        <LogPersonalModal open={open} onClose={() => setOpen(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="🌱 Personal Growth" subtitle="Discipline, deep work, and the inner game — 30-day view." action={<Button onClick={() => setOpen(true)}>＋ Log today</Button>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <GlassCard key={c.label} className="p-5" glow={c.color}>
            <div className="text-[11px] uppercase tracking-wider text-white/40">{c.label}</div>
            <div className="mt-1 text-2xl font-bold" style={{ color: c.color }}>{c.total}</div>
            <div className="mt-2"><Sparkline data={c.data} color={c.color} width={150} height={36} /></div>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Deep work vs screen time</h2>
          <LineChart
            labels={dates.map((d) => format(parseISO(d), 'd'))}
            datasets={[
              { label: 'Deep work (h)', data: deep, color: '#7c5cff' },
              { label: 'Screen time (h)', data: screen, color: '#fb7185' },
            ]}
            height={260}
          />
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Meditation minutes</h2>
          <LineChart labels={dates.map((d) => format(parseISO(d), 'd'))} datasets={[{ label: 'Minutes', data: med, color: '#a855f7' }]} height={260} />
        </GlassCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-5"><Stat label="Avg deep work" value={`${avg(deep).toFixed(1)}h`} sub="per day" color="#7c5cff" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Meditation days" value={med.filter((x) => x > 0).length} sub="of 30" color="#a855f7" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Journal entries" value={s.journal.filter((j) => !j.archived).length} color="#34d399" /></GlassCard>
      </div>

      <LogPersonalModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function LogPersonalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useAppStore()
  const today = todayISO()
  const [med, setMed] = useState(String(s.personal.meditationMinutes[today] ?? ''))
  const [deep, setDeep] = useState(String(s.personal.deepWorkHours[today] ?? ''))
  const [screen, setScreen] = useState(String(s.personal.screenTime[today] ?? ''))
  const [pages, setPages] = useState(String(s.personal.pagesRead[today] ?? ''))
  const submit = () => {
    if (med !== '') s.setMetric('meditationMinutes', today, +med)
    if (deep !== '') s.setMetric('deepWorkHours', today, +deep)
    if (screen !== '') s.setMetric('screenTime', today, +screen)
    if (pages !== '') s.setMetric('pagesRead', today, +pages)
    toast.success('Logged today')
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Log today's growth">
      <div className="grid grid-cols-2 gap-3">
        <div><div className="mb-1.5 text-xs text-white/40">Meditation (min)</div><Input type="number" value={med} onChange={(e) => setMed(e.target.value)} autoFocus /></div>
        <div><div className="mb-1.5 text-xs text-white/40">Deep work (h)</div><Input type="number" step="0.1" value={deep} onChange={(e) => setDeep(e.target.value)} /></div>
        <div><div className="mb-1.5 text-xs text-white/40">Screen time (h)</div><Input type="number" step="0.1" value={screen} onChange={(e) => setScreen(e.target.value)} /></div>
        <div><div className="mb-1.5 text-xs text-white/40">Pages read</div><Input type="number" value={pages} onChange={(e) => setPages(e.target.value)} /></div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit}>Save</Button>
      </div>
    </Modal>
  )
}
