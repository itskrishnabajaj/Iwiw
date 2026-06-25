# Personal OS — Command Center

A premium, dark-themed **Personal Operating System**: the command center for an
entire self-improvement journey, built around one mission:

> Build QuantReflex into India's leading aptitude preparation platform while
> earning admission into a top MBA institute and becoming the best version of myself.

Not a to-do list. Not a habit tracker. A buttery-smooth, emotionally motivating
control room that makes long-term progress tangible — inspired by Apple Fitness,
Linear, Notion, Arc, Duolingo, GitHub contributions, Steam achievements and Tesla UI.

## Highlights

- **Aurora Glass design system** — animated aurora gradients, glassmorphism, floating
  particles, cursor glow, 3D tilt cards, liquid progress bars, activity rings,
  ripple buttons and spring micro-interactions throughout.
- **Daily Command Center / Home** — greeting + mission, CAT & MBA CET countdowns,
  live age, streaks, focus score, predicted percentile, activity rings, XP/level,
  weather (Open-Meteo, no key), quote, goals, momentum heatmap, quick notes,
  Pomodoro, and an AI daily brief.
- **Today** — Morning/Afternoon/Evening/Night timeline with animated task
  completion, time blocking, progress bars and confetti on full completion.
- **Life Progress (RPG)** — XP, levels, titles, skill tree, badges. XP comes from
  real logged work (study, questions, gym, outreach, journaling) — never fake clicks.
  Level-up modal + celebration.
- **Habits** — streaks, best streak, success %, 30-day grid, consistency score,
  completion animation.
- **Goals** — Annual → Quarterly → Monthly → Weekly → Daily hierarchy with automatic
  progress roll-up.
- **Analytics** — momentum line, life-balance radar, XP doughnut, study-by-weekday
  bars, study/QuantReflex/gym balance.
- **Life areas** — MBA Prep (mocks, topics, percentile progression, study logging),
  QuantReflex workspace (Kanban, milestones, launch checklists, metrics, feedback),
  Coaching Outreach CRM (pipeline Kanban), Learning, Gym, Finance, Personal Growth.
- **Tools** — Journal (prompted + searchable), interactive Calendar, Vision Board
  (with image upload), Achievements (auto-evaluated against real data), full-screen
  Focus Mode, and a ⌘K universal command palette.
- **PWA** — installable, offline-capable; all data is local so it works with no network.

## Tech

React 18 · TypeScript · Vite · TailwindCSS · Framer Motion · Chart.js ·
React Router · Zustand · IndexedDB (`idb-keyval`) · canvas-confetti · vite-plugin-pwa.

## Data & persistence

**Local-first, offline, resilient.** All app data lives in IndexedDB behind a single
**`StorageService`** (`src/lib/storage/`) that provides schema versioning, ordered
migrations, defensive validation/repair, rolling **backup snapshots**, **export/import**
JSON, restore, storage diagnostics, and automatic **corruption recovery** on load. The
Zustand store persists through this adapter; tiny UI preferences (theme, motion,
particles, onboarding flag) live in localStorage. Manage all of it from **Settings → Data**.

## Rule-Based Intelligence Engine

The "AI" is a deterministic, explainable engine (`src/lib/intelligence/`) — a registry
of rules (study suggestions, burnout & streak-risk detection, productivity score, daily
mission, weekly/monthly reviews, next actions, percentile projection, schedule tips) that
run over your real data. Every insight carries a `why[]`. It's the shared decision layer
used across the dashboard, MBA, Analytics and more; `generateInsight()` remains as a shim,
and a real LLM could replace the implementation without touching the UI.

## Platform features

- **Settings / Data** — export/import, backups & restore, restore defaults, clear cache,
  live storage diagnostics, profile/mission editor, accent themes, accessibility and
  performance controls.
- **Onboarding** — an animated first-run flow that initializes identity, mission, exam
  dates and look & feel.
- **Gamification** — XP/levels/titles plus prestige **ranks** (Bronze→Legend),
  weekly/monthly XP, and legendary + hidden achievements (masked until earned).
- **Deep modules** — MBA (projection engine, section comparison, weakness heatmap,
  revision queue, study velocity), Analytics (productivity score + AI reviews),
  QuantReflex (launch-readiness), CRM (funnel + follow-ups), Learning, Gym, Journal
  (mood timeline + keyword themes) — all driven by the intelligence engine.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run preview  # serve the production build
```

## Project structure

```
src/
  lib/         types, dates, xp, streaks, insights, seed, persistence
  store/       Zustand store + selectors
  data/        achievements catalog, quotes
  components/  ui primitives, charts, layout shell, command palette, celebrations
  features/    home, today, rpg, habits, goals, analytics, areas/*, journal,
               calendar, vision, achievements, focus
  hooks/       pomodoro, weather, tick, app effects (level-ups + achievements)
```

## Out of scope for v1 (clean extension seams left in code)

Real Firebase sync, real LLM AI, music streaming, multi-device sync, push
notifications.
