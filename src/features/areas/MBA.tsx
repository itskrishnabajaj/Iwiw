import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { predictedPercentile, studyStreak, todayFocusScore } from '@/store/selectors'
import { GlassCard } from '@/components/ui/GlassCard'
import { Progress } from '@/components/ui/Progress'
import { Ring } from '@/components/ui/Ring'
import { CountUp } from '@/components/ui/CountUp'
import { SectionTitle, Stat, Tag, Input, Segmented } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LineChart, BarChart } from '@/components/charts/Charts'
import { format, parseISO } from 'date-fns'
import { todayISO } from '@/lib/dates'

export default function MBA() {
  const s = useAppStore()
  const [logOpen, setLogOpen] = useState(false)
  const [mockOpen, setMockOpen] = useState(false)
  const pred = predictedPercentile(s)
  const streak = studyStreak(s)
  const focus = todayFocusScore(s)

  const mocks = s.mba.mocks
  const percentileSeries = useMemo(() => ({
    labels: mocks.map((m) => format(parseISO(m.date), 'd MMM')),
    data: mocks.map((m) => m.percentile),
  }), [mocks])

  const recentStudy = useMemo(() => {
    const last = s.mba.studyLogs.slice(-14)
    return { labels: last.map((l) => format(parseISO(l.date), 'd')), data: last.map((l) => l.hours) }
  }, [s.mba.studyLogs])

  const sections = ['QA', 'VARC', 'DILR'] as const
  const weak = [...s.mba.topics].sort((a, b) => a.mastery - b.mastery).slice(0, 4)
  const strong = [...s.mba.topics].sort((a, b) => b.mastery - a.mastery).slice(0, 4)

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="🎯 MBA Preparation" subtitle="CAT 2026 · MBA CET — the road to a top institute." action={
        <div className="flex gap-2">
          <Button variant="glass" onClick={() => setMockOpen(true)}>＋ Mock</Button>
          <Button onClick={() => setLogOpen(true)}>Log study</Button>
        </div>
      } />

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="flex items-center gap-4 p-5" glow="#7c5cff">
          <Ring value={pred} size={84} stroke={8} color="#7c5cff"><span className="text-lg font-bold">{pred}</span></Ring>
          <div><div className="text-xs text-white/45">Predicted</div><div className="font-semibold">CAT %ile</div></div>
        </GlassCard>
        <GlassCard className="p-5"><Stat label="Study streak" value={`${streak} 🔥`} color="#fbbf24" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Today focus" value={`${focus}%`} color="#34d399" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Revision cycles" value={s.mba.revisionCycles} color="#36e6e0" /></GlassCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-5"><Stat label="PYQs solved" value={<CountUp value={s.mba.pyqsSolved} />} color="#a855f7" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Question bank" value={<CountUp value={s.mba.questionBankSolved} />} color="#7c5cff" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Mocks taken" value={mocks.length} color="#36e6e0" /></GlassCard>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Percentile progression</h2>
          <LineChart labels={percentileSeries.labels} datasets={[{ label: 'Percentile', data: percentileSeries.data, color: '#7c5cff' }]} height={240} yMax={100} yMin={60} />
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Study hours · last 14 logs</h2>
          <BarChart labels={recentStudy.labels} data={recentStudy.data} color="#36e6e0" height={240} />
        </GlassCard>
      </div>

      {/* Topics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="mb-1 text-lg font-semibold">Topic mastery</h2>
          <p className="mb-4 text-xs text-white/40">Tap ± to update as you study.</p>
          <div className="space-y-3">
            {sections.map((sec) => (
              <div key={sec}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-soft">{sec}</div>
                {s.mba.topics.filter((t) => t.section === sec).map((t) => (
                  <div key={t.topic} className="mb-2.5">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{t.topic}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => s.bumpTopic(t.topic, -2)} className="h-5 w-5 rounded bg-white/5 text-xs text-white/50">−</button>
                        <span className="w-9 text-right tabular-nums text-white/60">{t.mastery}%</span>
                        <button onClick={() => s.bumpTopic(t.topic, 2)} className="h-5 w-5 rounded bg-accent/70 text-xs">＋</button>
                      </div>
                    </div>
                    <Progress value={t.mastery} color={t.mastery >= 70 ? '#34d399' : t.mastery >= 50 ? '#fbbf24' : '#fb7185'} height={6} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="mb-3 text-lg font-semibold">⚠️ Weak topics</h2>
            <div className="flex flex-wrap gap-2">
              {weak.map((t) => <Tag key={t.topic} color="#fb7185">{t.topic} · {t.mastery}%</Tag>)}
            </div>
            <h2 className="mb-3 mt-5 text-lg font-semibold">💪 Strong topics</h2>
            <div className="flex flex-wrap gap-2">
              {strong.map((t) => <Tag key={t.topic} color="#34d399">{t.topic} · {t.mastery}%</Tag>)}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">This week’s plan</h2>
              <Tag>{s.mba.monthlyTarget}</Tag>
            </div>
            <ul className="space-y-2">
              {s.mba.weeklyPlan.map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-accent-soft">›</span>{p}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>

      {/* Mocks table */}
      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Mock test history</h2>
        <div className="space-y-2">
          {[...mocks].reverse().map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
              <div>
                <div className="text-sm font-medium">{m.name}</div>
                <div className="text-[11px] text-white/40">{format(parseISO(m.date), 'd MMM yyyy')} · {m.correct}/{m.attempted} correct</div>
              </div>
              <div className="flex items-center gap-5 text-right">
                <div><div className="text-xs text-white/40">Accuracy</div><div className="font-semibold">{m.accuracy}%</div></div>
                <div><div className="text-xs text-white/40">Percentile</div><div className="text-lg font-bold text-accent-soft">{m.percentile}</div></div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <LogStudyModal open={logOpen} onClose={() => setLogOpen(false)} />
      <AddMockModal open={mockOpen} onClose={() => setMockOpen(false)} />
    </div>
  )
}

function LogStudyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const logStudy = useAppStore((s) => s.logStudy)
  const [hours, setHours] = useState('3')
  const [questions, setQuestions] = useState('25')
  const [focus, setFocus] = useState('80')
  const [library, setLibrary] = useState<'yes' | 'no'>('yes')

  return (
    <Modal open={open} onClose={onClose} title="Log today’s study">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Hours"><Input type="number" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} /></Field>
          <Field label="Questions"><Input type="number" value={questions} onChange={(e) => setQuestions(e.target.value)} /></Field>
          <Field label="Focus %"><Input type="number" value={focus} onChange={(e) => setFocus(e.target.value)} /></Field>
        </div>
        <Field label="Library attendance"><Segmented value={library} onChange={setLibrary} options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]} /></Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { logStudy(+hours, +questions, +focus, library === 'yes'); onClose() }}>Log · earns XP</Button>
        </div>
      </div>
    </Modal>
  )
}

function AddMockModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addMock = useAppStore((s) => s.addMock)
  const [name, setName] = useState('')
  const [percentile, setPercentile] = useState('85')
  const [accuracy, setAccuracy] = useState('70')
  const [attempted, setAttempted] = useState('60')
  const [correct, setCorrect] = useState('45')

  return (
    <Modal open={open} onClose={onClose} title="Add mock result">
      <div className="space-y-4">
        <Input placeholder="Mock name (e.g. AIMCAT 8)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Percentile"><Input type="number" step="0.1" value={percentile} onChange={(e) => setPercentile(e.target.value)} /></Field>
          <Field label="Accuracy %"><Input type="number" value={accuracy} onChange={(e) => setAccuracy(e.target.value)} /></Field>
          <Field label="Attempted"><Input type="number" value={attempted} onChange={(e) => setAttempted(e.target.value)} /></Field>
          <Field label="Correct"><Input type="number" value={correct} onChange={(e) => setCorrect(e.target.value)} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (name.trim()) { addMock({ name: name.trim(), date: todayISO(), kind: 'full', percentile: +percentile, accuracy: +accuracy, attempted: +attempted, correct: +correct }); onClose() } }}>Save mock</Button>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="mb-1.5 text-xs text-white/40">{label}</div>{children}</div>
}
