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

export const MIGRATIONS: Migration[] = [
  // Example template for the next schema bump:
  // {
  //   from: 1,
  //   to: 2,
  //   describe: 'add `archived` flag to goals',
  //   migrate: (d) => ({ ...d, goals: (d.goals as any[]).map((g) => ({ ...g, archived: false })) }),
  // },
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
