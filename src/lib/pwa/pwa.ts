import { registerSW } from 'virtual:pwa-register'

// Single source of truth for the PWA update lifecycle. One registration is shared
// by the update banner (App) and the "Check for Updates" button (Settings).

export type UpdateStatus = 'idle' | 'checking' | 'up-to-date' | 'available' | 'error'

interface PwaState {
  needRefresh: boolean
  offlineReady: boolean
  status: UpdateStatus
}

let state: PwaState = { needRefresh: false, offlineReady: false, status: 'idle' }
let registration: ServiceWorkerRegistration | undefined
let updateSW: ((reload?: boolean) => Promise<void>) | undefined
let started = false

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const set = (patch: Partial<PwaState>) => {
  state = { ...state, ...patch }
  emit()
}

// Idempotent: registers the service worker once (no-op when unsupported / in dev
// where the SW isn't generated).
export function startPwa(): void {
  if (started || typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  started = true
  try {
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        set({ needRefresh: true, status: 'available' })
      },
      onOfflineReady() {
        set({ offlineReady: true })
      },
      onRegisteredSW(_swUrl, reg) {
        registration = reg
        // Periodically ask the server whether a newer worker exists (hourly).
        if (reg) {
          window.setInterval(() => {
            reg.update().catch(() => {})
          }, 60 * 60 * 1000)
        }
      },
      onRegisterError() {
        set({ status: 'error' })
      },
    })
  } catch {
    set({ status: 'error' })
  }
}

export function subscribePwa(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getPwaState(): PwaState {
  return state
}

// Manual "Check for Updates": ask the SW to re-fetch and compare. If a new worker
// installs, onNeedRefresh flips status to 'available'; otherwise report up-to-date.
export async function checkForUpdates(): Promise<UpdateStatus> {
  if (!('serviceWorker' in navigator)) {
    set({ status: 'error' })
    return 'error'
  }
  set({ status: 'checking' })
  try {
    const reg = registration ?? (await navigator.serviceWorker.getRegistration())
    if (!reg) {
      set({ status: 'error' })
      return 'error'
    }
    await reg.update()
    // Give the browser a tick to surface a waiting worker / fire onNeedRefresh.
    await new Promise((r) => setTimeout(r, 600))
    if (state.needRefresh || reg.waiting) {
      set({ status: 'available', needRefresh: true })
      return 'available'
    }
    set({ status: 'up-to-date' })
    return 'up-to-date'
  } catch {
    set({ status: 'error' })
    return 'error'
  }
}

// Apply the waiting update: skip-waiting + full reload. IndexedDB + localStorage
// are untouched by the service worker, so all data + preferences are preserved.
export async function applyUpdate(): Promise<void> {
  try {
    if (updateSW) await updateSW(true)
    else window.location.reload()
  } catch {
    window.location.reload()
  }
}
