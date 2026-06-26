import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { getLevel, todayProgress, studyStreak, todayFocusScore, activityHeatmap, predictedPercentile, weeklyXP } from '@/store/selectors'
import { totalXP, titleForLevel } from '@/lib/xp'
import { greeting, countdown, ageFrom, todayISO } from '@/lib/dates'
import { quoteOfDay } from '@/data/quotes'
import { generateInsight } from '@/lib/insights'
import { goalProgress } from '@/lib/goals'
import { GlassCard } from '@/components/ui/GlassCard'
import { Ring } from '@/components/ui/Ring'
import { Progress } from '@/components/ui/Progress'
import { CountUp } from '@/components/ui/CountUp'
import { Heatmap } from '@/components/ui/Heatmap'
import { Particles } from '@/components/ui/Particles'
import { PomodoroWidget } from '@/components/widgets/PomodoroWidget'
import { Tag } from '@/components/ui/primitives'
import { useWeather } from '@/hooks/useWeather'
import { useTick } from '@/hooks/useTick'
import { usePrefs } from '@/hooks/usePrefs'
import { AREA_META } from '@/store/selectors'

export default function Home() {
  useTick(1000 * 30)
  const [prefs] = usePrefs()
  const s = useAppStore()
  const lvl = getLevel(s)
  const tp = todayProgress(s)
  const streak = studyStreak(s)
  const focus = todayFocusScore(s)
  const age = ageFrom(s.settings.birthDate)
  const cat = countdown(s.settings.catDate)
  const cet = countdown(s.settings.cetDate)
  const weather = useWeather(s.settings.weatherLat, s.settings.weatherLon)
  const quote = quoteOfDay() // date-deterministic; stable as XP changes during the day
  const heat = useMemo(() => activityHeatmap(s, 119), [s.xpEvents])
  const insight = useMemo(() => generateInsight('daily', s), [s.tasks, s.xpEvents])
  const pct = predictedPercentile(s)
  const wXP = weeklyXP(s)

  const gymToday = s.gym.workouts.some((w) => w.date === todayISO() && !w.archived)
  const topGoals = s.goals.filter((g) => (g.horizon === 'annual' || g.horizon === 'weekly') && !g.archived).slice(0, 3)
  const notes = s.notes.filter((n) => !n.archived)

  const [note, setNote] = useState('')

  return (
    <div className="space-y-6 pt-2">
      {/* HERO */}
      <GlassCard hoverable={false} className="relative overflow-hidden p-6 md:p-10">
        {prefs.particles && <Particles count={36} />}
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="text-sm font-medium uppercase tracking-[0.25em] text-accent-soft">{prefs.seasonalGreeting ? greeting() : 'Welcome back'}</div>
            <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">
              <span className="text-gradient">{s.settings.name}</span> — today matters.
            </h1>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-5 max-w-3xl rounded-2xl border border-accent/20 bg-accent/[0.06] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-accent-soft">Mission</div>
            <p className="mt-1 text-base leading-relaxed text-white/85 md:text-lg">{s.settings.mission}</p>
          </motion.div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <HeroStat label="CAT 2026" value={cat.days} suffix=" days" color="#7c5cff" />
            <HeroStat label="MBA CET" value={cet.days} suffix=" days" color="#36e6e0" />
            <HeroStat label="Age" value={+age.precise} decimals={2} color="#f472b6" />
            <HeroStat label="Study Streak" value={streak} suffix="🔥" color="#fbbf24" />
            <HeroStat label="Focus Score" value={focus} suffix="%" color="#34d399" />
            <HeroStat label="Pred. %ile" value={pct} decimals={1} color="#a855f7" />
          </div>
        </div>
      </GlassCard>

      {/* RINGS + LEVEL */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2" tilt>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today’s Rings</h2>
            <Link to="/today" className="text-xs text-accent-soft hover:underline">Open Today →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col items-center gap-2">
              <Ring value={tp.pct} size={110} color="#7c5cff" label="Tasks" sublabel={`${tp.done}/${tp.total}`} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Ring value={Math.min(100, focus)} size={110} color="#34d399" label="Focus" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Ring value={gymToday ? 100 : 0} size={110} color="#fb7185" label="Gym" sublabel={gymToday ? 'done' : 'pending'} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Ring value={Math.min(100, (wXP / 1500) * 100)} size={110} color="#36e6e0" label="Weekly XP" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" glow="#7c5cff">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Level {lvl.level}</h2>
            <Tag>{titleForLevel(lvl.level)}</Tag>
          </div>
          <div className="mt-4 text-3xl font-black tabular-nums">
            <CountUp value={totalXP(s.xpEvents)} suffix=" XP" />
          </div>
          <div className="mt-1 text-xs text-white/40">{lvl.into} / {lvl.needed} XP to level {lvl.level + 1}</div>
          <Progress value={lvl.pct} className="mt-3" height={10} />
          <Link to="/progress" className="mt-4 inline-block text-xs text-accent-soft hover:underline">View skill tree →</Link>
        </GlassCard>
      </div>

      {/* INSIGHT + WEATHER/QUOTE */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2" glow="#36e6e0">
          <div className="flex items-center gap-2 text-sm font-semibold text-accent-cyan">✦ AI Daily Brief</div>
          <h3 className="mt-2 text-xl font-bold">{insight.title}</h3>
          <p className="mt-2 leading-relaxed text-white/70">{insight.body}</p>
        </GlassCard>
        <GlassCard className="flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/45">{s.settings.weatherCity}</span>
              {weather ? <span className="text-3xl">{weather.emoji}</span> : <span className="text-white/20">···</span>}
            </div>
            {weather ? (
              <div className="mt-1 text-4xl font-bold">{weather.temp}°<span className="ml-2 text-sm font-normal text-white/40">{weather.label}</span></div>
            ) : (
              <div className="mt-1 text-sm text-white/30">Weather offline</div>
            )}
          </div>
          <blockquote className="mt-4 border-l-2 border-accent/40 pl-3 text-sm italic text-white/60">
            “{quote.text}”<footer className="mt-1 not-italic text-white/35">— {quote.author}</footer>
          </blockquote>
        </GlassCard>
      </div>

      {/* GOALS + POMODORO */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Current Goals</h2>
            <Link to="/goals" className="text-xs text-accent-soft hover:underline">All goals →</Link>
          </div>
          <div className="space-y-4">
            {topGoals.map((g) => {
              const prog = goalProgress(g, s.goals)
              const meta = AREA_META[g.area]
              return (
                <div key={g.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span>{meta.emoji}</span>{g.title}</span>
                    <span className="text-white/40">{g.target ? `${g.current}/${g.target} ${g.unit}` : `${prog}%`}</span>
                  </div>
                  <Progress value={prog} color={meta.color} />
                </div>
              )
            })}
          </div>
        </GlassCard>

        <GlassCard className="flex items-center justify-center p-6">
          <div className="w-full">
            <h2 className="mb-4 text-center text-lg font-semibold">Pomodoro</h2>
            <PomodoroWidget />
          </div>
        </GlassCard>
      </div>

      {/* HEATMAP + NOTES */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="overflow-hidden p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Momentum</h2>
            <span className="text-xs text-white/35">Last 17 weeks · XP per day</span>
          </div>
          <Heatmap data={heat} />
          <div className="mt-3 flex items-center gap-2 text-[11px] text-white/35">
            Less
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-white/5" />
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#7c5cff', opacity: 0.4 }} />
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#7c5cff', opacity: 0.7 }} />
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#7c5cff' }} />
            More
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col p-6">
          <h2 className="mb-3 text-lg font-semibold">Quick Notes</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (note.trim()) {
                s.addNote(note.trim())
                setNote('')
              }
            }}
            className="mb-3 flex gap-2"
          >
            <input value={note} onChange={(e) => setNote(e.target.value)} aria-label="New note" placeholder="Capture a thought…" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-accent/60" />
            <button aria-label="Add note" className="rounded-xl bg-accent px-3 text-sm font-semibold">+</button>
          </form>
          <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
            {notes.length === 0 && <p className="px-1 py-6 text-center text-sm text-white/30">No notes yet — jot down a spark.</p>}
            {notes.slice(0, 6).map((n) => (
              <div key={n.id} className="group flex items-start justify-between gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 break-words text-white/70">{n.text}</span>
                <button onClick={() => { const t = window.prompt('Edit note', n.text); if (t != null) s.updateNote(n.id, t) }} aria-label="Edit note" className="px-1 leading-none text-white/40 opacity-0 transition hover:text-white focus-visible:opacity-100 group-hover:opacity-100">✎</button>
                <button onClick={() => s.deleteNote(n.id)} aria-label="Delete note" className="px-1 leading-none text-white/40 opacity-0 transition hover:text-bad focus-visible:opacity-100 group-hover:opacity-100">×</button>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

function HeroStat({ label, value, suffix, decimals, color }: { label: string; value: number; suffix?: string; decimals?: number; color: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3.5">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color }}>
        <CountUp value={value} decimals={decimals ?? 0} suffix={suffix} />
      </div>
    </div>
  )
}
