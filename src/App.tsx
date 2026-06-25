import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from './router'
import { AuroraBackground } from './components/ui/AuroraBackground'
import { MouseGlow } from './components/ui/MouseGlow'
import { LevelUpModal } from './components/celebrate/LevelUpModal'
import { useAppStore } from './store/useAppStore'

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

  return (
    <>
      <AuroraBackground />
      <MouseGlow />
      {!hydrated ? (
        <BootScreen />
      ) : (
        <Suspense fallback={<BootScreen />}>
          <RouterProvider router={router} />
        </Suspense>
      )}
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
