import { useEffect, useRef } from 'react'

// A soft radial light that follows the cursor across the whole app.
export function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let tx = 0
    let ty = 0
    let x = 0
    let y = 0
    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
    }
    const tick = () => {
      x += (tx - x) * 0.12
      y += (ty - y) * 0.12
      if (ref.current) ref.current.style.transform = `translate(${x}px, ${y}px)`
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', onMove)
    tick()
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
      <div
        ref={ref}
        className="absolute -left-[300px] -top-[300px] h-[600px] w-[600px] rounded-full opacity-[0.07] blur-[80px]"
        style={{ background: 'radial-gradient(circle, #9d86ff, transparent 60%)' }}
      />
    </div>
  )
}
