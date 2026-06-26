import { PREFS_KEY } from './keys'

// Tiny, synchronous UI preferences — the ONLY thing that lives in localStorage.
// All real application data stays in IndexedDB via StorageService.
export type ThemeAccent = 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose'
export type AnimationDensity = 'full' | 'reduced' | 'minimal'

export interface Prefs {
  accent: ThemeAccent
  seasonalGreeting: boolean
  reduceMotion: boolean
  particles: boolean
  highContrast: boolean
  animationDensity: AnimationDensity
  sidebarCollapsed: boolean
  lastRoute: string
  onboarded: boolean
  // Quick Capture: per-type use counts → long-press shows your most-used captures.
  captureCounts: Record<string, number>
}

export const DEFAULT_PREFS: Prefs = {
  accent: 'violet',
  seasonalGreeting: true,
  reduceMotion: false,
  // Off by default — the floating-particle canvas runs continuously and made the
  // UI feel "busy/never resting". Opt back in via Settings → Performance.
  particles: false,
  highContrast: false,
  animationDensity: 'full',
  sidebarCollapsed: false,
  lastRoute: '/',
  onboarded: false,
  captureCounts: {},
}

export const ACCENTS: Record<ThemeAccent, { name: string; from: string; to: string }> = {
  violet: { name: 'Violet', from: '#7c5cff', to: '#36e6e0' },
  cyan: { name: 'Cyan', from: '#36e6e0', to: '#60a5fa' },
  emerald: { name: 'Emerald', from: '#34d399', to: '#36e6e0' },
  amber: { name: 'Amber', from: '#fbbf24', to: '#fb923c' },
  rose: { name: 'Rose', from: '#f472b6', to: '#a855f7' },
}

type Listener = (p: Prefs) => void
const listeners = new Set<Listener>()

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(patch: Partial<Prefs>): Prefs {
  const next = { ...loadPrefs(), ...patch }
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next))
  } catch {
    /* quota / private mode — prefs are best-effort */
  }
  listeners.forEach((l) => l(next))
  return next
}

export function subscribePrefs(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Apply prefs that affect global rendering (accent CSS vars, motion, contrast).
export function applyPrefs(p: Prefs): void {
  const root = document.documentElement
  const accent = ACCENTS[p.accent] ?? ACCENTS.violet
  root.style.setProperty('--accent-from', accent.from)
  root.style.setProperty('--accent-to', accent.to)
  const hexToRgb = (h: string) => {
    const x = h.replace('#', '')
    return `${parseInt(x.slice(0, 2), 16)} ${parseInt(x.slice(2, 4), 16)} ${parseInt(x.slice(4, 6), 16)}`
  }
  root.style.setProperty('--accent', hexToRgb(accent.from))
  root.style.setProperty('--accent-cyan', hexToRgb(accent.to))
  root.classList.toggle('reduce-motion', p.reduceMotion || p.animationDensity === 'minimal')
  root.classList.toggle('high-contrast', p.highContrast)
}
