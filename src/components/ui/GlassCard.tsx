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

// Glassmorphism card with optional 3D tilt-on-hover and entrance animation.
export function GlassCard({ children, className, tilt = false, glow, onClick, delay = 0, hoverable = true }: Props) {
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
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      style={tiltOn ? { rotateX: rx, rotateY: ry, transformPerspective: 1000 } : undefined}
      whileHover={hoverable ? { y: -3 } : undefined}
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
