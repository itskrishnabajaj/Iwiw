import { get, set, del } from 'idb-keyval'
import type { StateStorage } from 'zustand/middleware'

// IndexedDB-backed storage for zustand persist, with a localStorage fallback.
const memoryAvailable = (() => {
  try {
    indexedDB // eslint-disable-line @typescript-eslint/no-unused-expressions
    return true
  } catch {
    return false
  }
})()

export const idbStorage: StateStorage = {
  getItem: async (name) => {
    try {
      if (memoryAvailable) return (await get(name)) ?? null
    } catch {
      /* fall through */
    }
    return localStorage.getItem(name)
  },
  setItem: async (name, value) => {
    try {
      if (memoryAvailable) {
        await set(name, value)
        return
      }
    } catch {
      /* fall through */
    }
    localStorage.setItem(name, value)
  },
  removeItem: async (name) => {
    try {
      if (memoryAvailable) {
        await del(name)
        return
      }
    } catch {
      /* fall through */
    }
    localStorage.removeItem(name)
  },
}
