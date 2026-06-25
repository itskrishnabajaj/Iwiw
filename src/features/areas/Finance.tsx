import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { runwayMonths } from '@/store/selectors'
import { GlassCard } from '@/components/ui/GlassCard'
import { CountUp } from '@/components/ui/CountUp'
import { SectionTitle, Stat, Tag, Input } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DoughnutChart, BarChart } from '@/components/charts/Charts'
import { format, parseISO } from 'date-fns'

export default function Finance() {
  const s = useAppStore()
  const [open, setOpen] = useState(false)
  const fin = s.finance

  const income = fin.transactions.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0)
  const expense = fin.transactions.filter((t) => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0)
  const runway = runwayMonths(s)
  const monthlySubs = fin.subscriptions.reduce((a, x) => a + (x.cycle === 'monthly' ? x.amount : x.amount / 12), 0)

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {}
    for (const t of fin.transactions) if (t.amount < 0) m[t.category] = (m[t.category] || 0) + Math.abs(t.amount)
    return m
  }, [fin.transactions])

  const palette = ['#7c5cff', '#36e6e0', '#fb923c', '#fbbf24', '#f472b6', '#60a5fa']

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="💰 Financial Growth" subtitle="Fund the MBA. Fuel QuantReflex. Build the runway." action={<Button onClick={() => setOpen(true)}>＋ Transaction</Button>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5" glow="#34d399"><Stat label="Savings" value={<CountUp value={fin.savings} prefix="₹" />} color="#34d399" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Income (30d)" value={<CountUp value={income} prefix="₹" />} color="#7c5cff" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Expenses (30d)" value={<CountUp value={expense} prefix="₹" />} color="#fb7185" /></GlassCard>
        <GlassCard className="p-5"><Stat label="Runway" value={`${runway} mo`} sub={`₹${fin.monthlyBurn}/mo burn`} color="#fbbf24" /></GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Spending by category</h2>
          <DoughnutChart labels={Object.keys(byCategory)} data={Object.values(byCategory)} colors={palette} height={240} />
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Recent transactions</h2>
          <div className="max-h-72 space-y-1.5 overflow-y-auto no-scrollbar">
            {fin.transactions.slice(0, 14).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={t.amount > 0 ? 'text-good' : 'text-white/60'}>{t.amount > 0 ? '↑' : '↓'}</span>
                  <span>{t.label}</span>
                  <Tag>{t.category}</Tag>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold tabular-nums ${t.amount > 0 ? 'text-good' : 'text-white/70'}`}>{t.amount > 0 ? '+' : '−'}₹{Math.abs(t.amount).toLocaleString('en-IN')}</span>
                  <span className="text-[11px] text-white/30">{format(parseISO(t.date), 'd MMM')}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Subscriptions</h2>
            <Tag color="#fb7185">₹{Math.round(monthlySubs)}/mo</Tag>
          </div>
          <div className="space-y-2">
            {fin.subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                <span>{sub.name}</span>
                <span className="text-white/60">₹{sub.amount} <span className="text-[11px] text-white/30">/{sub.cycle.slice(0, 2)}</span></span>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Income vs expense</h2>
          <BarChart labels={['Income', 'Expense', 'Net']} data={[income, expense, income - expense]} color="#34d399" height={220} />
        </GlassCard>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add transaction">
        <TxForm onClose={() => setOpen(false)} />
      </Modal>
    </div>
  )
}

function TxForm({ onClose }: { onClose: () => void }) {
  const addTransaction = useAppStore((s) => s.addTransaction)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [type, setType] = useState<'income' | 'expense'>('expense')

  return (
    <div className="space-y-4">
      <Input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
      <div className="grid grid-cols-2 gap-3">
        <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <div className="flex gap-2">
        {(['income', 'expense'] as const).map((t) => (
          <button key={t} onClick={() => setType(t)} className={`flex-1 rounded-xl py-2 text-sm ${type === t ? 'bg-accent/30 ring-1 ring-accent' : 'bg-white/5 text-white/60'}`}>{t}</button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => { if (label.trim() && amount) { addTransaction(label.trim(), type === 'income' ? Math.abs(+amount) : -Math.abs(+amount), type === 'income' ? 'Income' : category); onClose() } }}>Add</Button>
      </div>
    </div>
  )
}
