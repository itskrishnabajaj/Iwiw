import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'glass' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

// 3D-ish button with a ripple micro-interaction.
export function Button({ children, variant = 'primary', size = 'md', className, onClick, ...rest }: Props) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  const handle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const id = Date.now()
    setRipples((p) => [...p, { id, x: e.clientX - r.left, y: e.clientY - r.top }])
    setTimeout(() => setRipples((p) => p.filter((x) => x.id !== id)), 600)
    onClick?.(e)
  }

  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' }
  const variants = {
    primary: 'bg-accent text-white shadow-glow hover:brightness-110',
    danger: 'bg-bad/90 text-white hover:brightness-110',
    ghost: 'text-white/70 hover:text-white hover:bg-white/5',
    glass: 'glass glass-hover text-white/90',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      onClick={handle}
      className={cn(
        'relative overflow-hidden rounded-xl font-semibold transition-[filter,background] duration-200 select-none',
        sizes[size],
        variants[variant],
        className,
      )}
      {...(rest as object)}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute rounded-full bg-white/30 animate-[ripple_0.6s_ease-out]"
          style={{ left: r.x, top: r.y, width: 8, height: 8, transform: 'translate(-50%,-50%)' }}
        />
      ))}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      <style>{`@keyframes ripple{to{transform:translate(-50%,-50%) scale(28);opacity:0}}`}</style>
    </motion.button>
  )
}
