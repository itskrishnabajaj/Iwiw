import { freshData, DATA_VERSION } from '@/lib/seed'
import type { AppData } from '@/lib/types'

const TOP_ARRAYS: (keyof AppData)[] = [
  'skills', 'xpEvents', 'tasks', 'habits', 'goals', 'institutes', 'courses',
  'journal', 'dayLogs', 'notes', 'vision',
]
const TOP_OBJECTS: (keyof AppData)[] = [
  'settings', 'mba', 'qr', 'gym', 'finance', 'personal', 'unlockedAchievements',
]

// Defensive validation + repair: never throw, never let a missing/corrupt key
// crash the app. Anything wrong is replaced/merged with seed defaults so the
// shape is always complete. Returns the repaired keys for diagnostics.
export function validateAppData(raw: unknown): { data: AppData; repaired: string[] } {
  const def = freshData()
  const repaired: string[] = []

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { data: def, repaired: ['*'] }
  }

  const input = raw as Record<string, unknown>
  const out = { ...def, ...input } as Record<string, unknown>

  for (const k of TOP_ARRAYS) {
    if (!Array.isArray(out[k])) {
      out[k] = def[k]
      repaired.push(k)
    }
  }
  for (const k of TOP_OBJECTS) {
    const v = out[k]
    if (!v || typeof v !== 'object' || Array.isArray(v)) {
      out[k] = def[k]
      repaired.push(k)
    } else {
      // shallow-merge defaults so newly added nested keys are always present
      out[k] = { ...(def[k] as object), ...(v as object) }
    }
  }

  out.version = DATA_VERSION
  return { data: out as unknown as AppData, repaired }
}
