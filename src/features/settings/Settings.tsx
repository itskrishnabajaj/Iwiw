import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppStore } from '@/store/useAppStore'
import { usePrefs } from '@/hooks/usePrefs'
import { usePwaUpdate } from '@/hooks/usePwaUpdate'
import { storage, type Diagnostics, type BackupSnapshot } from '@/lib/storage/StorageService'
import { ACCENTS, type ThemeAccent, type AnimationDensity } from '@/lib/storage/prefs'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionTitle, Input, Segmented } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { geocodeCity } from '@/lib/geocode'
import { format } from 'date-fns'
import pkg from '../../../package.json'

const APP_VERSION = pkg.version

type Tab = 'data' | 'profile' | 'theme' | 'access' | 'perf'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'data', label: 'Data', icon: '💾' },
  { key: 'profile', label: 'Profile', icon: '🪪' },
  { key: 'theme', label: 'Personalize', icon: '🎨' },
  { key: 'access', label: 'Accessibility', icon: '♿' },
  { key: 'perf', label: 'Performance', icon: '⚡' },
]

async function rehydrate() {
  await (useAppStore as unknown as { persist: { rehydrate: () => Promise<void> } }).persist.rehydrate()
}

export default function Settings() {
  const [tab, setTab] = useState<Tab>('data')
  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="⚙ Settings" subtitle="Your Personal OS control panel — data, identity, look and feel." />
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm transition ${tab === t.key ? 'bg-accent/20 text-white ring-1 ring-accent/50' : 'glass-container text-white/55 hover:text-white'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {tab === 'data' && <DataPanel />}
      {tab === 'profile' && <ProfilePanel />}
      {tab === 'theme' && <ThemePanel />}
      {tab === 'access' && <AccessPanel />}
      {tab === 'perf' && <PerfPanel />}
    </div>
  )
}

