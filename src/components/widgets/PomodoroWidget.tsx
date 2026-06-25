import { usePomodoro } from '@/hooks/usePomodoro'
import { Ring } from '@/components/ui/Ring'
import { motion } from 'framer-motion'

export function PomodoroWidget({ size = 150 }: { size?: number }) {
  const p = usePomodoro()
  return (
    <div className="flex flex-col items-center gap-3">
      <Ring value={p.pct} size={size} color={p.phase === 'focus' ? '#7c5cff' : '#34d399'}>
        <div className="text-center">
          <div className="font-mono text-3xl font-bold tabular-nums">{p.label}</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-white/40">{p.phase === 'focus' ? 'Focus' : 'Break'}</div>
        </div>
      </Ring>
      <div className="flex items-center gap-2">
        <motion.button whileTap={{ scale: 0.94 }} onClick={p.toggle} className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold shadow-glow">
          {p.running ? 'Pause' : 'Start'}
        </motion.button>
        <button onClick={p.reset} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5">
          Reset
        </button>
      </div>
      <div className="text-xs text-white/35">{p.rounds} rounds completed today</div>
    </div>
  )
}
