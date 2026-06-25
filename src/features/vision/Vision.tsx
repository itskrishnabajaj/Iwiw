import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionTitle, Input, EmptyState } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

const GRADIENTS = [
  'linear-gradient(135deg,#7c5cff,#36e6e0)',
  'linear-gradient(135deg,#f472b6,#a855f7)',
  'linear-gradient(135deg,#34d399,#36e6e0)',
  'linear-gradient(135deg,#fbbf24,#fb923c)',
  'linear-gradient(135deg,#60a5fa,#7c5cff)',
  'linear-gradient(135deg,#fb7185,#fbbf24)',
]

export default function Vision() {
  const s = useAppStore()
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="✧ Vision Board" subtitle="The future you’re building toward — make it vivid." action={<Button onClick={() => setOpen(true)}>＋ Add vision</Button>} />

      {s.vision.length === 0 && (
        <EmptyState icon="✧" title="Your vision board is empty" hint="Add the colleges, physique, income and life you’re building toward." />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {s.vision.map((v, i) => (
          <motion.div key={v.id} whileHover={{ y: -6, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <GlassCard hoverable={false} className="group relative h-56 overflow-hidden p-0">
              {v.image ? (
                <img src={v.image} alt={v.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ background: GRADIENTS[i % GRADIENTS.length], opacity: 0.85 }}>
                  <span className="text-6xl drop-shadow-lg">{v.emoji}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="text-[10px] uppercase tracking-wider text-white/60">{v.category}</div>
                <div className="line-clamp-2 text-lg font-bold">{v.title}</div>
                <div className="line-clamp-1 text-sm text-white/70">{v.caption}</div>
              </div>
              <button onClick={() => useAppStore.setState((st) => ({ vision: st.vision.filter((x) => x.id !== v.id) }))} aria-label={`Delete ${v.title}`} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/60 opacity-0 transition hover:text-bad focus-visible:opacity-100 group-hover:opacity-100">×</button>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <AddVisionModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function AddVisionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addVision = useAppStore((s) => s.addVision)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [category, setCategory] = useState('Dream')
  const [emoji, setEmoji] = useState('🎯')
  const [image, setImage] = useState<string | undefined>()

  const onFile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const emojis = ['🎯', '🎓', '🏢', '💪', '💰', '🎤', '📈', '🏆', '🌍', '🚀']

  return (
    <Modal open={open} onClose={onClose} title="Add to vision board">
      <div className="space-y-4">
        <Input placeholder="Title (e.g. IIM Ahmedabad)" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <Input placeholder="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <div>
          <div className="mb-1.5 text-xs text-white/40">Emoji (if no image)</div>
          <div className="flex flex-wrap gap-2">
            {emojis.map((e) => <button key={e} onClick={() => setEmoji(e)} className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${emoji === e ? 'bg-accent/30 ring-1 ring-accent' : 'bg-white/5'}`}>{e}</button>)}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-xs text-white/40">Or upload an image</div>
          <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="text-sm text-white/50 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-white" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (title.trim()) { addVision({ title: title.trim(), caption, category, emoji, image }); onClose() } }}>Add</Button>
        </div>
      </div>
    </Modal>
  )
}