// ---------------------------------------------------------------- Data
function DataPanel() {
  const [diag, setDiag] = useState<Diagnostics | null>(null)
  const [backups, setBackups] = useState<BackupSnapshot[]>([])
  const [resetConfirm, setResetConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = async () => {
    setDiag(await storage.diagnostics())
    setBackups(await storage.listBackups())
  }
  useEffect(() => {
    refresh()
  }, [])

  const onExport = async () => {
    const json = await storage.export()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `personal-os-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported your data')
  }

  const onImportFile = async (file?: File) => {
    if (!file) return
    const text = await file.text()
    const res = await storage.import(text)
    if (res.ok) {
      await rehydrate()
      await refresh()
      toast.success('Data imported')
    } else {
      toast.error(res.error ?? 'Import failed')
    }
  }

  const onBackup = async () => {
    await storage.backup('manual')
    await refresh()
    toast.success('Backup snapshot created')
  }
  const onRestore = async (id: string) => {
    await storage.restore(id)
    await rehydrate()
    await refresh()
    toast.success('Restored from backup')
  }
  const onDefaults = async () => {
    await storage.restoreDefaults()
    await rehydrate()
    await refresh()
    toast.success('Reset to an empty OS')
  }
  const onClearCache = async () => {
    await storage.clearCache()
    toast.success('Cache cleared — reload to re-fetch assets')
  }

  const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold">Backup & transfer</h3>
        <p className="mt-1 text-sm text-white/45">Everything lives on this device. Export regularly so you never lose progress.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={onExport}>⬇ Export JSON</Button>
          <Button variant="glass" onClick={() => fileRef.current?.click()}>⬆ Import JSON</Button>
          <Button variant="glass" onClick={onBackup}>＋ Snapshot</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onImportFile(e.target.files?.[0])} />
        </div>

        <h4 className="mt-6 text-sm font-semibold text-white/70">Backup snapshots</h4>
        <div className="mt-2 space-y-2">
          {backups.length === 0 && <p className="text-sm text-white/35">No snapshots yet.</p>}
          {backups.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
              <div>
                <div className="text-white/80">{format(b.ts, 'd MMM, HH:mm')}</div>
                <div className="text-[11px] text-white/35">{b.reason} · v{b.version}</div>
              </div>
              <Button size="sm" variant="glass" onClick={() => onRestore(b.id)}>Restore</Button>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="space-y-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold">Storage diagnostics</h3>
          {diag ? (
            <div className="mt-3 space-y-2 text-sm">
              <Row k="Schema version" v={`v${diag.version}`} />
              <Row k="Integrity" v={<span className={diag.integrity === 'ok' ? 'text-good' : diag.integrity === 'recovered' ? 'text-warn' : 'text-white/70'}>{diag.integrity}</span>} />
              <Row k="App data size" v={fmtBytes(diag.storeBytes)} />
              <Row k="Backups" v={`${diag.backupCount} · ${fmtBytes(diag.backupBytes)}`} />
              <Row k="Last backup" v={diag.lastBackup ? format(diag.lastBackup, 'd MMM, HH:mm') : '—'} />
              {diag.repairedKeys.length > 0 && <Row k="Repaired keys" v={diag.repairedKeys.join(', ')} />}
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/40">Reading…</p>
          )}
        </GlassCard>

        <AppUpdatesCard />

        <SampleDataCard onChanged={refresh} />

        <SystemCard diag={diag} />

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-bad/90">Danger zone</h3>
          <p className="mt-1 text-sm text-white/45">These take a safety backup first, but proceed carefully.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="glass" onClick={onClearCache}>Clear app cache</Button>
            <Button variant="danger" onClick={() => setResetConfirm(true)}>Reset all data</Button>
          </div>
        </GlassCard>
      </div>

      <ConfirmDialog
        open={resetConfirm}
        title="Reset all data?"
        message="This clears every entry and returns the OS to an empty Level 1 state. A safety backup is taken first, so you can restore from the Backup snapshots list."
        confirmLabel="Reset to empty"
        onConfirm={onDefaults}
        onClose={() => setResetConfirm(false)}
      />
    </div>
  )
}

function SampleDataCard({ onChanged }: { onChanged: () => void }) {
  const loadSampleData = useAppStore((s) => s.loadSampleData)
  const removeSampleData = useAppStore((s) => s.removeSampleData)
  const hasSample = useAppStore((s) => s.hasSampleData())
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold">Sample data</h3>
      <p className="mt-1 text-sm text-white/45">
        Explore every module with example content — each item is badged <span className="text-amber-300">Example</span> and never mixes with your real data.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="glass" onClick={() => { loadSampleData(); onChanged(); toast.success('Sample data loaded') }}>Load sample data</Button>
        {hasSample && <Button variant="glass" onClick={() => { removeSampleData(); onChanged(); toast.success('Sample data removed') }}>Remove sample data</Button>}
      </div>
      {hasSample && <p className="mt-2 text-[11px] text-amber-300/80">Sample data is currently loaded.</p>}
    </GlassCard>
  )
}

function SystemCard({ diag }: { diag: Diagnostics | null }) {
  const { status, lastChecked } = usePwaUpdate()
  const [taps, setTaps] = useState(0)
  const standalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true)
  const dev = taps >= 5
  const healthColor = !diag ? 'text-white/60' : diag.integrity === 'ok' ? 'text-good' : diag.integrity === 'repaired' || diag.integrity === 'recovered' ? 'text-warn' : 'text-white/60'
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold">System</h3>
      <div className="mt-3 space-y-2 text-sm">
        <Row k="App version" v={<button onClick={() => setTaps((t) => t + 1)} className="tabular-nums">v{APP_VERSION}</button>} />
        <Row k="Install mode" v={standalone ? 'Standalone (PWA)' : 'Browser tab'} />
        <Row k="Update status" v={status === 'available' ? <span className="text-warn">update ready</span> : status === 'up-to-date' ? <span className="text-good">up to date</span> : status} />
        <Row k="Last checked" v={lastChecked ? format(lastChecked, 'd MMM, HH:mm') : 'not yet'} />
        <Row k="DB health" v={<span className={healthColor}>{diag ? diag.integrity : '…'}</span>} />
      </div>
      {dev && diag && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-accent-soft">Developer diagnostics</div>
          <div className="space-y-1 text-[11px] text-white/55">
            {diag.keys.map((k) => (
              <div key={k.key} className="flex justify-between gap-3">
                <span className="truncate font-mono">{k.key}</span>
                <span className="tabular-nums text-white/40">{(k.bytes / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  )
}

function AppUpdatesCard() {
  const { status, needRefresh, checkForUpdates, applyUpdate } = usePwaUpdate()
  const onCheck = async () => {
    const result = await checkForUpdates()
    if (result === 'up-to-date') toast.success('You’re on the latest version')
    else if (result === 'available') toast('Update available — reload to apply', { icon: '✨' })
    else if (result === 'error') toast.error('Couldn’t check (updates need the deployed app)')
  }
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold">App updates</h3>
      <p className="mt-1 text-sm text-white/45">
        Updates download in the background and apply on reload. Your data and settings are always preserved.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="glass" onClick={onCheck} disabled={status === 'checking'}>
          {status === 'checking' ? 'Checking…' : '↻ Check for updates'}
        </Button>
        {needRefresh && (
          <Button onClick={() => applyUpdate()}>Reload to update</Button>
        )}
        {status === 'up-to-date' && !needRefresh && <span className="text-sm text-good">Up to date ✓</span>}
      </div>
    </GlassCard>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
      <span className="text-white/45">{k}</span>
      <span className="font-medium tabular-nums">{v}</span>
    </div>
  )
}

// ---------------------------------------------------------------- Profile
function ProfilePanel() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)
  useEffect(() => setForm(settings), [settings])
  const set = (k: keyof typeof form, v: string | number) => setForm((p) => ({ ...p, [k]: v }))

  const onSave = async () => {
    const cityChanged = form.weatherCity.trim() && form.weatherCity.trim() !== settings.weatherCity.trim()
    if (!cityChanged) {
      updateSettings(form)
      toast.success('Profile saved')
      return
    }
    // Resolve the new city to coordinates so the weather widget shows it for real.
    setSaving(true)
    const geo = await geocodeCity(form.weatherCity)
    setSaving(false)
    if (geo) {
      updateSettings({ ...form, weatherCity: form.weatherCity.trim(), weatherLat: geo.lat, weatherLon: geo.lon })
      toast.success(`Profile saved · weather set to ${geo.label}`)
    } else {
      updateSettings(form) // keep the typed city + previous coords
      toast('Profile saved · couldn’t find that city for weather (offline?)', { icon: '⚠️' })
    }
  }

  return (
    <GlassCard className="max-w-2xl p-6">
      <h3 className="text-lg font-semibold">Identity & mission</h3>
      <div className="mt-4 space-y-4">
        <Field label="Name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Mission">
          <textarea value={form.mission} onChange={(e) => set('mission', e.target.value)} rows={3} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none focus:border-accent/60" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CAT date"><Input type="date" value={form.catDate} onChange={(e) => set('catDate', e.target.value)} /></Field>
          <Field label="MBA CET date"><Input type="date" value={form.cetDate} onChange={(e) => set('cetDate', e.target.value)} /></Field>
          <Field label="Birth date"><Input type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></Field>
          <Field label="Weather city"><Input value={form.weatherCity} onChange={(e) => set('weatherCity', e.target.value)} /></Field>
        </div>
        <Field label="Weight units">
          <Segmented
            value={form.units ?? 'kg'}
            onChange={(v: 'kg' | 'lbs') => setForm((p) => ({ ...p, units: v }))}
            options={[{ label: 'kg', value: 'kg' }, { label: 'lbs', value: 'lbs' }]}
          />
        </Field>
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
        </div>
      </div>
    </GlassCard>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs text-white/40">{label}</div>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------- Theme
function ThemePanel() {
  const [prefs, setPrefs] = usePrefs()
  return (
    <GlassCard className="max-w-2xl p-6">
      <h3 className="text-lg font-semibold">Personalization</h3>
      <div className="mt-4">
        <div className="mb-2 text-xs text-white/40">Accent</div>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(ACCENTS) as ThemeAccent[]).map((a) => (
            <button
              key={a}
              onClick={() => setPrefs({ accent: a })}
              aria-label={`Accent ${ACCENTS[a].name}`}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${prefs.accent === a ? 'ring-2 ring-white/80' : 'ring-1 ring-white/10'}`}
              style={{ background: `linear-gradient(135deg, ${ACCENTS[a].from}, ${ACCENTS[a].to})` }}
            >
              {prefs.accent === a && <span className="text-white">✓</span>}
            </button>
          ))}
        </div>
      </div>
      <Toggle label="Time-aware greeting" hint="Greets you by time of day on the dashboard." on={prefs.seasonalGreeting} onClick={() => setPrefs({ seasonalGreeting: !prefs.seasonalGreeting })} />
    </GlassCard>
  )
}

