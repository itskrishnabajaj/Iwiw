import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { CommandPalette } from './components/layout/CommandPalette'
import { useAppEffects } from './hooks/useAppEffects'

const Home = lazy(() => import('./features/home/Home'))
const Today = lazy(() => import('./features/today/Today'))
const Progress = lazy(() => import('./features/rpg/Progress'))
const Habits = lazy(() => import('./features/habits/Habits'))
const Goals = lazy(() => import('./features/goals/Goals'))
const Analytics = lazy(() => import('./features/analytics/Analytics'))
const MBA = lazy(() => import('./features/areas/MBA'))
const QuantReflex = lazy(() => import('./features/areas/QuantReflex'))
const CRM = lazy(() => import('./features/areas/CRM'))
const Learning = lazy(() => import('./features/areas/Learning'))
const Gym = lazy(() => import('./features/areas/Gym'))
const Finance = lazy(() => import('./features/areas/Finance'))
const Personal = lazy(() => import('./features/areas/Personal'))
const Journal = lazy(() => import('./features/journal/Journal'))
const Calendar = lazy(() => import('./features/calendar/Calendar'))
const Vision = lazy(() => import('./features/vision/Vision'))
const Achievements = lazy(() => import('./features/achievements/Achievements'))
const Focus = lazy(() => import('./features/focus/Focus'))
const Settings = lazy(() => import('./features/settings/Settings'))

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
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '/focus', element: <Focus /> },
])
