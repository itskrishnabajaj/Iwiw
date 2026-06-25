import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useIntelligence } from '@/hooks/useIntelligence'
import { GlassCard } from '@/components/ui/GlassCard'
import { Tag } from '@/components/ui/primitives'
import { Ring } from '@/components/ui/Ring'
import { RadarChart, LineChart } from '@/components/charts/Charts'
import { countdown } from '@/lib/dates'
import { sectionStats, studyVelocity, percentileProjection, revisionQueue } from '@/lib/mbaAnalytics'
import { format, parseISO } from 'date-fns'

const masteryColor = (m: number) => (m >= 75 ? '#34d399' : m >= 60 ? '#9ae6b4' : m >= 45 ? '#fbbf24' : '#fb7185')

export function MBADeep() {
  const s = useAppStore()
  const insights = useIntelligence(['suggestion', 'next-action', 'prediction', 'schedule'])
  const cat = countdown(s.settings.catDate)
  const cet = countdown(s.settings.cetDate)

  const sections = useMemo(() => sectionStats(s.mba), [s.mba])
  const velocity = useMemo(() => studyVelocity(s.mba, 30), [s.mba.studyLogs])
  const projection = useMemo(() => percentileProjection(s), [s.mba.mocks, s.settings.catDate])
  const queue = useMemo(() => revisionQueue(s.mba), [s.mba.topics])
  const bumpTopic = useAppStore((st) => st.bumpTopic)

  return (
    <>
      {/* Exam countdowns + projection */}
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-6" glow="#7c5cff">
          <div className="text-xs uppercase tracking-wider text-white/40">CAT 2026</div>
          <div className="mt-1 text-4xl font-black text-accent-soft">{cat.days}<span className="ml-1 text-base font-normal text-white/40">days</span></div>
          <div className="mt-1 text-xs text-white/35">{format(parseISO(s.settings.catDate), 'd MMMM yyyy')}</div>
        </GlassCard>
        <GlassCard className="p-6" glow="#36e6e0">
          <div className="text-xs uppercase tracking-wider text-white/40">MBA CET</div>
          <div className="mt-1 text-4xl font-black text-accent-cyan">{cet.days}<span className="ml-1 text-base font-normal text-white/40">days</span></div>
          <div className="mt-1 text-xs text-white/35">{format(parseISO(s.settings.cetDate), 'd MMMM yyyy')}</div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-6">
          <Ring value={projection.projected} size={88} stroke={8} color="#a855f7"><span className="text-lg font-bold">{projection.projected}</span></Ring>
          <div>
            <div className="text-xs text-white/45">Projected by CAT</div>
            <div className="font-semibold">{projection.current} → {projection.projected} %ile</div>
            <div className={`mt-1 text-xs ${projection.trendPerWeek >= 0 ? 'text-good' : 'text-bad'}`}>
              {projection.trendPerWeek >= 0 ? '▲' : '▼'} {Math.abs(projection.trendPerWeek)}/week trend
            </div>
          </div>
        </GlassCard>
      </div>

      {/* AI study focus */}
      <GlassCard className="p-6" glow="#36e6e0">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent-cyan">✦ AI Study Focus</div>
        <div className="grid gap-3 md:grid-cols-2">
          {insights.slice(0, 4).map((i) => (
            <div key={i.id} className="rounded-xl bg-white/[0.03] p-4">
              <div className="flex items-center gap-2">
                <span>{i.icon}</span>
                <span className="text-sm font-semibold">{i.title}</span>
                <Tag color={i.tone === 'warn' || i.tone === 'bad' ? '#fb7185' : i.tone === 'good' ? '#34d399' : '#7c5cff'}>{i.kind}</Tag>
              </div>
              <p className="mt-1.5 text-sm text-white/65">{i.body}</p>
            </div>
          ))}
          {insights.length === 0 && <p className="text-sm text-white/40">All clear — keep executing your plan.</p>}
        </div>
      </GlassCard>

      {/* Section comparison + study velocity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="mb-1 text-lg font-semibold">Section comparison</h2>
          <p className="mb-4 text-xs text-white/40">Average mastery across VARC · DILR · QA</p>
          <RadarChart labels={sections.map((x) => x.section)} data={sections.map((x) => x.mastery)} color="#7c5cff" height={240} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {sections.map((x) => (
              <div key={x.section} className="rounded-lg bg-white/[0.03] p-2">
                <div className="text-sm font-bold" style={{ color: masteryColor(x.mastery) }}>{x.mastery}%</div>
                <div className="text-[10px] text-white/40">{x.section} · {x.questions}q</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-1 text-lg font-semibold">Study velocity</h2>
          <p className="mb-4 text-xs text-white/40">7-day rolling average of daily hours</p>
          <LineChart
            labels={velocity.map((v) => format(parseISO(v.date), 'd MMM'))}
            datasets={[{ label: 'Rolling avg (h)', data: velocity.map((v) => v.rolling), color: '#36e6e0' }]}
            height={240}
          />
        </GlassCard>
      </div>

      {/* Weakness heatmap + revision queue */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="mb-1 text-lg font-semibold">Weakness heatmap</h2>
          <p className="mb-4 text-xs text-white/40">Every topic by mastery — red needs work</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {s.mba.topics.map((t) => (
              <div key={t.topic} className="rounded-xl p-3" style={{ background: masteryColor(t.mastery) + '22', border: `1px solid ${masteryColor(t.mastery)}44` }}>
                <div className="truncate text-xs font-medium">{t.topic}</div>
                <div className="mt-1 flex items-end justify-between">
                  <span className="text-lg font-bold" style={{ color: masteryColor(t.mastery) }}>{t.mastery}%</span>
                  <span className="text-[10px] text-white/35">{t.section}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-1 text-lg font-semibold">Revision queue</h2>
          <p className="mb-4 text-xs text-white/40">Topics below 70% — revise weakest first</p>
          <div className="space-y-2">
            {queue.length === 0 && <p className="text-sm text-good">Every topic is above 70% — you’re exam-ready. 🎉</p>}
            {queue.map((t) => (
              <div key={t.topic} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium">{t.topic}</div>
                  <div className="text-[11px] text-white/40">{t.section} · {t.questionsSolved} solved</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold" style={{ color: masteryColor(t.mastery) }}>{t.mastery}%</span>
                  <button onClick={() => bumpTopic(t.topic, 3)} aria-label={`Mark ${t.topic} revised`} className="rounded-lg bg-accent/20 px-2.5 py-1 text-xs text-accent-soft hover:bg-accent/30">
                    ✓ revised
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </>
  )
}
