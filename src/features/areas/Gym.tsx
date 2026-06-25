import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionTitle, Stat, Tag, Input } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LineChart, BarChart } from '@/components/charts/Charts'
import { Sparkline } from '@/components/ui/Sparkline'
import { getMoodEmoji } from '@/lib/constants'
import { format, parseISO } from 'date-fns'

export default function Gym() {
  const s = useAppStore()
  const [open, setOpen] = useState(false)
  const weights = s.gym.weights
  const latest = weights[weights.length - 1]?.weight ?? 0
  const first = weights[0]?.weight ?? latest
  const delta = (latest - first).toFixed(1)
  const daily = [...s.gym.daily].reverse()

  const meas = s.gym.measurements
  const measFirst = meas[0]
  const measLast = meas[meas.length - 1]
  const measRows = measFirst && measLast
    ? ([['Chest', measFirst.chest, measLast.chest], ['Waist', measFirst.waist, measLast.waist], ['Arms', measFirst.arms, measLast.arms]] as const)
    : []
  const workoutsThisWeek = s.gym.workouts.filter((w) => Date.now() - new Date(w.date).getTime() < 7 * 86400000).length
  const avgVolume = s.gym.workouts.length ? Math.round(s.gym.workouts.reduce((a, w) => a + w.volume, 0) / s.gym.workouts.length) : 0

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="💪 Gym & Body" subtitle="Strength, recovery, and the dream physique — tracked." action={<Button onClick={() => setOpen(true)}>＋ Log weight</Button>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5"><Stat label="Current weight" value={`${latest}kg`} sub={`${+delta >= 0 ? '+' : ''}${delta}kg total`} color="#34d399" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Workouts" value={s.gym.workouts.length} sub="logged" color="#7c5cff" /></GlassCard>
        <GlassCard className="p-5"><Stat label="PRs set" value={s.gym.prs.length} color="#fbbf24" /></GlassCard>
        <GlassCard className="p-5">
          <div className="text-[11px] uppercase tracking-wider text-white/40">Avg recovery</div>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-2xl font-bold text-good">{Math.round(daily.reduce((a, d) => a + d.recovery, 0) / Math.max(1, daily.length))}%</span>
            <Sparkline data={daily.map((d) => d.recovery)} color="#34d399" width={70} height={28} />
          </div>
        </GlassCard>
      </div>

      {/* Consistency + body composition */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold">This week</h3>
          <div className="mt-3 text-4xl font-black text-accent-soft">{workoutsThisWeek}<span className="ml-1 text-base font-normal text-white/40">workouts</span></div>
          <div className="mt-1 text-xs text-white/40">Avg session volume {avgVolume.toLocaleString()} kg</div>
        </GlassCard>
        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Body composition trend</h3>
          {measRows.length === 0 ? (
            <p className="text-sm text-white/35">Log measurements to see trends.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {measRows.map(([label, from, to]) => {
                const d = +(to - from).toFixed(1)
                const good = label === 'Waist' ? d < 0 : d > 0
                return (
                  <div key={label} className="rounded-xl bg-white/[0.03] p-4 text-center">
                    <div className="text-[11px] uppercase tracking-wider text-white/40">{label}</div>
                    <div className="mt-1 text-2xl font-bold">{to}<span className="text-sm text-white/40">cm</span></div>
                    <div className={`mt-0.5 text-xs ${good ? 'text-good' : 'text-bad'}`}>{d >= 0 ? '+' : ''}{d}cm</div>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Weight trend</h2>
          <LineChart labels={weights.map((w) => format(parseISO(w.date), 'd MMM'))} datasets={[{ label: 'kg', data: weights.map((w) => w.weight), color: '#34d399' }]} height={240} />
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Workout volume · recent</h2>
          <BarChart labels={s.gym.workouts.slice(0, 12).reverse().map((w) => w.name)} data={s.gym.workouts.slice(0, 12).reverse().map((w) => w.volume)} color="#7c5cff" height={240} />
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Personal records</h2>
          <div className="space-y-3">
            {s.gym.prs.map((pr) => (
              <div key={pr.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                <div><div className="text-sm font-medium">{pr.lift}</div><div className="text-[11px] text-white/40">{format(parseISO(pr.date), 'd MMM')}</div></div>
                <div className="text-xl font-bold text-warn">{pr.value}<span className="text-sm font-normal text-white/40">{pr.unit}</span></div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Recovery dashboard · last days</h2>
          <div className="-mx-6 overflow-x-auto px-6">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-white/35">
                <tr><th className="pb-2">Date</th><th>Sleep</th><th>Water</th><th>Protein</th><th>Mood</th><th>Recovery</th></tr>
              </thead>
              <tbody>
                {daily.slice(-7).reverse().map((d) => (
                  <tr key={d.date} className="border-t border-white/5">
                    <td className="py-2 text-white/50">{format(parseISO(d.date), 'd MMM')}</td>
                    <td>{d.sleep}h</td>
                    <td>{d.water}L</td>
                    <td>{d.protein}g</td>
                    <td>{getMoodEmoji(d.mood)}</td>
                    <td><Tag color={d.recovery >= 75 ? '#34d399' : d.recovery >= 60 ? '#fbbf24' : '#fb7185'}>{d.recovery}%</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Log body weight">
        <WeightForm onClose={() => setOpen(false)} />
      </Modal>
    </div>
  )
}

function WeightForm({ onClose }: { onClose: () => void }) {
  const addWeight = useAppStore((s) => s.addWeight)
  const [w, setW] = useState('71')
  return (
    <div className="space-y-4">
      <div><div className="mb-1.5 text-xs text-white/40">Weight (kg)</div><Input type="number" step="0.1" value={w} onChange={(e) => setW(e.target.value)} autoFocus /></div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => { addWeight(+w); onClose() }}>Log</Button>
      </div>
    </div>
  )
}
