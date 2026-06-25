import { useEffect, useState } from 'react'

// Re-render on an interval (for live clocks / countdowns).
export function useTick(ms = 1000) {
  const [, set] = useState(0)
  useEffect(() => {
    const t = setInterval(() => set((n) => n + 1), ms)
    return () => clearInterval(t)
  }, [ms])
}
