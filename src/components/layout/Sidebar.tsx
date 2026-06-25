import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NAV, GROUP_LABEL, type NavItem } from './nav'
import { useAppStore } from '@/store/useAppStore'
import { levelFromXP, titleForLevel, totalXP } from '@/lib/xp'
import { cn } from '@/lib/cn'

export function Sidebar({ onNavigate, scope = 'desktop' }: { onNavigate?: () => void; scope?: string }) {
  const name = useAppStore((s) => s.settings.name)
  // Select a primitive (total XP) — never an object — to avoid render loops.
  const xp = useAppStore((s) => totalXP(s.xpEvents))
  const lvl = levelFromXP(xp)

  const groups: NavItem['group'][] = ['core', 'areas', 'system']

  return (
    <aside className="flex h-full w-64 flex-col gap-1 px-3 py-5">
      <div className="mb-4 flex items-center gap-3 px-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 text-accent-soft shadow-glow">
          <span className="text-lg">◍</span>
        </div>
        <div>
          <div className="text-sm font-bold leading-tight">Personal OS</div>
          <div className="text-[11px] text-white/40">{name}’s command center</div>
        </div>
      </div>

      <div className="mb-3 glass rounded-2xl px-3.5 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/45">Level {lvl.level}</span>
          <span className="text-accent-soft">{titleForLevel(lvl.level)}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-cyan" style={{ width: `${lvl.pct}%` }} />
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
        {groups.map((g) => (
          <div key={g}>
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">{GROUP_LABEL[g]}</div>
            <div className="space-y-0.5">
              {NAV.filter((n) => n.group === g).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
                      isActive ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/[0.04]',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div layoutId={`navActive-${scope}`} className="absolute inset-0 rounded-xl bg-white/[0.07] ring-1 ring-white/10" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                      )}
                      <span className="relative z-10 w-5 text-center text-base opacity-90">{item.icon}</span>
                      <span className="relative z-10 font-medium">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pt-2 text-[10px] text-white/25">⌘K to search · Local-first</div>
    </aside>
  )
}
