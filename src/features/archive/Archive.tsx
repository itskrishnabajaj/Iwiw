import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppStore } from '@/store/useAppStore'
import { ENTITIES, type EntityKind } from '@/lib/entities'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionTitle, EmptyState, Tag } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Row { kind: EntityKind; key: string; title: string; module: string; archivedAt?: number }

export default function Archive() {
  const s = useAppStore()
  const restoreEntity = useAppStore((st) => st.restoreEntity)
  const permaDelete = useAppStore((st) => st.permaDelete)
  const [confirm, setConfirm] = useState<Row | null>(null)

  const rows = useMemo(() => {
    const out: Row[] = []
    for (const kind of Object.keys(ENTITIES) as EntityKind[]) {
      const def = ENTITIES[kind]
      for (const item of def.get(s)) {
        if (item.archived) out.push({ kind, key: String(item[def.key]), title: def.title(item), module: def.module, archivedAt: item.archivedAt })
      }
    }
    return out.sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0))
  }, [s])

  const byModule = useMemo(() => {
    const m = new Map<string, Row[]>()
    for (const r of rows) {
      const list = m.get(r.module) ?? []
      list.push(r)
      m.set(r.module, list)
    }
    return [...m.entries()]
  }, [rows])

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="🗄 Archive" subtitle="Archived records are kept safe here — restore anytime, or delete permanently." />

      {rows.length === 0 ? (
        <GlassCard hoverable={false} className="p-2">
          <EmptyState icon="🗄" title="Nothing archived" hint="When you archive a journal entry, mock, workout, transaction or other record, it lands here — recoverable, never silently lost." />
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {byModule.map(([module, list]) => (
            <GlassCard key={module} hoverable={false} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-accent-soft">{module}</h3>
                <Tag>{list.length}</Tag>
              </div>
              <div className="space-y-2">
                {list.map((r) => (
                  <div key={`${r.kind}:${r.key}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="truncate text-white/80">{r.title}</div>
                      <div className="text-[11px] text-white/35">{ENTITIES[r.kind].label}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button size="sm" variant="glass" onClick={() => { restoreEntity(r.kind, r.key); toast.success(`${ENTITIES[r.kind].label} restored`) }}>Restore</Button>
                      <Button size="sm" variant="ghost" className="text-bad" onClick={() => setConfirm(r)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={`Delete ${confirm ? ENTITIES[confirm.kind].label.toLowerCase() : 'item'} permanently?`}
        message="This removes the record for good. This cannot be undone."
        confirmLabel="Delete permanently"
        onConfirm={() => { if (confirm) { permaDelete(confirm.kind, confirm.key); toast('Permanently deleted') } }}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}
