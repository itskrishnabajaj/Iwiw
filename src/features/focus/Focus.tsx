import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { todaysTasks } from '@/store/selectors'
import { usePomodoro } from '@/hooks/usePomodoro'
import { usePrefs } from '@/hooks/usePrefs'
import { AuroraBackground } from '@/components/ui/AuroraBackground'
import { Particles } from '@/components/ui/Particles'
import { Ring } from '@/components/ui/Ring'

export default function Focus() {
  const s = useAppStore()
  const [prefs] = usePrefs()
  const p = usePomodoro(50, 10)
  const tasks = todaysTasks(s).filter((t) => !t.done && t.priority)
  const [active, setActive] = useState(tasks[0]?.title ?? 'Deep work')

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {prefs.animationDensity !== 'minimal' && <AuroraBackground />}
      {prefs.particles && <div className="absolute inset-0 -z-[1]"><Particles count={60} /></div>}

      <Link to="/" className="absolute left-6 top-6 text-sm text-white/40 transition hover:text-white">← Exit focus</Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
        <div className="text-sm uppercase tracking-[0.4em] text-accent-soft">Focus Mode</div>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight md:text-4xl">{active}</h1>

        <div className="mt-10 flex flex-col items-center">
          <Ring value={p.pct} size={260} stroke={10} color={p.phase === 'focus' ? '#7c5cff' : '#34d399'}>
            <div className="text-center">
              <div className="font-mono text-6xl font-black tabular-nums">{p.label}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.3em] text-white/40">{p.phase === 'focus' ? 'Deep Work' : 'Recover'}</div>
            </div>
          </Ring>

          <div className="mt-8 flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={p.toggle} className="rounded-2xl bg-accent px-8 py-3 font-semibold shadow-glow">
              {p.running ? 'Pause' : 'Begin'}
            </motion.button>
            <button onClick={p.reset} className="rounded-2xl border border-white/10 px-6 py-3 text-white/60 hover:bg-white/5">Reset</button>
          </div>
          <div className="mt-4 text-sm text-white/35">{p.rounds} deep-work blocks today</div>
        </div>
      </motion.div>

      {tasks.length > 1 && (
        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {tasks.map((t) => (
            <button key={t.id} onClick={() => setActive(t.title)} className={`rounded-full border px-4 py-1.5 text-sm transition ${active === t.title ? 'border-accent bg-accent/20 text-white' : 'border-white/10 text-white/50 hover:text-white'}`}>
              {t.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
