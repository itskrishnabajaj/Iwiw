import { type ReactNode, type InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-white/45">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Tag({ children, color = '#7c5cff' }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ background: `${color}1f`, color, border: `1px solid ${color}33` }}
    >
      {children}
    </span>
  )
}

export function Stat({ label, value, sub, color }: { label: string; value: ReactNode; sub?: ReactNode; color?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums" style={color ? { color } : undefined}>
        {value}
      </div>
      {sub && <div className="text-xs text-white/40">{sub}</div>}
    </div>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none transition placeholder:text-white/30 focus:border-accent/60 focus:bg-white/[0.06]',
        className,
      )}
      {...rest}
    />
  )
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none transition placeholder:text-white/30 focus:border-accent/60 focus:bg-white/[0.06]',
        className,
      )}
      {...rest}
    />
  )
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border border-white/10 bg-base-700 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent/60',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  )
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { label: string; value: T }[] }) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
        >
          {value === o.value && (
            <motion.div layoutId="seg" className="absolute inset-0 rounded-lg bg-accent/90 shadow-glow" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
          )}
          <span className={cn('relative z-10', value === o.value ? 'text-white' : 'text-white/50')}>{o.label}</span>
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 text-4xl opacity-70">{icon}</div>
      <p className="font-medium text-white/70">{title}</p>
      {hint && <p className="mt-1 text-sm text-white/35">{hint}</p>}
    </div>
  )
}
