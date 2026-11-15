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
- **Settings** — account details, Google linking, cross-device sync status, appearance, JSON backups and optional calendar push reminders.

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

## Accounts and cross-device sync

Personal OS supports email/password accounts and Google sign-in. Account data is stored in the server's SQLite database and syncs when you use the same account on desktop and mobile. The browser also keeps an account-scoped local copy. When you first sign in on a device with older local data, the app asks whether to merge it into the account or use the cloud copy.

1. Copy `.env.example` to `.env`.
2. To enable Google sign-in, create an OAuth 2.0 **Web application** client in Google Cloud Console. Add the development origin (for example `http://localhost:5173`) and your production HTTPS origin to its authorized JavaScript origins, then set `GOOGLE_CLIENT_ID` to that client ID. Email/password sign-in works without Google credentials.
3. Run `npm run dev:api` and `npm run dev` in separate terminals. Create an account in the app.
4. For desktop/mobile use outside localhost, deploy the app and API together on an HTTPS Node.js service with a persistent disk for `DATABASE_PATH`. Configure environment variables in the host's secret settings; do not commit `.env`.

Passwords are stored as salted scrypt hashes and account sessions use HTTP-only cookies. Google can create an account; to use Google with an existing email/password account, sign in first and link it from **Settings**. Email verification and password-reset email are not configured, so an account without a linked Google identity cannot be recovered if its password is lost. Keep a JSON backup.

## Calendar push reminders

Push reminders are optional and require a backend server that stays online. When reminders are enabled, upcoming calendar event titles, times and notes are synced to the server so it can notify you five minutes before each event.

1. Generate VAPID keys with `npm run generate:vapid` and copy the displayed public/private keys into `.env`; set `VAPID_SUBJECT` to your email.
2. Sign in, then enable reminders from **Settings → Calendar push reminders**. Reminder subscriptions and events are scoped to the signed-in account.
3. For deployment, run `npm run build` followed by `npm start`. The reminder scheduler runs in this service, so it must remain online.

After upgrading an existing deployment, re-enable push reminders on each device. Previously saved push subscriptions are not migrated to account ownership.

## Data and privacy

Account data is stored in the server-side SQLite database and also cached in the signed-in account's browser storage. The server stores account data as readable JSON; host operators with database access can access it. Use a host and database you trust, enable HTTPS, and export a JSON backup regularly.

When push reminders are enabled, the server also stores the browser push subscription and upcoming event titles, times and notes needed to deliver notifications. Push credentials and server-side event data are not included in JSON backups. Native mobile packaging and integrations with bank or health services are not included.

## Product direction

Personal OS is intended to become a personal command center: a connected view of what matters, what you are building, how you are progressing, and how your life is going.
