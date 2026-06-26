import { DATA_VERSION } from '@/lib/seed'

// Ordered schema migrations. Each step upgrades data from `from` → `to`.
// When you bump DATA_VERSION in seed.ts, append a migration here; never mutate
// existing ones. This guarantees no user loses data across app updates.
export interface Migration {
  from: number
  to: number
  describe: string
  migrate: (data: Record<string, unknown>) => Record<string, unknown>
}

// Stamp an explicit `order` (by current index) on a list so manual reordering
// has a stable baseline. Existing items are the user's REAL data — never tagged
// `example`. `archived` is left undefined (= not archived) so selectors include them.
function withOrder(v: unknown): unknown {
  if (!Array.isArray(v)) return v
  return v.map((item, i) =>
    item && typeof item === 'object' && (item as Record<string, unknown>).order === undefined
      ? { ...(item as object), order: i }
      : item,
  )
}

export const MIGRATIONS: Migration[] = [
  {
    from: 1,
    to: 2,
    describe: 'lifecycle fields: backfill order on planning lists',
    migrate: (d) => {
      const next = { ...d }
      next.goals = withOrder(d.goals)
      next.habits = withOrder(d.habits)
      next.courses = withOrder(d.courses)
      next.vision = withOrder(d.vision)
      next.institutes = withOrder(d.institutes)
      next.tasks = withOrder(d.tasks)
      const mba = d.mba as Record<string, unknown> | undefined
      if (mba && typeof mba === 'object') next.mba = { ...mba, topics: withOrder(mba.topics) }
      const qr = d.qr as Record<string, unknown> | undefined
      if (qr && typeof qr === 'object') {
        next.qr = { ...qr, items: withOrder(qr.items), milestones: withOrder(qr.milestones), checklist: withOrder(qr.checklist) }
      }
      return next
    },
  },
]

// Apply migrations sequentially from `fromVersion` toward DATA_VERSION.
// Returns the upgraded data and the version actually reached.
export function runMigrations(
  data: Record<string, unknown>,
  fromVersion: number,
): { data: Record<string, unknown>; version: number; applied: string[] } {
  let d = data
  let v = fromVersion || 1
  const applied: string[] = []
  // Data written by a NEWER app build (downgrade) — don't migrate forward or
  // loop; hand it back as-is. validateAppData() will normalize the shape and
  // stamp the current version without wiping the user's data.
  if (v > DATA_VERSION) return { data: d, version: v, applied }
  // safety bound to avoid infinite loops on a malformed chain
  let guard = 0
  while (v < DATA_VERSION && guard++ < 100) {
    const step = MIGRATIONS.find((m) => m.from === v)
    if (!step) break
    d = step.migrate(d)
    v = step.to
    applied.push(step.describe)
  }
  return { data: d, version: v, applied }
}
