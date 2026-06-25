import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

// Animated number that counts up when it scrolls into view.
export function CountUp({ value, decimals = 0, duration = 1200, prefix = '', suffix = '', className }: Props) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          if (!Number.isFinite(value)) {
            setDisplay(0)
            return
          }
          const start = performance.now()
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration)
            const eased = 1 - Math.pow(1 - p, 3)
            setDisplay(value * eased)
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [value, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}
