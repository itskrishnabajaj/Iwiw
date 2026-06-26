import { useEffect, useRef } from 'react'

// A soft radial light that trails the cursor on desktop. Event-driven (no perpetual
// requestAnimationFrame loop): it only moves while the pointer moves and a CSS
// transition does the smooth trailing — so when the cursor is idle, nothing runs and
// the UI reaches a true resting state. Disabled on touch / reduced-motion.
export function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    let queued = false
    let x = 0
    let y = 0
    const apply = () => {
      queued = false
      if (ref.current) ref.current.style.transform = `translate(${x}px, ${y}px)`
    }
    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      // Coalesce to at most one transform write per frame WHILE moving; the rAF is
      // one-shot per move (not a perpetual loop), so idle = zero scheduled frames.
      if (!queued) {
        queued = true
        requestAnimationFrame(apply)
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
  return (
    <div className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
      <div
        ref={ref}
        className="absolute -left-[300px] -top-[300px] h-[600px] w-[600px] rounded-full opacity-[0.06] blur-[80px] transition-transform duration-500 ease-out"
        style={{ background: 'radial-gradient(circle, #9d86ff, transparent 60%)' }}
      />
    </div>
  )
}
