import { Suspense, lazy, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from './router'
import { AuroraBackground } from './components/ui/AuroraBackground'
import { MouseGlow } from './components/ui/MouseGlow'
import { LevelUpModal } from './components/celebrate/LevelUpModal'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { useAppStore } from './store/useAppStore'
import { usePrefs } from './hooks/usePrefs'

const Onboarding = lazy(() => import('./features/onboarding/Onboarding'))

function BootScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
        <div className="text-sm text-white/40">Booting your command center…</div>
      </div>
    </div>
  )
}

export default function App() {
  const hydrated = useAppStore((s) => s.hydrated)
  const [prefs] = usePrefs()
  const [justFinished, setJustFinished] = useState(false)
  const showOnboarding = hydrated && !prefs.onboarded && !justFinished

  return (
    <>
      <AuroraBackground />
      <MouseGlow />
      <ErrorBoundary label="app">
        {!hydrated ? (
          <BootScreen />
        ) : showOnboarding ? (
          <Suspense fallback={<BootScreen />}>
            <Onboarding onDone={() => setJustFinished(true)} />
          </Suspense>
        ) : (
          <Suspense fallback={<BootScreen />}>
            <RouterProvider router={router} />
          </Suspense>
        )}
      </ErrorBoundary>
      <LevelUpModal />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: 'rgba(17,19,28,0.95)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '14px', fontSize: '14px' },
        }}
      />
    </>
  )
}
