import { useSyncExternalStore } from 'react'
import { startPwa, subscribePwa, getPwaState, checkForUpdates, applyUpdate } from '@/lib/pwa/pwa'

// Ensure the SW registration starts as soon as anything consumes the hook.
startPwa()

export function usePwaUpdate() {
  const state = useSyncExternalStore(subscribePwa, getPwaState, getPwaState)
  return {
    ...state,
    checkForUpdates,
    applyUpdate,
  }
}
