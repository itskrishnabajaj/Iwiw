// Back-compat shim. The real logic now lives in the rule-based Intelligence
// Engine (src/lib/intelligence/*). Existing imports of `generateInsight` /
// `allInsights` keep working unchanged.
import type { AppData } from './types'
import { generateInsight as engineGenerate, runRules } from './intelligence/engine'
import type { Insight, InsightKind } from './intelligence/types'

export type { Insight, InsightKind } from './intelligence/types'

export function generateInsight(kind: InsightKind, s: AppData): Insight {
  return engineGenerate(kind, s)
}

export function allInsights(s: AppData): Insight[] {
  return runRules(s, ['daily', 'suggestion', 'burnout', 'coach', 'streak-risk', 'next-action'])
}
