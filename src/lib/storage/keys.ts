// Central registry of persistence keys. Nothing else should hard-code these.
export const STORE_KEY = 'personal-os-v1' // zustand-persisted app data ({state, version})
export const BACKUP_KEY = 'personal-os-backups' // array of snapshots
export const MAX_BACKUPS = 8
export const AUTO_BACKUP_INTERVAL_MS = 10 * 60 * 1000 // snapshot at most every 10 min
export const PREFS_KEY = 'personal-os-prefs' // tiny UI prefs (localStorage)
