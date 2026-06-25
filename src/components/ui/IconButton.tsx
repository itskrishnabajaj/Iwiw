import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
  children: ReactNode
  label: string // required — enforces an accessible name on icon-only buttons
  size?: 'sm' | 'md'
  tone?: 'default' | 'danger' | 'accent'
}

// Accessible icon-only button: always labelled, always a ≥40px touch target.
export function IconButton({ children, label, size = 'md', tone = 'default', className, ...rest }: Props) {
  const sizes = { sm: 'h-9 w-9 text-sm', md: 'h-10 w-10 text-base' }
  const tones = {
    default: 'text-white/55 hover:text-white hover:bg-white/[0.08]',
    danger: 'text-white/45 hover:text-bad hover:bg-bad/10',
    accent: 'text-accent-soft hover:bg-accent/15',
  }
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      aria-label={label}
      title={label}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-xl transition-colors', sizes[size], tones[tone], className)}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  )
}
