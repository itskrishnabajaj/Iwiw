import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface Props {
  children: ReactNode
  className?: string
  tilt?: boolean
  glow?: string
  onClick?: () => void
  delay?: number
  hoverable?: boolean
}

// Glassmorphism card with optional 3D tilt-on-hover. No mount/entrance animation —
// cards render instantly so navigating between pages never replays a fade cascade.
// `delay` is accepted for call-site compatibility but intentionally unused.
export function GlassCard({ children, className, tilt = false, glow, onClick, hoverable = true }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const tiltOn = tilt && !reduce
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 18 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 18 })

  const onMove = (e: React.PointerEvent) => {
    if (!tiltOn || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={onClick}
      initial={false}
      style={tiltOn ? { rotateX: rx, rotateY: ry, transformPerspective: 1000 } : undefined}
      whileHover={hoverable ? { y: -3 } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'glass rounded-2xl shadow-card relative',
        hoverable && 'glass-hover',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {glow && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 hover:opacity-100"
          style={{ boxShadow: `inset 0 0 30px -10px ${glow}` }}
        />
      )}
      {children}
    </motion.div>
  )
}
