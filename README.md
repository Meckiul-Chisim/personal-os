# Personal OS

A local-first personal operating system for bringing work, projects, goals, habits, health, learning, finances and reflection into one calm workspace.

## Current foundation

- **Overview and My Day** — a live summary of your own records and tasks due today.
- **Tasks** — capture, categorize, prioritize, search, complete and delete tasks.
- **Projects** — create work or personal projects and update progress.
- **Goals** — define outcomes and track progress.
- **Habits** — create routines and record daily check-ins.
- **Health & fitness** — log sleep, hydration, movement, mood and notes.
- **Learning** — maintain a learning roadmap and update learning status.
- **Finances** — record income and expenses in INR and see your recorded net total.
- **Journal and Clarity** — save reflections, ideas, decisions and brain dumps.
- **Settings** — light/dark appearance plus JSON backup export and import.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Data and privacy

This first foundation uses browser `localStorage` and starts with empty records rather than fabricated sample activity. Data stays in the current browser profile on the current device. Export a JSON backup regularly. Clearing browser data can remove these records.

## Not connected yet

Cross-device sync, authentication, cloud backup, reminders/notifications, integrations with bank or health services, and native mobile packaging are future work. The current responsive web app can be opened on a phone, but local browser storage does **not** synchronize phone and desktop data.

## Product direction

Personal OS is intended to become a personal command center: a connected view of what matters, what you are building, how you are progressing, and how your life is going. The next architecture milestone is a secure sync layer with explicit backup and conflict handling, followed by a PWA install experience.
