import { get, set, del, keys as idbKeys } from 'idb-keyval'
import type { StateStorage } from 'zustand/middleware'
import { freshData, DATA_VERSION, hasUserContent } from '@/lib/seed'
import type { AppData } from '@/lib/types'
import { validateAppData } from './validate'
import { runMigrations } from './migrations'
import { STORE_KEY, BACKUP_KEY, MAX_BACKUPS, AUTO_BACKUP_INTERVAL_MS } from './keys'

// Zustand persists `{ state, version }` under STORE_KEY. The StorageService is the
// single gateway to that data: every read is validated + migrated, every write is
// snapshotted, and corruption falls back to the most recent good backup.

interface Envelope {
  state: AppData
  version: number
}

export interface BackupSnapshot {
  id: string
  ts: number
  version: number
  data: AppData
  reason: 'auto' | 'manual' | 'pre-import' | 'pre-restore' | 'pre-reset'
}

export type Integrity = 'ok' | 'repaired' | 'recovered' | 'empty'

export interface Diagnostics {
  version: number
  integrity: Integrity
  storeBytes: number
  backupBytes: number
  backupCount: number
  lastBackup: number | null
  repairedKeys: string[]
  keys: { key: string; bytes: number }[]
}

const bytesOf = (s: string) => new TextEncoder().encode(s).length
const genId = () => `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`

class StorageService {
  private lastIntegrity: Integrity = 'empty'
  private lastRepaired: string[] = []
  private lastAutoBackup = 0
  // Serializes all writes so rapid concurrent mutations apply in call order
  // (prevents lost updates when a refresh interrupts an in-flight write).
  private writeChain: Promise<void> = Promise.resolve()

  // ---- low-level (used by zustand adapter) -------------------------------
  private async readEnvelope(): Promise<Envelope | null> {
    const raw = await get<string>(STORE_KEY)
    if (raw == null) return null
    const parsed = JSON.parse(raw) as { state?: unknown; version?: number }
    const fromVersion = typeof parsed.version === 'number' ? parsed.version : 1
    const migrated = runMigrations((parsed.state ?? {}) as Record<string, unknown>, fromVersion)
    const { data, repaired } = validateAppData(migrated.data)
    this.lastRepaired = repaired
    this.lastIntegrity = repaired.length ? 'repaired' : 'ok'
    return { state: data, version: DATA_VERSION }
  }

  // ---- public API --------------------------------------------------------
  async load(): Promise<AppData> {
    try {
      const env = await this.readEnvelope()
      if (!env) {
        this.lastIntegrity = 'empty'
        return freshData()
      }
      return env.state
    } catch {
      // corruption — recover the most recent backup that actually has user
      // content (an empty snapshot must never be chosen over real data).
      const restored = await this.latestNonEmptyBackup()
      if (restored) {
        this.lastIntegrity = 'recovered'
        return restored
      }
      this.lastIntegrity = 'empty'
      return freshData()
    }
  }

  // Most recent backup that contains real user content, or null.
  private async latestNonEmptyBackup(): Promise<AppData | null> {
    const list = await this.listBackups() // already sorted newest-first
    const good = list.find((b) => hasUserContent(b.data))
    return good ? good.data : null
  }

  async save(data: AppData): Promise<void> {
    const { data: clean } = validateAppData(data)
    await set(STORE_KEY, JSON.stringify({ state: clean, version: DATA_VERSION } satisfies Envelope))
  }

  async update(patch: Partial<AppData>): Promise<AppData> {
    const cur = await this.load()
    const next = { ...cur, ...patch }
    await this.save(next)
    return next
  }

  async remove(): Promise<void> {
    await del(STORE_KEY)
  }

  // ---- backups -----------------------------------------------------------
  async listBackups(): Promise<BackupSnapshot[]> {
    const list = (await get<BackupSnapshot[]>(BACKUP_KEY)) ?? []
    return [...list].sort((a, b) => b.ts - a.ts)
  }

  async backup(reason: BackupSnapshot['reason'] = 'manual'): Promise<BackupSnapshot | null> {
    let data: AppData
    try {
      const env = await this.readEnvelope()
      if (!env) return null
      data = env.state
    } catch {
      return null
    }
    // Never snapshot an effectively-empty state — empty backups could otherwise
    // be restored over real data. Nothing to lose when there's no content.
    if (!hasUserContent(data)) return null
    return this.writeBackup(data, reason)
  }

  // Snapshot a specific, already-known AppData (used by the empty-overwrite guard
  // to capture the OUTGOING data before it's replaced).
  private async writeBackup(data: AppData, reason: BackupSnapshot['reason']): Promise<BackupSnapshot | null> {
    if (!hasUserContent(data)) return null
    const snap: BackupSnapshot = { id: genId(), ts: Date.now(), version: DATA_VERSION, data, reason }
    const list = await this.listBackups()
    const next = [snap, ...list].slice(0, MAX_BACKUPS)
    await set(BACKUP_KEY, next)
    return snap
  }