// ---------------------------------------------------------------- Accessibility
function AccessPanel() {
  const [prefs, setPrefs] = usePrefs()
  return (
    <GlassCard className="max-w-2xl p-6">
      <h3 className="text-lg font-semibold">Accessibility</h3>
      <Toggle label="Reduce motion" hint="Disables tilt, particles and large animations." on={prefs.reduceMotion} onClick={() => setPrefs({ reduceMotion: !prefs.reduceMotion })} />
      <Toggle label="High contrast" hint="Boosts dim text and borders for readability." on={prefs.highContrast} onClick={() => setPrefs({ highContrast: !prefs.highContrast })} />
    </GlassCard>
  )
}

// ---------------------------------------------------------------- Performance
function PerfPanel() {
  const [prefs, setPrefs] = usePrefs()
  return (
    <GlassCard className="max-w-2xl p-6">
      <h3 className="text-lg font-semibold">Performance</h3>
      <Toggle label="Background particles" hint="Floating ambient particles on the dashboard & focus mode." on={prefs.particles} onClick={() => setPrefs({ particles: !prefs.particles })} />
      <div className="mt-5">
        <div className="mb-2 text-xs text-white/40">Animation density</div>
        <Segmented
          value={prefs.animationDensity}
          onChange={(v: AnimationDensity) => setPrefs({ animationDensity: v })}
          options={[{ label: 'Full', value: 'full' }, { label: 'Reduced', value: 'reduced' }, { label: 'Minimal', value: 'minimal' }]}
        />
      </div>
    </GlassCard>
  )
}

function Toggle({ label, hint, on, onClick }: { label: string; hint: string; on: boolean; onClick: () => void }) {
  return (
    <div className="mt-5 flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-white/40">{hint}</div>
      </div>
      <button
        onClick={onClick}
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-white/15'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}
