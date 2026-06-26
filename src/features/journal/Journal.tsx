import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { Sparkline } from '@/components/ui/Sparkline'
import { SectionTitle, Textarea, Input, EmptyState, ExampleBadge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CardActions } from '@/components/ui/CardActions'
import { useTrash } from '@/lib/useTrash'
import { getMoodEmoji, MOOD_LABELS } from '@/lib/constants'
import { format, parseISO } from 'date-fns'
import type { JournalEntry } from '@/lib/types'

const PROMPTS = [
  { key: 'wentWell', label: 'What went well?', icon: '✅', placeholder: 'Wins, however small…' },
  { key: 'didntGoWell', label: 'What didn’t?', icon: '🔧', placeholder: 'Where you fell short…' },
  { key: 'lessons', label: 'Lessons', icon: '💡', placeholder: 'What you learned…' },
  { key: 'gratitude', label: 'Gratitude', icon: '🙏', placeholder: 'What you’re grateful for…' },
  { key: 'ideas', label: 'Ideas', icon: '⚡', placeholder: 'Sparks for QuantReflex / life…' },
] as const

export default function Journal() {
  const s = useAppStore()
  const [form, setForm] = useState({ wentWell: '', didntGoWell: '', lessons: '', gratitude: '', ideas: '', mood: 4 })
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<JournalEntry | null>(null)
  const trash = useTrash()
  const entries = useMemo(() => s.journal.filter((e) => !e.archived), [s.journal])

  const set = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }))

  const save = () => {
    if (Object.values(form).every((v) => v === '' || v === form.mood)) return
    s.addJournal(form)
    setForm({ wentWell: '', didntGoWell: '', lessons: '', gratitude: '', ideas: '', mood: 4 })
    toast.success('Entry saved · +15 XP')
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return entries
    const q = query.toLowerCase()
    return entries.filter((e) => [e.wentWell, e.didntGoWell, e.lessons, e.gratitude, e.ideas].join(' ').toLowerCase().includes(q))
  }, [query, entries])

  const moodSeries = useMemo(
    () => [...entries].reverse().map((e) => e.mood),
    [entries],
  )

  const keywords = useMemo(() => {
    const STOP = new Set('the a an and or but to of in on for with my i me is was were be been have has had this that it at as so not no got get day today will can do done more most just felt feel good bad went didnt dont im'.split(' '))
    const freq = new Map<string, number>()
    for (const e of entries) {
      const words = [e.wentWell, e.didntGoWell, e.lessons, e.gratitude, e.ideas].join(' ').toLowerCase().match(/[a-z]{4,}/g) ?? []
      for (const w of words) if (!STOP.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1)
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  }, [entries])

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="✍️ Journal" subtitle="Your reflections, searchable forever." />

      <GlassCard hoverable={false} className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Today’s reflection</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {PROMPTS.map((p) => (
            <div key={p.key}>
              <div className="mb-1.5 flex items-center gap-2 text-sm text-white/60">{p.icon} {p.label}</div>
              <Textarea rows={2} placeholder={p.placeholder} value={form[p.key]} onChange={(e) => set(p.key, e.target.value)} />
            </div>
          ))}
          <div>
            <div className="mb-1.5 text-sm text-white/60">{getMoodEmoji(form.mood)} Mood: {MOOD_LABELS[form.mood - 1]}</div>
            <input type="range" min={1} max={5} value={form.mood} onChange={(e) => set('mood', +e.target.value)} aria-label="Mood" className="w-full accent-accent" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={save}>Save entry · earns XP</Button>
        </div>
      </GlassCard>

      {entries.length > 1 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <GlassCard className="p-6 lg:col-span-1">
            <h3 className="mb-2 text-sm font-semibold">Mood timeline</h3>
            <Sparkline data={moodSeries} color="#f472b6" width={260} height={70} />
            <div className="mt-2 text-xs text-white/40">{entries.length} entries · latest {getMoodEmoji(entries[0].mood)}</div>
          </GlassCard>
          <GlassCard className="p-6 lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold">What you write about most</h3>
            {keywords.length === 0 ? (
              <p className="text-sm text-white/35">Write a few entries to reveal your themes.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {keywords.map(([word, n]) => (
                  <span key={word} className="rounded-full bg-accent/10 px-3 py-1 text-sm text-accent-soft" style={{ fontSize: `${0.8 + Math.min(0.6, n * 0.12)}rem` }}>
                    {word} <span className="text-white/30">{n}</span>
                  </span>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Past entries</h2>
        <Input placeholder="Search journal…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((e) => (
          <GlassCard key={e.id} className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-accent-soft">
                {format(parseISO(e.date), 'EEEE, d MMM yyyy')}
                {e.example && <ExampleBadge />}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-lg">{getMoodEmoji(e.mood)}</span>
                <CardActions
                  label="Journal entry actions"
                  actions={[
                    { label: 'Edit', icon: '✎', onClick: () => setEditing(e) },
                    { label: 'Archive', icon: '📦', onClick: () => trash('journal', e) },
                  ]}
                />
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {e.wentWell && <p><span className="text-good">✅ </span><span className="text-white/70">{e.wentWell}</span></p>}
              {e.didntGoWell && <p><span className="text-warn">🔧 </span><span className="text-white/70">{e.didntGoWell}</span></p>}
              {e.lessons && <p><span>💡 </span><span className="text-white/70">{e.lessons}</span></p>}
              {e.gratitude && <p><span>🙏 </span><span className="text-white/70">{e.gratitude}</span></p>}
              {e.ideas && <p><span>⚡ </span><span className="text-white/70">{e.ideas}</span></p>}
            </div>
          </GlassCard>
        ))}
        {filtered.length === 0 && (
          <div className="md:col-span-2">
            <EmptyState icon="📓" title={query ? `No entries match “${query}”` : 'Every great journey deserves a story'} hint={query ? 'Try a different search.' : 'Write your first reflection above — your entries stay private on this device and become searchable forever.'} />
          </div>
        )}
      </div>

      <EditJournalModal entry={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function EditJournalModal({ entry, onClose }: { entry: JournalEntry | null; onClose: () => void }) {
  const updateJournal = useAppStore((s) => s.updateJournal)
  const [form, setForm] = useState({ wentWell: '', didntGoWell: '', lessons: '', gratitude: '', ideas: '', mood: 4 })
  useEffect(() => {
    if (entry) setForm({ wentWell: entry.wentWell, didntGoWell: entry.didntGoWell, lessons: entry.lessons, gratitude: entry.gratitude, ideas: entry.ideas, mood: entry.mood })
  }, [entry])
  const set = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }))
  const submit = () => {
    if (!entry) return
    updateJournal(entry.id, form)
    onClose()
  }
  return (
    <Modal open={!!entry} onClose={onClose} title="Edit entry" wide>
      <div className="grid gap-4 md:grid-cols-2">
        {PROMPTS.map((p) => (
          <div key={p.key}>
            <div className="mb-1.5 flex items-center gap-2 text-sm text-white/60">{p.icon} {p.label}</div>
            <Textarea rows={2} placeholder={p.placeholder} value={form[p.key]} onChange={(e) => set(p.key, e.target.value)} />
          </div>
        ))}
        <div>
          <div className="mb-1.5 text-sm text-white/60">{getMoodEmoji(form.mood)} Mood: {MOOD_LABELS[form.mood - 1]}</div>
          <input type="range" min={1} max={5} value={form.mood} onChange={(e) => set('mood', +e.target.value)} aria-label="Mood" className="w-full accent-accent" />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit}>Save</Button>
      </div>
    </Modal>
  )
}
