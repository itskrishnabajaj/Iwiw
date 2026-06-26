import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useEffect, useRef, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  wide?: boolean
}

// Adaptive surface: a centered dialog on desktop, a drag-to-dismiss bottom sheet
// on touch / small screens — so forms feel native on a phone or tablet.
function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 639px)').matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const on = () => setMobile(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return mobile
}

export function Modal({ open, onClose, title, children, wide }: Props) {
  const mobile = useIsMobile()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Focus management: move focus into the dialog on open, trap Tab within it,
  // and restore focus to the trigger on close (native, accessible behavior).
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const focusables = () => {
      const el = contentRef.current
      if (!el) return [] as HTMLElement[]
      return Array.from(
        el.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'),
      ).filter((x) => x.offsetParent !== null)
    }
    const id = window.setTimeout(() => {
      const f = focusables()
      ;(f[0] ?? contentRef.current)?.focus()
    }, 40)
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const f = focusables()
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onTab)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', onTab)
      prev?.focus?.()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-50 flex ${mobile ? 'items-end' : 'items-center'} justify-center ${mobile ? '' : 'p-4'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          {mobile ? (
            <motion.div
              ref={contentRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              tabIndex={-1}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) onClose()
              }}
              className="glass relative z-10 max-h-[88svh] w-full overflow-y-auto rounded-t-3xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-card outline-none"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20" />
              {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}
              {children}
            </motion.div>
          ) : (
            <motion.div
              ref={contentRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className={`glass relative z-10 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-2xl p-6 shadow-card outline-none`}
            >
              {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}
              {children}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
