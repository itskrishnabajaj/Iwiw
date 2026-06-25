import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { getLevel } from '@/store/selectors'
import { evaluateAchievements } from '@/data/achievements'
import toast from 'react-hot-toast'
import { celebrate } from '@/components/celebrate/confetti'

// Watches XP for level-ups and re-evaluates achievements on every data change.
export function useAppEffects() {
  const hydrated = useAppStore((s) => s.hydrated)
  const xpEvents = useAppStore((s) => s.xpEvents)
  const prevLevel = useRef<number | null>(null)
  const firstAchvRun = useRef(true)

  // Level-up detection
  useEffect(() => {
    if (!hydrated) return
    const lvl = getLevel(useAppStore.getState()).level
    if (prevLevel.current === null) {
      prevLevel.current = lvl
      return
    }
    if (lvl > prevLevel.current) {
      useAppStore.setState({ pendingLevelUp: lvl })
    }
    prevLevel.current = lvl
  }, [xpEvents, hydrated])

  // Achievement evaluation
  useEffect(() => {
    if (!hydrated) return
    const s = useAppStore.getState()
    const list = evaluateAchievements(s)
    const unlocked = list.filter((a) => a.unlocked).map((a) => a.id)
    const fresh = unlocked.filter((id) => !s.unlockedAchievements[id])
    // On the first run after hydration, silently record already-earned ones.
    if (firstAchvRun.current) {
      firstAchvRun.current = false
      if (unlocked.length) s.markUnlocked(unlocked)
      s.clearUnlockToast()
      return
    }
    if (fresh.length) {
      s.markUnlocked(unlocked)
      for (const id of fresh) {
        const a = list.find((x) => x.id === id)!
        toast(`${a.icon}  Achievement unlocked: ${a.title}`, { icon: '🏆', duration: 4000 })
      }
      celebrate()
    } else if (unlocked.length) {
      s.markUnlocked(unlocked)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xpEvents, hydrated])
}
