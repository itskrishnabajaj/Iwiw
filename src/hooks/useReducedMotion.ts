import { useEffect, useState } from 'react'
import { usePrefs } from './usePrefs'

// True when motion should be minimized — honors the OS setting AND the in-app pref.
export function useReducedMotion(): boolean {
  const [prefs] = usePrefs()
  const [media, setMedia] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setMedia(mq.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return media || prefs.reduceMotion || prefs.animationDensity === 'minimal'
}
