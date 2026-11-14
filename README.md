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
- **Settings** — light/dark appearance, JSON backup export/import, and optional calendar push reminders.

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

## Calendar push reminders

Push reminders are optional and require a backend server that stays online. Calendar events remain in browser storage, but when reminders are enabled their titles, times and notes are synced to the server so it can notify you five minutes before each event.

1. Copy `.env.example` to `.env`.
2. Generate VAPID keys with `npm run generate:vapid` and copy the displayed public/private keys into `.env`.
3. Set a strong `PUSH_API_PASSWORD`, a random `PUSH_SESSION_SECRET` (for example, generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`), and your `VAPID_SUBJECT` email.
4. For local development, run `npm run dev:api` and `npm run dev` in separate terminals, then enable reminders from **Settings → Calendar push reminders**.
5. For deployment, run `npm run build` followed by `npm start`. Host the app and API together on a single HTTPS Node.js service instance with a persistent disk for `DATABASE_PATH`. Configure the environment variables in the host's secret settings; do not commit `.env`. The reminder scheduler runs in this service, so it must remain online.

## Data and privacy

This first foundation uses browser `localStorage` and starts with empty records rather than fabricated sample activity. Data stays in the current browser profile on the current device. Export a JSON backup regularly. Clearing browser data can remove these records.

When push reminders are enabled, the server also stores the browser push subscription and upcoming event titles, times and notes needed to deliver notifications. Push credentials and server-side event data are not included in JSON backups.

## Not connected yet

General cross-device sync, cloud backup, integrations with bank or health services, and native mobile packaging are future work. The current responsive web app can be opened on a phone, but local browser storage does **not** synchronize phone and desktop data.

## Product direction

Personal OS is intended to become a personal command center: a connected view of what matters, what you are building, how you are progressing, and how your life is going. The next architecture milestone is a secure sync layer with explicit backup and conflict handling, followed by a PWA install experience.
