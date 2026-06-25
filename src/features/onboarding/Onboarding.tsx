import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { usePrefs } from '@/hooks/usePrefs'
import { ACCENTS, type ThemeAccent } from '@/lib/storage/prefs'
import { AuroraBackground } from '@/components/ui/AuroraBackground'
import { Input } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { bigCelebrate } from '@/components/celebrate/confetti'

// First-run flow — initializes identity, mission, exam dates and look & feel,
// then drops the user into a fully-seeded Personal OS.
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [prefs, setPrefs] = usePrefs()

  const [step, setStep] = useState(0)
  const [name, setName] = useState(settings.name)
  const [mission, setMission] = useState(settings.mission)
  const [catDate, setCatDate] = useState(settings.catDate)
  const [cetDate, setCetDate] = useState(settings.cetDate)
  const [accent, setAccent] = useState<ThemeAccent>('violet')

  const steps = [
    {
      title: 'Welcome to your Personal OS',
      sub: 'A command center for your entire self-improvement journey — built for offline, owned by you.',
      body: <div className="text-6xl">◍</div>,
    },
    {
      title: 'What should we call you?',
      sub: 'This is your control room. Make it personal.',
      body: <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus className="text-center text-lg" />,
    },
    {
      title: 'Your mission',
      sub: 'The north star everything revolves around. You can refine it anytime.',
      body: <textarea value={mission} onChange={(e) => setMission(e.target.value)} rows={4} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-accent/60" />,
    },
    {
      title: 'Key dates',
      sub: 'Your countdowns keep the urgency real.',
      body: (
        <div className="grid grid-cols-2 gap-3 text-left">
          <div><div className="mb-1.5 text-xs text-white/40">CAT date</div><Input type="date" value={catDate} onChange={(e) => setCatDate(e.target.value)} /></div>
          <div><div className="mb-1.5 text-xs text-white/40">MBA CET date</div><Input type="date" value={cetDate} onChange={(e) => setCetDate(e.target.value)} /></div>
        </div>
      ),
    },
    {
      title: 'Pick your accent',
      sub: 'Set the mood of your command center.',
      body: (
        <div className="flex justify-center gap-3">
          {(Object.keys(ACCENTS) as ThemeAccent[]).map((a) => (
            <button
              key={a}
              onClick={() => { setAccent(a); setPrefs({ accent: a }) }}
              aria-label={ACCENTS[a].name}
              className={`h-12 w-12 rounded-2xl transition ${accent === a ? 'ring-2 ring-white/80' : 'ring-1 ring-white/10'}`}
              style={{ background: `linear-gradient(135deg, ${ACCENTS[a].from}, ${ACCENTS[a].to})` }}
            />
          ))}
        </div>
      ),
    },
    {
      title: `You're all set${name ? `, ${name}` : ''}.`,
      sub: 'Your OS is seeded with realistic data so every screen feels alive from day one. Make it yours.',
      body: <div className="text-6xl">🚀</div>,
    },
  ]

  const isLast = step === steps.length - 1
  const next = () => {
    if (isLast) {
      updateSettings({ name: name.trim() || 'Krishna', mission, catDate, cetDate })
      setPrefs({ onboarded: true, accent })
      bigCelebrate()
      onDone()
      return
    }
    setStep((s) => s + 1)
  }
  const skip = () => {
    setPrefs({ onboarded: true })
    onDone()
  }

  const cur = steps[step]

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      {prefs.animationDensity !== 'minimal' && <AuroraBackground />}
      <button onClick={skip} className="absolute right-6 top-6 text-sm text-white/40 transition hover:text-white">Skip →</button>

      <div className="relative z-10 w-full max-w-md text-center">
        {/* progress dots */}
        <div className="mb-8 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-accent' : i < step ? 'w-4 bg-accent/50' : 'w-4 bg-white/10'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-6 flex min-h-[80px] items-center justify-center">{cur.body}</div>
            <h1 className="text-2xl font-bold md:text-3xl">{cur.title}</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm text-white/55">{cur.sub}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-center gap-3">
          {step > 0 && !isLast && (
            <button onClick={() => setStep((s) => s - 1)} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/60 hover:bg-white/5">Back</button>
          )}
          <Button size="lg" onClick={next}>{isLast ? 'Enter your OS' : 'Continue'}</Button>
        </div>
      </div>
    </div>
  )
}
