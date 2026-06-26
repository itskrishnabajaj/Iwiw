import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export interface CardAction {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
}

// A compact "⋯" overflow menu for entity cards (Edit · Duplicate · Archive · Delete).
// Keeps every card's lifecycle controls consistent and discoverable without
// cluttering the card surface.
export function CardActions({ actions, label = 'Item actions' }: { actions: CardAction[]; label?: string }) {
  const [open, setOpen] = useState(false)
  if (!actions.length) return null
  return (
    <div className="relative">
      <button
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
      >
        <span className="text-lg leading-none">⋯</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              role="menu"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="glass absolute right-0 z-50 mt-1 min-w-[10rem] overflow-hidden rounded-xl border border-white/10 p-1 shadow-card"
            >
              {actions.map((a) => (
                <button
                  key={a.label}
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpen(false)
                    a.onClick()
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10 ${
                    a.danger ? 'text-bad' : 'text-white/80'
                  }`}
                >
                  {a.icon && <span className="w-4 text-center">{a.icon}</span>}
                  {a.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
