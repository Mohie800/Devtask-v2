# DevTask

Personal, offline-first project and task management app for a software developer juggling multiple projects.

Core question: **What do I need to work on today?**

## What is implemented

- Relative-period scheduling for projects and tasks: days, weeks, months
- Month-end clamping in the date engine
- Effective-date scheduling with postponement history
- Postponements shift work without changing the real deadline
- Today screen with:
  - Now card
  - overdue tasks
  - today tasks
  - approaching deadlines
  - upcoming tasks
  - completion track
  - weekly workload
- Projects with:
  - owner
  - pledged amount
  - payments
  - remaining balance
  - progress
  - active / blocked / overdue breakdown
- Global Tasks screen with search and filters
- Project detail and edit screens
- Task detail and edit screen
- Quick Add for tasks, projects, payments, and inline owners
- Blocked tasks with reason
- Local notifications:
  - daily morning check
  - task start reminder
  - deadline warning
  - evening unfinished check
  - blocked-task reminder
- SQLite persistence with indexes and foreign keys
- Zustand state layer
- JSON export/import and clear-all data controls
- Light/dark/system theme
- Haptics and swipe actions

## Tech stack

- Expo / React Native
- TypeScript
- Zustand
- Expo SQLite
- Expo Notifications
- React Navigation

## Run locally

```bash
npm install
npm start
```

Then open in Expo Go or a native development build.

## Test the core date engine

```bash
npm test
```

The core tests cover:

- day/week period arithmetic
- month-end clamping
- postponement effective dates
- overdue calculation
- Today-screen section ordering

## Project structure

```text
App.tsx
src/
├── components/
├── core/
├── db/
│   └── repositories/
├── navigation/
├── notifications/
├── screens/
├── state/
├── theme/
├── types/
└── utils/
```

## Implementation notes

- Data is local-only. There is no backend, account system, or cloud sync.
- Notifications are re-synced after local mutations and when the app returns to the foreground.
- The date engine is intentionally isolated in `src/core/dates.ts` and `src/core/schedule.ts`.
- Repository writes are the only database write path for normal app operations.
