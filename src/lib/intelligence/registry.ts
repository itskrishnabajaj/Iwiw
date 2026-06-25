import type { Rule } from './types'

// Plugin-style registry: modules can contribute rules without editing the engine.
const rules: Rule[] = []

export function registerRules(...r: Rule[]): void {
  for (const rule of r) {
    if (!rules.some((x) => x.id === rule.id)) rules.push(rule)
  }
}

export function getRules(): Rule[] {
  return rules
}
