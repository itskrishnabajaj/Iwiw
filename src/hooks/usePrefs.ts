import { useSyncExternalStore } from 'react'
import { loadPrefs, savePrefs, subscribePrefs, applyPrefs, type Prefs } from '@/lib/storage/prefs'

let cache: Prefs = loadPrefs()
subscribePrefs((p) => {
  cache = p
})

const getSnapshot = () => cache

// Subscribe React components to UI prefs (localStorage-backed).
export function usePrefs(): [Prefs, (patch: Partial<Prefs>) => void] {
  const prefs = useSyncExternalStore(subscribePrefs, getSnapshot, getSnapshot)
  const update = (patch: Partial<Prefs>) => {
    const next = savePrefs(patch)
    applyPrefs(next)
  }
  return [prefs, update]
}