  // auto snapshot, throttled — called from the zustand setItem adapter
  private async maybeAutoBackup(): Promise<void> {
    const now = Date.now()
    if (now - this.lastAutoBackup < AUTO_BACKUP_INTERVAL_MS) return
    this.lastAutoBackup = now
    await this.backup('auto')
  }

  async restore(id: string): Promise<AppData | null> {
    const snap = (await this.listBackups()).find((b) => b.id === id)
    if (!snap) return null
    await this.backup('pre-restore')
    const { data } = validateAppData(snap.data)
    await this.save(data)
    return data
  }

  // ---- export / import ---------------------------------------------------
  async export(): Promise<string> {
    const data = await this.load()
    return JSON.stringify(
      { app: 'personal-os', version: DATA_VERSION, exportedAt: new Date().toISOString(), data },
      null,
      2,
    )
  }

  async import(json: string): Promise<{ ok: boolean; error?: string }> {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      return { ok: false, error: 'Not valid JSON.' }
    }
    // accept either a wrapped export or a raw AppData blob
    const obj = parsed as { app?: string; version?: number; data?: unknown }
    const candidate = obj && typeof obj === 'object' && 'data' in obj ? obj.data : parsed
    if (!candidate || typeof candidate !== 'object') {
      return { ok: false, error: 'File does not contain Personal OS data.' }
    }
    const migrated = runMigrations(candidate as Record<string, unknown>, obj?.version ?? 1)
    const { data } = validateAppData(migrated.data)
    await this.backup('pre-import')
    await this.save(data)
    return { ok: true }
  }

  // ---- maintenance -------------------------------------------------------
  async restoreDefaults(): Promise<AppData> {
    await this.backup('pre-reset')
    const data = freshData()
    await this.save(data)
    return data
  }

  // clears PWA caches + service worker, leaves data intact
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const names = await caches.keys()
      await Promise.all(names.map((n) => caches.delete(n)))
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
  }

  async diagnostics(): Promise<Diagnostics> {
    const raw = (await get<string>(STORE_KEY)) ?? ''
    const backups = await this.listBackups()
    const allKeys = (await idbKeys()) as string[]
    const keyInfo: { key: string; bytes: number }[] = []
    for (const k of allKeys) {
      const v = await get(String(k))
      const s = typeof v === 'string' ? v : JSON.stringify(v ?? '')
      keyInfo.push({ key: String(k), bytes: bytesOf(s) })
    }
    return {
      version: DATA_VERSION,
      integrity: this.lastIntegrity,
      storeBytes: bytesOf(raw),
      backupBytes: bytesOf(JSON.stringify(backups)),
      backupCount: backups.length,
      lastBackup: backups[0]?.ts ?? null,
      repairedKeys: this.lastRepaired,
      keys: keyInfo.sort((a, b) => b.bytes - a.bytes),
    }
  }

  // ---- zustand adapter ---------------------------------------------------
  // A StateStorage that validates+migrates on read and snapshots on write.
  createZustandStorage(): StateStorage {
    return {
      getItem: async () => {
        try {
          const env = await this.readEnvelope()
          if (!env) return null
          return JSON.stringify(env)
        } catch {
          const restored = await this.latestNonEmptyBackup()
          if (restored) {
            this.lastIntegrity = 'recovered'
            return JSON.stringify({ state: restored, version: DATA_VERSION })
          }
          this.lastIntegrity = 'empty'
          return null
        }
      },
      setItem: (name, value) => {
        // Chain writes so they commit strictly in the order they were issued.
        this.writeChain = this.writeChain
          .then(async () => {
            await this.maybeAutoBackup()
            await this.guardEmptyOverwrite(name, value)
            await set(name, value)
          })
          .catch(() => {
            /* keep the chain alive even if one write fails */
          })
        return this.writeChain
      },
      removeItem: async (name) => {
        await del(name)
      },
    }
  }

  // Defense-in-depth: if an EMPTY state is about to overwrite real stored data
  // (e.g. after a transient read error caused an empty hydrate, then a write),
  // snapshot the existing data first so it's always recoverable. Only does extra
  // work on the rare empty write; non-empty writes hit the fast path.
  private async guardEmptyOverwrite(name: string, value: string): Promise<void> {
    if (name !== STORE_KEY) return
    let incomingEmpty = false
    try {
      const parsed = JSON.parse(value) as { state?: AppData }
      incomingEmpty = !hasUserContent(parsed.state as AppData)
    } catch {
      return // unparseable incoming — don't block the write
    }
    if (!incomingEmpty) return
    try {
      const env = await this.readEnvelope()
      if (env && hasUserContent(env.state)) {
        await this.writeBackup(env.state, 'auto')
      }
    } catch {
      /* existing unreadable — nothing safe to snapshot */
    }
  }

  getIntegrity(): Integrity {
    return this.lastIntegrity
  }
}

export const storage = new StorageService()
