export interface NavItem {
  label: string
  to: string
  icon: string
  group: 'core' | 'areas' | 'system'
}

export const NAV: NavItem[] = [
  { label: 'Home', to: '/', icon: '◇', group: 'core' },
  { label: 'Today', to: '/today', icon: '☉', group: 'core' },
  { label: 'Life Progress', to: '/progress', icon: '✦', group: 'core' },
  { label: 'Habits', to: '/habits', icon: '⟲', group: 'core' },
  { label: 'Goals', to: '/goals', icon: '◎', group: 'core' },
  { label: 'Analytics', to: '/analytics', icon: '▤', group: 'core' },

  { label: 'MBA Prep', to: '/mba', icon: '🎯', group: 'areas' },
  { label: 'QuantReflex', to: '/quantreflex', icon: '⚡', group: 'areas' },
  { label: 'Outreach CRM', to: '/crm', icon: '🤝', group: 'areas' },
  { label: 'Learning', to: '/learning', icon: '📚', group: 'areas' },
  { label: 'Gym', to: '/gym', icon: '💪', group: 'areas' },
  { label: 'Finance', to: '/finance', icon: '💰', group: 'areas' },
  { label: 'Personal', to: '/personal', icon: '🌱', group: 'areas' },

  { label: 'Journal', to: '/journal', icon: '✍', group: 'system' },
  { label: 'Calendar', to: '/calendar', icon: '▦', group: 'system' },
  { label: 'Vision Board', to: '/vision', icon: '✧', group: 'system' },
  { label: 'Achievements', to: '/achievements', icon: '🏆', group: 'system' },
  { label: 'Focus Mode', to: '/focus', icon: '◐', group: 'system' },
  { label: 'Archive', to: '/archive', icon: '🗄', group: 'system' },
  { label: 'Settings', to: '/settings', icon: '⚙', group: 'system' },
]

export const GROUP_LABEL: Record<NavItem['group'], string> = {
  core: 'Command',
  areas: 'Life Areas',
  system: 'Tools',
}
