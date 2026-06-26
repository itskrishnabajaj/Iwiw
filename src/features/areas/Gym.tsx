import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionTitle, Stat, Tag, Input, EmptyState, Segmented } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CardActions } from '@/components/ui/CardActions'
import { LineChart, BarChart } from '@/components/charts/Charts'
import { Sparkline } from '@/components/ui/Sparkline'
import { getMoodEmoji } from '@/lib/constants'
import { todayISO } from '@/lib/dates'
import { format, parseISO } from 'date-fns'

type LogKind = 'weight' | 'workout' | 'pr' | 'recovery' | 'measurement'

export default function Gym() {
  const s = useAppStore()
  const [open, setOpen] = useState(false)
  const weights = s.gym.weights.filter((w) => !w.archived)
  const latest = weights[weights.length - 1]?.weight ?? 0
  const first = weights[0]?.weight ?? latest
  const delta = (latest - first).toFixed(1)
  const workouts = s.gym.workouts.filter((w) => !w.archived)
  const prs = s.gym.prs.filter((p) => !p.archived)
  const daily = [...s.gym.daily.filter((d) => !d.archived)].reverse()

  const meas = s.gym.measurements.filter((m) => !m.archived)
  const measFirst = meas[0]
  const measLast = meas[meas.length - 1]
  const measRows = measFirst && measLast
    ? ([['Chest', measFirst.chest, measLast.chest], ['Waist', measFirst.waist, measLast.waist], ['Arms', measFirst.arms, measLast.arms]] as const)
    : []
  const workoutsThisWeek = workouts.filter((w) => Date.now() - new Date(w.date).getTime() < 7 * 86400000).length
  const avgVolume = workouts.length ? Math.round(workouts.reduce((a, w) => a + w.volume, 0) / workouts.length) : 0

  const empty = weights.length === 0 && workouts.length === 0 && prs.length === 0 && daily.length === 0 && meas.length === 0

  if (empty) {
    return (
      <div className="space-y-6 pt-2">
        <SectionTitle title="💪 Gym & Body" subtitle="Strength, recovery, and the dream physique — tracked." action={<Button onClick={() => setOpen(true)}>＋ Log</Button>} />
        <GlassCard hoverable={false} className="p-2">
          <EmptyState
            icon="💪"
            title="You haven't logged a workout yet"
            hint="Track your bodyweight, workouts, PRs, recovery and measurements to watch your physique transform over time."
            action={<Button onClick={() => setOpen(true)}>＋ Log your first entry</Button>}
          />
        </GlassCard>
        <GymLogModal open={open} onClose={() => setOpen(false)} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="💪 Gym & Body" subtitle="Strength, recovery, and the dream physique — tracked." action={<Button onClick={() => setOpen(true)}>＋ Log</Button>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5"><Stat label="Current weight" value={`${latest}kg`} sub={`${+delta >= 0 ? '+' : ''}${delta}kg total`} color="#34d399" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Workouts" value={workouts.length} sub="logged" color="#7c5cff" /></GlassCard>
        <GlassCard className="p-5"><Stat label="PRs set" value={prs.length} color="#fbbf24" /></GlassCard>
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
          <BarChart labels={workouts.slice(0, 12).reverse().map((w) => w.name)} data={workouts.slice(0, 12).reverse().map((w) => w.volume)} color="#7c5cff" height={240} />
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Personal records</h2>
          <div className="space-y-3">
            {prs.length === 0 && <p className="text-sm text-white/35">No PRs yet — log your first lift.</p>}
            {prs.map((pr) => (
              <div key={pr.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                <div><div className="flex items-center gap-2 text-sm font-medium">{pr.lift}</div><div className="text-[11px] text-white/40">{format(parseISO(pr.date), 'd MMM')}</div></div>
                <div className="flex items-center gap-1">
                  <div className="text-xl font-bold text-warn">{pr.value}<span className="text-sm font-normal text-white/40">{pr.unit}</span></div>
                  <CardActions label={`Actions for ${pr.lift}`} actions={[{ label: 'Delete', icon: '🗑', danger: true, onClick: () => { s.deletePR(pr.id); toast('PR deleted') } }]} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Recovery dashboard · last days</h2>
          <div className="-mx-6 overflow-x-auto px-6">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-white/35">
                <tr><th className="pb-2">Date</th><th>Sleep</th><th>Water</th><th>Protein</th><th>Mood</th><th>Recovery</th><th></th></tr>
              </thead>
              <tbody>
                {daily.length === 0 && <tr><td colSpan={7} className="py-3 text-white/35">No recovery data — log a day to start tracking.</td></tr>}
                {daily.slice(-7).reverse().map((d) => (
                  <tr key={d.date} className="border-t border-white/5">
                    <td className="py-2 text-white/50">{format(parseISO(d.date), 'd MMM')}</td>
                    <td>{d.sleep}h</td>
                    <td>{d.water}L</td>
                    <td>{d.protein}g</td>
                    <td>{getMoodEmoji(d.mood)}</td>
                    <td><Tag color={d.recovery >= 75 ? '#34d399' : d.recovery >= 60 ? '#fbbf24' : '#fb7185'}>{d.recovery}%</Tag></td>
                    <td><button onClick={() => { s.deleteGymDaily(d.date); toast('Day removed') }} aria-label="Delete day" className="px-1 text-white/30 hover:text-bad">×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {workouts.length > 0 && (
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent workouts</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {workouts.slice(0, 10).map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-2.5 text-sm">
                <div><span className="font-medium">{w.name}</span> <span className="text-[11px] text-white/35">{format(parseISO(w.date), 'd MMM')}</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-white/55">{w.volume.toLocaleString()}kg · {w.duration}m</span>
                  <CardActions label={`Actions for ${w.name}`} actions={[{ label: 'Delete', icon: '🗑', danger: true, onClick: () => { s.deleteWorkout(w.id); toast('Workout deleted') } }]} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <GymLogModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function GymLogModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useAppStore()
  const [kind, setKind] = useState<LogKind>('weight')
  const [weight, setWeight] = useState('71')
  const [woName, setWoName] = useState('Push')
  const [woVolume, setWoVolume] = useState('5000')
  const [woDuration, setWoDuration] = useState('60')
  const [prLift, setPrLift] = useState('Bench Press')
  const [prValue, setPrValue] = useState('80')
  const [prUnit, setPrUnit] = useState('kg')
  const [rcSleep, setRcSleep] = useState('7')
  const [rcWater, setRcWater] = useState('3')
  const [rcProtein, setRcProtein] = useState('120')
  const [rcRecovery, setRcRecovery] = useState('75')
  const [mChest, setMChest] = useState('100')
  const [mWaist, setMWaist] = useState('80')
  const [mArms, setMArms] = useState('36')

  const submit = () => {
    if (kind === 'weight') s.addWeight(+weight)
    else if (kind === 'workout') s.addWorkout({ date: todayISO(), name: woName.trim() || 'Workout', volume: +woVolume, duration: +woDuration })
    else if (kind === 'pr') s.addPR({ lift: prLift.trim() || 'Lift', value: +prValue, unit: prUnit, date: todayISO() })
    else if (kind === 'recovery') s.upsertGymDaily(todayISO(), { sleep: +rcSleep, water: +rcWater, protein: +rcProtein, recovery: +rcRecovery, mood: 3, calories: 2200 })
    else if (kind === 'measurement') s.addMeasurement({ date: todayISO(), chest: +mChest, waist: +mWaist, arms: +mArms })
    toast.success('Logged')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Log to your gym tracker">
      <div className="space-y-4">
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { label: 'Weight', value: 'weight' },
            { label: 'Workout', value: 'workout' },
            { label: 'PR', value: 'pr' },
            { label: 'Recovery', value: 'recovery' },
            { label: 'Body', value: 'measurement' },
          ]}
        />
        {kind === 'weight' && (
          <div><div className="mb-1.5 text-xs text-white/40">Weight (kg)</div><Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} autoFocus /></div>
        )}
        {kind === 'workout' && (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3"><div className="mb-1.5 text-xs text-white/40">Workout</div><Input value={woName} onChange={(e) => setWoName(e.target.value)} /></div>
            <div><div className="mb-1.5 text-xs text-white/40">Volume (kg)</div><Input type="number" value={woVolume} onChange={(e) => setWoVolume(e.target.value)} /></div>
            <div><div className="mb-1.5 text-xs text-white/40">Duration (m)</div><Input type="number" value={woDuration} onChange={(e) => setWoDuration(e.target.value)} /></div>
          </div>
        )}
        {kind === 'pr' && (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3"><div className="mb-1.5 text-xs text-white/40">Lift</div><Input value={prLift} onChange={(e) => setPrLift(e.target.value)} /></div>
            <div className="col-span-2"><div className="mb-1.5 text-xs text-white/40">Value</div><Input type="number" value={prValue} onChange={(e) => setPrValue(e.target.value)} /></div>
            <div><div className="mb-1.5 text-xs text-white/40">Unit</div><Input value={prUnit} onChange={(e) => setPrUnit(e.target.value)} /></div>
          </div>
        )}
        {kind === 'recovery' && (
          <div className="grid grid-cols-2 gap-3">
            <div><div className="mb-1.5 text-xs text-white/40">Sleep (h)</div><Input type="number" step="0.1" value={rcSleep} onChange={(e) => setRcSleep(e.target.value)} /></div>
            <div><div className="mb-1.5 text-xs text-white/40">Water (L)</div><Input type="number" step="0.1" value={rcWater} onChange={(e) => setRcWater(e.target.value)} /></div>
            <div><div className="mb-1.5 text-xs text-white/40">Protein (g)</div><Input type="number" value={rcProtein} onChange={(e) => setRcProtein(e.target.value)} /></div>
            <div><div className="mb-1.5 text-xs text-white/40">Recovery (%)</div><Input type="number" value={rcRecovery} onChange={(e) => setRcRecovery(e.target.value)} /></div>
          </div>
        )}
        {kind === 'measurement' && (
          <div className="grid grid-cols-3 gap-3">
            <div><div className="mb-1.5 text-xs text-white/40">Chest (cm)</div><Input type="number" value={mChest} onChange={(e) => setMChest(e.target.value)} /></div>
            <div><div className="mb-1.5 text-xs text-white/40">Waist (cm)</div><Input type="number" value={mWaist} onChange={(e) => setMWaist(e.target.value)} /></div>
            <div><div className="mb-1.5 text-xs text-white/40">Arms (cm)</div><Input type="number" value={mArms} onChange={(e) => setMArms(e.target.value)} /></div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Log</Button>
        </div>
      </div>
    </Modal>
  )
}
