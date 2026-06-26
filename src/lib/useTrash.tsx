import toast from 'react-hot-toast'
import { useAppStore } from '@/store/useAppStore'
import { ENTITIES, isHistorical, type EntityKind } from '@/lib/entities'

// Contextual deletion (single source of truth for the policy):
//  - historical records  → ARCHIVE (recoverable in /archive), with an Undo toast
//  - disposable items     → permanent delete, with an Undo toast that re-inserts
//    the exact item at its original position.
// No confirmation dialogs on the hot path — recovery is one tap on the toast,
// and permanent deletion of historical records lives only in the Archive view.
export function useTrash() {
  const archiveEntity = useAppStore((s) => s.archiveEntity)
  const permaDelete = useAppStore((s) => s.permaDelete)
  const replaceCollection = useAppStore((s) => s.replaceCollection)

  // item is the raw entity from any collection — typed loosely on purpose.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (kind: EntityKind, item: any) => {
    const def = ENTITIES[kind]
    const key = String(item[def.key])
    // Snapshot the whole collection BEFORE mutating so Undo restores exactly —
    // including ordering and any side effects (e.g. goal child re-parenting).
    const snapshot = [...def.get(useAppStore.getState())]

    if (isHistorical(kind)) {
      archiveEntity(kind, key)
      undoToast(`${def.label} archived`, () => replaceCollection(kind, snapshot))
    } else {
      permaDelete(kind, key)
      undoToast(`${def.label} deleted`, () => replaceCollection(kind, snapshot))
    }
  }
}

export function undoToast(message: string, undo: () => void) {
  toast(
    (tt) => (
      <span className="flex items-center gap-3">
        <span>{message}</span>
        <button
          onClick={() => {
            undo()
            toast.dismiss(tt.id)
          }}
          className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-accent-soft hover:bg-white/20"
        >
          Undo
        </button>
      </span>
    ),
    { duration: 6000 },
  )
}
