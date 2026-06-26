import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { lifeBalance, AREA_META, weeklyXP } from '@/store/selectors'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionTitle, Stat, Tag } from '@/components/ui/primitives'
import { Ring } from '@/components/ui/Ring'
import { LineChart, BarChart, RadarChart, DoughnutChart } from '@/components/charts/Charts'
import { useIntelligence, useProductivityScore } from '@/hooks/useIntelligence'
import { lastNDates, iso } from '@/lib/dates'
import { format, parseISO } from 'date-fns'
import type { AreaKey, AppData } from '@/lib/types'

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Analytics() {
  // Narrow subscription: Analytics only depends on xpEvents + study logs, so a
  // Quick Capture from this screen (e.g. a note) won't re-render its charts.
  const xpEvents = useAppStore((st) => st.xpEvents)
  const study = useAppStore((st) => st.mba.studyLogs)
  const reviews = useIntelligence(['weekly', 'monthly'])
  const productivity = useProductivityScore()

  const balance = useMemo(() => lifeBalance({ xpEvents } as AppData), [xpEvents])

  // Most productive weekday & hour, from XP event timestamps.
  const productive = useMemo(() => {
    const byDay = new Array(7).fill(0)
    const byHour = new Array(24).fill(0)
    for (const e of xpEvents) {
      const d = new Date(e.ts)
      byDay[(d.getDay() + 6) % 7] += e.amount
      byHour[d.getHours()] += e.amount
    }
    if (xpEvents.length === 0) return { day: '—', hour: null as number | null }
    const topDay = byDay.indexOf(Math.max(...byDay))
    const topHour = byHour.indexOf(Math.max(...byHour))
    return { day: WEEKDAY_NAMES[topDay], hour: topHour as number | null }
  }, [xpEvents])

  // XP by area (last 14d) for doughnut
  const areaTotals = useMemo(() => {
    const cutoff = Date.now() - 14 * 86400000
    const totals: Record<string, number> = {}
    for (const e of xpEvents) if (e.ts >= cutoff) totals[e.area] = (totals[e.area] || 0) + e.amount
    return totals
  }, [xpEvents])

  // Daily XP momentum (last 30 days)
  const momentum = useMemo(() => {
    const dates = lastNDates(30)
    const map = new Map(dates.map((d) => [d, 0]))
    for (const e of xpEvents) {
      const d = iso(new Date(e.ts))
      if (map.has(d)) map.set(d, (map.get(d) || 0) + e.amount)
    }
    return { labels: dates.map((d) => format(parseISO(d), 'd MMM')), data: dates.map((d) => map.get(d) || 0) }
  }, [xpEvents])

  // Study hours per weekday + most productive hour heuristic
  const hoursByWeekday = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0, 0, 0]
    const counts = [0, 0, 0, 0, 0, 0, 0]
    for (const l of study) {
      const d = (parseISO(l.date).getDay() + 6) % 7
      buckets[d] += l.hours
      counts[d]++
    }
    return buckets.map((b, i) => (counts[i] ? +(b / counts[i]).toFixed(1) : 0))
  }, [study])

  const totalHours = study.reduce((a, l) => a + l.hours, 0)
  const avgFocus = study.length ? Math.round(study.reduce((a, l) => a + l.focusScore, 0) / study.length) : 0

  // study vs gym vs qr balance (counts)
  const balanceData = [
    { key: 'mba' as AreaKey, value: areaTotals.mba || 0 },
    { key: 'qr' as AreaKey, value: areaTotals.qr || 0 },
    { key: 'gym' as AreaKey, value: areaTotals.gym || 0 },
  ]

  const radarLabels = balance.map((b) => AREA_META[b.area].label.split(' ')[0])

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="Analytics" subtitle="Executive dashboards — every chart answers a question." />

      {/* Executive review: productivity score + AI weekly/monthly review */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="flex items-center gap-5 p-6" glow="#7c5cff">
          <Ring value={productivity} size={104} color="#7c5cff"><div className="text-center"><div className="text-2xl font-black">{productivity}</div><div className="text-[10px] uppercase tracking-wider text-white/40">Score</div></div></Ring>
          <div>
            <div className="text-sm font-semibold">Productivity score</div>
            <p className="mt-1 text-xs text-white/45">A composite of today’s completion, focus, streak, weekly XP and recovery.</p>
          </div>
        </GlassCard>
        {reviews.map((r) => (
          <GlassCard key={r.id} className="p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>{r.icon}</span>{r.title}
              <Tag color={r.tone === 'good' ? '#34d399' : '#7c5cff'}>{r.kind}</Tag>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{r.body}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5"><Stat label="Total study hours" value={totalHours.toFixed(0)} sub="all time" color="#7c5cff" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Avg focus score" value={`${avgFocus}%`} sub="per session" color="#34d399" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Most productive day" value={productive.day} sub="by XP earned" color="#36e6e0" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Peak hour" value={productive.hour === null ? '—' : `${productive.hour}:00`} sub="when you earn most XP" color="#fbbf24" /></GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Momentum — daily XP</h2>
          <LineChart labels={momentum.labels} datasets={[{ label: 'XP', data: momentum.data, color: '#7c5cff' }]} height={260} />
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Life Balance Wheel</h2>
          <RadarChart labels={radarLabels} data={balance.map((b) => b.value)} color="#36e6e0" height={260} />
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">XP by area · 14d</h2>
          <DoughnutChart
            labels={Object.keys(areaTotals).map((k) => AREA_META[k as AreaKey].label)}
            data={Object.values(areaTotals)}
            colors={Object.keys(areaTotals).map((k) => AREA_META[k as AreaKey].color)}
            height={240}
          />
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Avg study hours / weekday</h2>
          <BarChart labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} data={hoursByWeekday} color="#a855f7" height={240} />
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Study · QuantReflex · Gym</h2>
          <BarChart labels={balanceData.map((b) => AREA_META[b.key].label.split(' ')[0])} data={balanceData.map((b) => b.value)} color="#34d399" height={240} />
          <p className="mt-3 text-xs text-white/40">XP earned in each over the last 14 days — keep the bars from drifting too far apart.</p>
        </GlassCard>
      </div>
    </div>
  )
}
