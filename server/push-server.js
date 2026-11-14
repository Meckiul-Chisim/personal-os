import 'dotenv/config'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { sendNotification, setVapidDetails } from 'web-push'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
const databasePath = process.env.DATABASE_PATH || path.join(rootDir, 'data', 'push.sqlite')
fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true })

const db = new Database(databasePath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    endpoint TEXT PRIMARY KEY,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    note TEXT NOT NULL,
    event_at_ms INTEGER NOT NULL,
    reminder_at_ms INTEGER NOT NULL,
    revision TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sent_reminders (
    event_id TEXT NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    revision TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    sent_at INTEGER NOT NULL,
    PRIMARY KEY (event_id, revision, endpoint)
  );
  CREATE INDEX IF NOT EXISTS calendar_events_due_idx
    ON calendar_events(reminder_at_ms, event_at_ms);
`)

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '64kb' }))

const envNames = ['PUSH_API_PASSWORD', 'PUSH_SESSION_SECRET', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']
const missingEnvironment = () => envNames.filter(name => !process.env[name])
const isConfigured = () => missingEnvironment().length === 0

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

const constantTimeEqual = (first, second) => {
  const firstBuffer = Buffer.from(first)
  const secondBuffer = Buffer.from(second)
  return firstBuffer.length === secondBuffer.length && crypto.timingSafeEqual(firstBuffer, secondBuffer)
}

const createSessionToken = () => {
  const payload = Buffer.from(JSON.stringify({
    subject: 'owner',
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  })).toString('base64url')
  const signature = crypto.createHmac('sha256', process.env.PUSH_SESSION_SECRET).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

const isValidSessionToken = token => {
  const [payload, signature, extra] = String(token || '').split('.')
  if (!payload || !signature || extra) return false

  const expected = crypto.createHmac('sha256', process.env.PUSH_SESSION_SECRET).update(payload).digest('base64url')
  if (!constantTimeEqual(signature, expected)) return false

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return session.subject === 'owner' && Number.isFinite(session.expiresAt) && session.expiresAt > Date.now()
  } catch {
    return false
  }
}

const requireSession = (request, response, next) => {
  const authorization = request.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!process.env.PUSH_SESSION_SECRET || !isValidSessionToken(token)) {
    return response.status(401).json({ error: 'Your push session is invalid or expired. Sign in again.' })
  }
  next()
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))

app.get('/api/push/config', (_request, response) => {
  response.json({
    configured: isConfigured(),
    missing: missingEnvironment(),
    publicKey: process.env.VAPID_PUBLIC_KEY || null,
  })
})

app.post('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}), (request, response) => {
  if (!isConfigured()) {
    return response.status(503).json({
      error: 'Push reminders are not configured on the server.',
      missing: missingEnvironment(),
    })
  }

  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  if (!constantTimeEqual(password, process.env.PUSH_API_PASSWORD)) {
    return response.status(401).json({ error: 'The push access password is incorrect.' })
  }

  response.json({ token: createSessionToken() })
})

app.get('/api/push/status', requireSession, (_request, response) => {
  const result = db.prepare('SELECT COUNT(*) AS count FROM push_subscriptions').get()
  response.json({ subscriptionCount: result.count })
})

app.post('/api/push/subscription', requireSession, (request, response) => {
  const subscription = request.body?.subscription
  const endpoint = subscription?.endpoint
  const p256dh = subscription?.keys?.p256dh
  const auth = subscription?.keys?.auth

  if (typeof endpoint !== 'string' || typeof p256dh !== 'string' || typeof auth !== 'string') {
    return response.status(400).json({ error: 'A valid browser push subscription is required.' })
  }

  try {
    if (new URL(endpoint).protocol !== 'https:') throw new Error('Invalid protocol')
  } catch {
    return response.status(400).json({ error: 'The push subscription endpoint must use HTTPS.' })
  }

  db.prepare(`
    INSERT INTO push_subscriptions (endpoint, p256dh, auth, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth
  `).run(endpoint, p256dh, auth, Date.now())

  response.json({ subscribed: true })
})

app.delete('/api/push/subscription', requireSession, (request, response) => {
  const endpoint = request.body?.endpoint
  if (typeof endpoint !== 'string') {
    return response.status(400).json({ error: 'A subscription endpoint is required.' })
  }

  db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint)
  response.json({ subscribed: false })
})

app.put('/api/calendar-events', requireSession, (request, response) => {
  const events = request.body?.events
  if (!Array.isArray(events) || events.length > 2000) {
    return response.status(400).json({ error: 'Calendar events must be an array of up to 2,000 items.' })
  }

  const now = Date.now()
  const futureEvents = []
  for (const event of events) {
    if (
      !event
      || typeof event.id !== 'string'
      || event.id.length > 100
      || typeof event.title !== 'string'
      || event.title.trim().length === 0
      || event.title.length > 300
      || typeof event.note !== 'string'
      || event.note.length > 2000
      || !Number.isSafeInteger(event.eventAt)
      || event.eventAt <= 0
    ) {
      return response.status(400).json({ error: 'A calendar event has invalid fields.' })
    }

    if (event.eventAt > now) {
      const title = event.title.trim()
      const revision = crypto.createHash('sha256')
        .update(JSON.stringify([title, event.note, event.eventAt]))
        .digest('hex')

      futureEvents.push({
        id: event.id,
        title,
        note: event.note,
        eventAt: event.eventAt,
        reminderAt: event.eventAt - 5 * 60 * 1000,
        revision,
      })
    }
  }

  const saveEvents = db.transaction(items => {
    const keep = new Set(items.map(event => event.id))
    const existing = db.prepare('SELECT id FROM calendar_events').all()
    const deleteEvent = db.prepare('DELETE FROM calendar_events WHERE id = ?')
    for (const event of existing) {
      if (!keep.has(event.id)) deleteEvent.run(event.id)
    }

    const saveEvent = db.prepare(`
      INSERT INTO calendar_events (id, title, note, event_at_ms, reminder_at_ms, revision)
      VALUES (@id, @title, @note, @eventAt, @reminderAt, @revision)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        note = excluded.note,
        event_at_ms = excluded.event_at_ms,
        reminder_at_ms = excluded.reminder_at_ms,
        revision = excluded.revision
    `)
    for (const event of items) saveEvent.run(event)
  })
  saveEvents(futureEvents)

  response.json({ synced: futureEvents.length, reminderLeadMinutes: 5 })
})

let reminderJobRunning = false
const processDueReminders = async () => {
  if (!isConfigured() || reminderJobRunning) return
  reminderJobRunning = true

  try {
    const now = Date.now()
    const dueEvents = db.prepare(`
      SELECT id, title, note, event_at_ms, revision
      FROM calendar_events
      WHERE reminder_at_ms <= ? AND event_at_ms > ?
    `).all(now, now)
    const subscriptions = db.prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions').all()
    const hasDelivered = db.prepare(`
      SELECT 1 FROM sent_reminders WHERE event_id = ? AND revision = ? AND endpoint = ?
    `)
    const markDelivered = db.prepare(`
      INSERT OR IGNORE INTO sent_reminders (event_id, revision, endpoint, sent_at)
      VALUES (?, ?, ?, ?)
    `)
    const removeSubscription = db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?')

    for (const event of dueEvents) {
      for (const subscription of subscriptions) {
        if (hasDelivered.get(event.id, event.revision, subscription.endpoint)) continue

        try {
          await sendNotification({
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          }, JSON.stringify({
            title: event.title,
            body: `Starting in 5 minutes${event.note ? ` · ${event.note}` : ''}`,
            url: '/',
          }), { TTL: 3600 })
          markDelivered.run(event.id, event.revision, subscription.endpoint, Date.now())
        } catch (error) {
          const statusCode = error?.statusCode
          if (statusCode === 404 || statusCode === 410) {
            removeSubscription.run(subscription.endpoint)
          } else {
            console.error(`Could not send reminder for event ${event.id}:`, error)
          }
        }
      }
    }
  } finally {
    reminderJobRunning = false
  }
}

const distDir = path.join(rootDir, 'dist')
app.use(express.static(distDir))
app.use((request, response, next) => {
  if (request.method === 'GET' && !request.path.startsWith('/api/')) {
    return response.sendFile(path.join(distDir, 'index.html'), error => {
      if (error) next(error)
    })
  }
  next()
})
app.use('/api', (_request, response) => response.status(404).json({ error: 'API route not found.' }))
app.use((error, _request, response, _next) => {
  console.error('Push API request failed:', error)
  response.status(500).json({ error: 'The push service encountered an unexpected error.' })
})

const port = Number(process.env.PORT || 3001)
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Personal OS push service listening on port ${port}`)
  if (!isConfigured()) console.warn(`Push reminders disabled; missing environment: ${missingEnvironment().join(', ')}`)
})

const reminderInterval = setInterval(() => {
  processDueReminders().catch(error => console.error('Reminder scheduler failed:', error))
}, 15_000)
processDueReminders().catch(error => console.error('Reminder scheduler failed:', error))

let shuttingDown = false
const shutdown = () => {
  if (shuttingDown) return
  shuttingDown = true
  clearInterval(reminderInterval)
  server.close(() => {
    db.close()
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
