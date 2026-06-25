import { AREA_META } from '@/store/selectors'
import type { AreaKey } from './types'

// Single source of truth for the mood scale (was duplicated in Journal/Gym/Calendar).
export const MOOD_EMOJIS = ['😴', '😐', '🙂', '😀', '🤩'] as const

export function getMoodEmoji(level: number): string {
  return MOOD_EMOJIS[Math.max(0, Math.min(MOOD_EMOJIS.length - 1, Math.round(level) - 1))]
}

export const MOOD_LABELS = ['Drained', 'Low', 'Okay', 'Good', 'Peak'] as const

// Convenience accessor for an area's accent color.
export function areaColor(area: AreaKey): string {
  return AREA_META[area].color
}
