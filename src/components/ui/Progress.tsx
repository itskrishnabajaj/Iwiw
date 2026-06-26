import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

interface Props {
  value: number // 0-100
  color?: string
  className?: string
  height?: number
  liquid?: boolean
}

// Progress bar that fills once on view. `liquid` (off by default) adds a moving
// shimmer — kept opt-in because, run on every bar, it never lets the UI rest.
export function Progress({ value, color = '#7c5cff', className, height = 8, liquid = false }: Props) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-full bg-white/[0.06]', className)}
      style={{ height }}
    >
      <motion.div
        className="relative h-full rounded-full"
        initial={{ width: 0 }}
        whileInView={{ width: `${v}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          boxShadow: `0 0 12px -2px ${color}aa`,
        }}
      >
        {liquid && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="shimmer-bg absolute inset-0 animate-shimmer" />
          </div>
        )}
      </motion.div>
    </div>
  )
}
