import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionTitle, Textarea, Input } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { format, parseISO } from 'date-fns'

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

  const set = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }))

  const save = () => {
    if (Object.values(form).every((v) => v === '' || v === form.mood)) return
    s.addJournal(form)
    setForm({ wentWell: '', didntGoWell: '', lessons: '', gratitude: '', ideas: '', mood: 4 })
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return s.journal
    const q = query.toLowerCase()
    return s.journal.filter((e) => [e.wentWell, e.didntGoWell, e.lessons, e.gratitude, e.ideas].join(' ').toLowerCase().includes(q))
  }, [query, s.journal])

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
            <div className="mb-1.5 text-sm text-white/60">😊 Mood: {'😴😐🙂😀🤩'[form.mood - 1]}</div>
            <input type="range" min={1} max={5} value={form.mood} onChange={(e) => set('mood', +e.target.value)} className="w-full accent-accent" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={save}>Save entry · earns XP</Button>
        </div>
      </GlassCard>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Past entries</h2>
        <Input placeholder="Search journal…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((e) => (
          <GlassCard key={e.id} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-accent-soft">{format(parseISO(e.date), 'EEEE, d MMM yyyy')}</span>
              <span className="text-lg">{'😴😐🙂😀🤩'[e.mood - 1]}</span>
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
        {filtered.length === 0 && <div className="text-sm text-white/35">No entries match “{query}”.</div>}
      </div>
    </div>
  )
}
