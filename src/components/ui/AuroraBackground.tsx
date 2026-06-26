import { memo } from 'react'

// STATIC aurora gradient. Painted once — no continuous compositing, so the app
// reaches a calm visual resting state. (Previously these blobs animated forever,
// which read as the whole screen constantly repainting.)
export const AuroraBackground = memo(function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-1/3 -left-1/4 h-[70vh] w-[70vh] rounded-full opacity-40 blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.5), transparent 60%)' }}
      />
      <div
        className="absolute top-1/4 -right-1/4 h-[60vh] w-[60vh] rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(54,230,224,0.4), transparent 60%)' }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[55vh] w-[55vh] rounded-full opacity-25 blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.35), transparent 60%)' }}
      />
      {/* subtle vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 120% at 50% 0%, transparent 40%, rgba(0,0,0,0.5) 100%)' }}
      />
    </div>
  )
})
