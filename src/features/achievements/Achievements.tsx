import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { Progress } from '@/components/ui/Progress'
import { SectionTitle, Segmented } from '@/components/ui/primitives'
import { evaluateAchievements, TIER_COLOR } from '@/data/achievements'

type Filter = 'all' | 'unlocked' | 'locked'

export default function Achievements() {
  const s = useAppStore()
  const [filter, setFilter] = useState<Filter>('all')
  const list = useMemo(() => evaluateAchievements(s), [s])
  const unlocked = list.filter((a) => a.unlocked).length

  const shown = list.filter((a) => (filter === 'all' ? true : filter === 'unlocked' ? a.unlocked : !a.unlocked))

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle
        title="🏆 Achievements"
        subtitle={`${unlocked} of ${list.length} unlocked · earned through real work`}
        action={<Segmented value={filter} onChange={setFilter} options={[{ label: 'All', value: 'all' }, { label: 'Unlocked', value: 'unlocked' }, { label: 'Locked', value: 'locked' }]} />}
      />

      <GlassCard hoverable={false} className="p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">Collection progress</span>
          <span className="font-semibold text-accent-soft">{Math.round((unlocked / list.length) * 100)}%</span>
        </div>
        <Progress value={(unlocked / list.length) * 100} className="mt-3" height={10} />
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((a, i) => {
          const color = TIER_COLOR[a.tier]
          return (
            <motion.div key={a.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}>
              <GlassCard className={`p-5 ${a.unlocked ? '' : 'opacity-70'}`} glow={a.unlocked ? color : undefined}>
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ background: a.unlocked ? color + '22' : 'rgba(255,255,255,0.04)', filter: a.unlocked ? 'none' : 'grayscale(1)' }}>
                    {a.unlocked ? a.icon : '🔒'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{a.title}</span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color }}>{a.tier}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-white/45">{a.description}</p>
                  </div>
                </div>
                {!a.unlocked && (
                  <div className="mt-4">
                    <Progress value={a.progress} color={color} height={5} />
                    <div className="mt-1 text-right text-[11px] text-white/35">{a.progress}%</div>
                  </div>
                )}
                {a.unlocked && <div className="mt-3 text-right text-[11px] font-medium" style={{ color }}>✓ Unlocked</div>}
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
