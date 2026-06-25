import { useMemo } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  data: { date: string; value: number }[]
  color?: string
  className?: string
}

// GitHub-contributions-style heatmap. `data` should be chronological.
export function Heatmap({ data, color = '#7c5cff', className }: Props) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data])

  // pad to start on a Monday column
  const cells = useMemo(() => {
    if (!data.length) return []
    const firstDow = (new Date(data[0].date).getDay() + 6) % 7
    const pad = Array.from({ length: firstDow }, () => null)
    return [...pad, ...data]
  }, [data])

  const intensity = (v: number) => {
    if (v <= 0) return 0
    const t = v / max
    if (t < 0.25) return 0.25
    if (t < 0.5) return 0.45
    if (t < 0.75) return 0.7
    return 1
  }

  return (
    <div className={cn('flex gap-1 overflow-x-auto no-scrollbar', className)} style={{ gridAutoFlow: 'column' }}>
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {cells.map((c, i) =>
          c === null ? (
            <div key={`pad-${i}`} className="h-[11px] w-[11px]" />
          ) : (
            <div
              key={c.date}
              title={`${c.date}: ${c.value} XP`}
              className="h-[11px] w-[11px] rounded-[3px] transition-transform hover:scale-125"
              style={{
                background: c.value > 0 ? color : 'rgba(255,255,255,0.05)',
                opacity: c.value > 0 ? intensity(c.value) : 1,
              }}
            />
          ),
        )}
      </div>
    </div>
  )
}
