import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { prettyDate } from '@/lib/dates'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden shrink-0 border-r border-white/5 lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.div className="fixed inset-y-0 left-0 z-50 glass lg:hidden" initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <Sidebar scope="mobile" onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="safe-top flex shrink-0 items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-white/60 hover:bg-white/5 lg:hidden" aria-label="Menu">
              ☰
            </button>
            <div className="text-sm text-white/45">{prettyDate()}</div>
          </div>
          <button
            onClick={() => (window as unknown as { openPalette?: () => void }).openPalette?.()}
            aria-label="Search everything (Command or Control + K)"
            className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/40 transition hover:border-white/20 hover:text-white/70"
          >
            <span>⌕</span>
            <span className="hidden sm:inline">Search everything</span>
            <kbd className="ml-2 hidden rounded bg-white/5 px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
          </button>
        </header>

        {/* Routed content. Suspense lives HERE (not at the app root) so a lazy
            route chunk only suspends the content area — the shell never unmounts,
            so navigation can't flash a full-screen spinner. */}
        <main className="flex-1 overflow-y-auto px-4 pb-16 md:px-8">
          <Suspense fallback={<div className="min-h-[40vh]" />}>
            <ErrorBoundary key={location.pathname} label={location.pathname.replace('/', '') || 'home'}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="mx-auto max-w-7xl"
              >
                <Outlet />
              </motion.div>
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
