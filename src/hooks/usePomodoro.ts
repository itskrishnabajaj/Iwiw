import { useCallback, useEffect, useRef, useState } from 'react'

type Phase = 'focus' | 'break'

export function usePomodoro(focusMin = 25, breakMin = 5) {
  const [phase, setPhase] = useState<Phase>('focus')
  const [remaining, setRemaining] = useState(focusMin * 60)
  const [running, setRunning] = useState(false)
  const [rounds, setRounds] = useState(0)
  const ref = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            const nextPhase: Phase = phase === 'focus' ? 'break' : 'focus'
            if (phase === 'focus') setRounds((x) => x + 1)
            setPhase(nextPhase)
            return (nextPhase === 'focus' ? focusMin : breakMin) * 60
          }
          return r - 1
        })
      }, 1000)
    }
    return () => clearInterval(ref.current)
  }, [running, phase, focusMin, breakMin])

  const total = (phase === 'focus' ? focusMin : breakMin) * 60
  const reset = useCallback(() => {
    setRunning(false)
    setPhase('focus')
    setRemaining(focusMin * 60)
  }, [focusMin])

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  return {
    phase,
    label: `${mm}:${ss}`,
    pct: ((total - remaining) / total) * 100,
    running,
    rounds,
    toggle: () => setRunning((r) => !r),
    reset,
  }
}
