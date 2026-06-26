import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { CommandPalette } from './components/layout/CommandPalette'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { useAppEffects } from './hooks/useAppEffects'

// Routes are EAGERLY imported (no React.lazy). This means:
//  - navigation never suspends → instant, flash-free screen swaps;
//  - the whole app ships as one atomically-replaced bundle, so a redeploy can
//    never leave the running app requesting a stale/missing route chunk
//    (the ChunkLoadError class of post-deploy breakage). Stability > a smaller
//    initial download for a daily-use personal app.
import Home from './features/home/Home'
import Today from './features/today/Today'
import Progress from './features/rpg/Progress'
import Habits from './features/habits/Habits'
import Goals from './features/goals/Goals'
import Analytics from './features/analytics/Analytics'
import MBA from './features/areas/MBA'
import QuantReflex from './features/areas/QuantReflex'
import CRM from './features/areas/CRM'
import Learning from './features/areas/Learning'
import Gym from './features/areas/Gym'
import Finance from './features/areas/Finance'
import Personal from './features/areas/Personal'
import Journal from './features/journal/Journal'
import Calendar from './features/calendar/Calendar'
import Vision from './features/vision/Vision'
import Achievements from './features/achievements/Achievements'
import Focus from './features/focus/Focus'
import Archive from './features/archive/Archive'
import Settings from './features/settings/Settings'

function Root() {
  useAppEffects()
  return (
    <>
      <AppShell />
      <CommandPalette />
    </>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <Home /> },
      { path: 'today', element: <Today /> },
      { path: 'progress', element: <Progress /> },
      { path: 'habits', element: <Habits /> },
      { path: 'goals', element: <Goals /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'mba', element: <MBA /> },
      { path: 'quantreflex', element: <QuantReflex /> },
      { path: 'crm', element: <CRM /> },
      { path: 'learning', element: <Learning /> },
      { path: 'gym', element: <Gym /> },
      { path: 'finance', element: <Finance /> },
      { path: 'personal', element: <Personal /> },
      { path: 'journal', element: <Journal /> },
      { path: 'calendar', element: <Calendar /> },
      { path: 'vision', element: <Vision /> },
      { path: 'achievements', element: <Achievements /> },
      { path: 'archive', element: <Archive /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '/focus', element: <ErrorBoundary label="focus"><Focus /></ErrorBoundary> },
])
