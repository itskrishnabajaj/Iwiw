import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { titleForLevel } from '@/lib/xp'
import { bigCelebrate } from './confetti'

export function LevelUpModal() {
  const level = useAppStore((s) => s.pendingLevelUp)
  const clear = useAppStore((s) => s.clearLevelUp)

  useEffect(() => {
    if (level !== null) bigCelebrate()
  }, [level])

  return (
    <AnimatePresence>
      {level !== null && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={clear}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="glass relative z-10 w-full max-w-sm rounded-3xl p-8 text-center shadow-glow"
          >
            <motion.div
              className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full text-4xl"
              style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.5), transparent 70%)' }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              ⭐
            </motion.div>
            <div className="text-sm uppercase tracking-[0.3em] text-accent-soft">Level Up</div>
            <div className="mt-2 text-5xl font-black text-gradient">Level {level}</div>
            <div className="mt-2 text-white/60">You are now a {titleForLevel(level!)}</div>
            <button onClick={clear} className="mt-6 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold shadow-glow">
              Keep going →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
