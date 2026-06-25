import { motion } from 'framer-motion'

interface Props {
  value: number // 0-100
  size?: number
  stroke?: number
  color?: string
  track?: string
  label?: string
  sublabel?: string
  children?: React.ReactNode
}

// Apple-Fitness-style activity ring.
export function Ring({ value, size = 120, stroke = 12, color = '#7c5cff', track = 'rgba(255,255,255,0.08)', label, sublabel, children }: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const offset = c - (clamped / 100) * c

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`ring-${color}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#36e6e0" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#ring-${color})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ?? (
          <>
            <span className="text-2xl font-bold tabular-nums">{Math.round(clamped)}%</span>
            {label && <span className="text-[11px] text-white/50">{label}</span>}
            {sublabel && <span className="text-[10px] text-white/30">{sublabel}</span>}
          </>
        )}
      </div>
    </div>
  )
}
