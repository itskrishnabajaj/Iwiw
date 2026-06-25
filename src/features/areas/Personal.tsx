import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionTitle, Stat } from '@/components/ui/primitives'
import { LineChart } from '@/components/charts/Charts'
import { Sparkline } from '@/components/ui/Sparkline'
import { lastNDates } from '@/lib/dates'
import { format, parseISO } from 'date-fns'

export default function Personal() {
  const s = useAppStore()
  const p = s.personal
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

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="🌱 Personal Growth" subtitle="Discipline, deep work, and the inner game — 30-day view." />

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
        <GlassCard className="p-5"><Stat label="Journal entries" value={s.journal.length} color="#34d399" /></GlassCard>
      </div>
    </div>
  )
}
