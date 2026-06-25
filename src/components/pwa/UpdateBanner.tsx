import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePwaUpdate } from '@/hooks/usePwaUpdate'

// Non-blocking "a new version is available" prompt. Mounted once in App.
// Reloading via applyUpdate() preserves all IndexedDB data and preferences.
export function UpdateBanner() {
  const { needRefresh, applyUpdate } = usePwaUpdate()
  const [dismissed, setDismissed] = useState(false)
  const [reloading, setReloading] = useState(false)
  const show = needRefresh && !dismissed

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4"
        >
          <div className="glass safe-bottom flex items-center gap-3 rounded-2xl px-4 py-3 shadow-card">
            <span className="text-lg">✨</span>
            <span className="text-sm text-white/85">A new version is available.</span>
            <button
              onClick={() => {
                setReloading(true)
                applyUpdate()
              }}
              disabled={reloading}
              className="rounded-xl bg-accent px-3.5 py-1.5 text-sm font-semibold shadow-glow disabled:opacity-60"
            >
              {reloading ? 'Updating…' : 'Reload'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss update"
              className="rounded-lg px-2 py-1 text-sm text-white/45 hover:text-white"
            >
              Later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
