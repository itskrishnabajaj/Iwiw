import { memo } from 'react'

// Animated aurora gradient blobs behind everything. Pure CSS animation, cheap.
export const AuroraBackground = memo(function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-1/3 -left-1/4 h-[70vh] w-[70vh] rounded-full opacity-50 blur-[120px] animate-aurora"
        style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.55), transparent 60%)' }}
      />
      <div
        className="absolute top-1/4 -right-1/4 h-[60vh] w-[60vh] rounded-full opacity-40 blur-[120px] animate-aurora"
        style={{ background: 'radial-gradient(circle, rgba(54,230,224,0.45), transparent 60%)', animationDelay: '-6s' }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[55vh] w-[55vh] rounded-full opacity-30 blur-[120px] animate-aurora"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4), transparent 60%)', animationDelay: '-12s' }}
      />
      {/* subtle grain / vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 120% at 50% 0%, transparent 40%, rgba(0,0,0,0.5) 100%)' }}
      />
    </div>
  )
})
