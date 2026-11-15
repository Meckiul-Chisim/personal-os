import 'dotenv/config'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { OAuth2Client } from 'google-auth-library'
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
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_salt TEXT,
    password_hash TEXT,
    google_subject TEXT UNIQUE,
    created_at INTEGER NOT NULL,
    CHECK ((password_salt IS NULL) = (password_hash IS NULL))
  );
  CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions(expires_at);
  CREATE TABLE IF NOT EXISTS app_data (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data_json TEXT NOT NULL,
    version INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS account_push_subscriptions (
    endpoint TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS account_calendar_events (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    note TEXT NOT NULL,
    event_at_ms INTEGER NOT NULL,
    reminder_at_ms INTEGER NOT NULL,
    revision TEXT NOT NULL,
    PRIMARY KEY (user_id, id)
  );
  CREATE TABLE IF NOT EXISTS account_sent_reminders (
    user_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    revision TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    sent_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, event_id, revision, endpoint),
    FOREIGN KEY (user_id, event_id) REFERENCES account_calendar_events(user_id, id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS account_calendar_events_due_idx
    ON account_calendar_events(reminder_at_ms, event_at_ms);
`)

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(express.json({ limit: '2mb' }))

const scrypt = promisify(crypto.scrypt)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const AUTH_SESSION_MS = 30 * 24 * 60 * 60 * 1000
const AUTH_COOKIE = 'personal_os_session'
const accountDataKeys = ['tasks', 'projects', 'goals', 'habits', 'health', 'transactions', 'learning', 'notes', 'calendarEvents']
const accountRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

const normalizeEmail = value => typeof value === 'string' ? value.trim().toLowerCase() : ''
const isEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const tokenDigest = token => crypto.createHash('sha256').update(token).digest('hex')
const publicAccount = account => ({
  id: account.id,
  email: account.email,
  googleLinked: Boolean(account.google_subject || account.googleLinked),
  passwordLoginEnabled: Boolean(account.password_hash || account.passwordLoginEnabled),
})

const setAuthCookie = (request, response, token) => {
  const secure = request.secure ? '; Secure' : ''
  response.setHeader('Set-Cookie', `${AUTH_COOKIE}=${token}; Path=/; Max-Age=${Math.floor(AUTH_SESSION_MS / 1000)}; HttpOnly; SameSite=Lax${secure}`)
}

const clearAuthCookie = (request, response) => {
  const secure = request.secure ? '; Secure' : ''
  response.setHeader('Set-Cookie', `${AUTH_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`)
}

const createAccountSession = (request, response, account) => {
  const token = crypto.randomBytes(32).toString('base64url')
  const now = Date.now()
  db.prepare('INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(tokenDigest(token), account.id, now + AUTH_SESSION_MS, now)
  setAuthCookie(request, response, token)
  response.json({ user: publicAccount(account) })
}

const requireRequestIntent = (request, response, next) => {
  if (request.get('x-personalos-request') !== '1') {
    return response.status(403).json({ error: 'This request could not be verified. Reload the page and try again.' })
  }
  next()
}

const requireAccountSession = (request, response, next) => {
  const cookie = (request.headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(`${AUTH_COOKIE}=`))
  const token = cookie?.slice(AUTH_COOKIE.length + 1)
  if (!token) return response.status(401).json({ error: 'Sign in to continue.' })

  const session = db.prepare(`
    SELECT users.id, users.email, users.google_subject, users.password_hash, auth_sessions.token_hash, auth_sessions.expires_at
    FROM auth_sessions JOIN users ON users.id = auth_sessions.user_id
    WHERE auth_sessions.token_hash = ?
  `).get(tokenDigest(token))
  if (!session || session.expires_at <= Date.now()) {
    if (session) db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(session.token_hash)
    clearAuthCookie(request, response)
    return response.status(401).json({ error: 'Your session expired. Sign in again.' })
  }

  request.account = {
    id: session.id,
    email: session.email,
    googleLinked: Boolean(session.google_subject),
    passwordLoginEnabled: Boolean(session.password_hash),
  }
  next()
}

const optionalAccountSession = (request, response, next) => {
  const cookie = (request.headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(`${AUTH_COOKIE}=`))
  const token = cookie?.slice(AUTH_COOKIE.length + 1)
  if (!token) return next()

  const session = db.prepare(`
    SELECT users.id, users.email, users.google_subject, users.password_hash, auth_sessions.token_hash, auth_sessions.expires_at
    FROM auth_sessions JOIN users ON users.id = auth_sessions.user_id
    WHERE auth_sessions.token_hash = ?
  `).get(tokenDigest(token))
  if (!session || session.expires_at <= Date.now()) {
    if (session) db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(session.token_hash)
    clearAuthCookie(request, response)
    return next()
  }
  request.account = {
    id: session.id,
    email: session.email,
    googleLinked: Boolean(session.google_subject),
    passwordLoginEnabled: Boolean(session.password_hash),
  }
  next()
}

const validateAccountData = data => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  if (data.theme !== 'light' && data.theme !== 'dark') return false
  if (!accountDataKeys.every(key => Array.isArray(data[key])
    && data[key].length <= 5000
    && data[key].every(item => item && typeof item === 'object' && !Array.isArray(item) && typeof item.id === 'string'))) return false
  return Buffer.byteLength(JSON.stringify(data), 'utf8') <= 1_500_000
}

const envNames = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']
const missingEnvironment = () => envNames.filter(name => !process.env[name])
const isConfigured = () => missingEnvironment().length === 0

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))

app.get('/api/push/config', (_request, response) => {
  response.json({
    configured: isConfigured(),
    missing: missingEnvironment(),
    publicKey: process.env.VAPID_PUBLIC_KEY || null,
  })
})

app.get('/api/auth/config', (_request, response) => {
  response.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || null })
})

app.post('/api/auth/register', accountRateLimit, requireRequestIntent, async (request, response) => {
  const email = normalizeEmail(request.body?.email)
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  if (!isEmail(email)) return response.status(400).json({ error: 'Enter a valid email address.' })
  if (password.length < 12 || password.length > 256) {
    return response.status(400).json({ error: 'Use a password between 12 and 256 characters.' })
  }

  const salt = crypto.randomBytes(16)
  const passwordHash = await scrypt(password, salt, 64)
  const account = { id: crypto.randomUUID(), email, passwordLoginEnabled: true }
  try {
    db.prepare(`
      INSERT INTO users (id, email, password_salt, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(account.id, account.email, salt.toString('hex'), Buffer.from(passwordHash).toString('hex'), Date.now())
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({ error: 'An account with this email already exists. Sign in instead.' })
    }
    throw error
  }
  createAccountSession(request, response, account)
})

app.post('/api/auth/login', accountRateLimit, requireRequestIntent, async (request, response) => {
  const email = normalizeEmail(request.body?.email)
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  if (!isEmail(email) || password.length > 256) {
    return response.status(401).json({ error: 'The email or password is incorrect.' })
  }

  const account = db.prepare('SELECT id, email, google_subject, password_salt, password_hash FROM users WHERE email = ?').get(email)
  if (!account?.password_hash) return response.status(401).json({ error: 'The email or password is incorrect.' })
  const passwordHash = Buffer.from(await scrypt(password, Buffer.from(account.password_salt, 'hex'), 64))
  const expectedHash = Buffer.from(account.password_hash, 'hex')
  if (passwordHash.length !== expectedHash.length || !crypto.timingSafeEqual(passwordHash, expectedHash)) {
    return response.status(401).json({ error: 'The email or password is incorrect.' })
  }
  createAccountSession(request, response, account)
})

app.post('/api/auth/google', accountRateLimit, requireRequestIntent, optionalAccountSession, async (request, response) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return response.status(503).json({ error: 'Google sign-in is not configured on this server.' })
  }
  const credential = typeof request.body?.credential === 'string' ? request.body.credential : ''
  if (!credential) return response.status(400).json({ error: 'A Google sign-in credential is required.' })

  let payload
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID })
    payload = ticket.getPayload()
  } catch {
    return response.status(401).json({ error: 'Google could not verify this sign-in. Please try again.' })
  }
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    return response.status(401).json({ error: 'Google did not provide a verified email address.' })
  }

  const email = normalizeEmail(payload.email)
  let account = db.prepare('SELECT id, email, google_subject, password_hash FROM users WHERE google_subject = ?').get(payload.sub)
  if (account && request.account && account.id !== request.account.id) {
    return response.status(409).json({ error: 'This Google account is already linked to a different Personal OS account.' })
  }
  if (!account) {
    account = db.prepare('SELECT id, email, google_subject, password_hash FROM users WHERE email = ?').get(email)
    if (account) {
      if (account.id !== request.account?.id) {
        return response.status(409).json({ error: 'An account already uses this email. Sign in to that account before linking Google.' })
      }
      if (account.google_subject) {
        return response.status(409).json({ error: 'This email is already linked to a different Google account.' })
      }
      db.prepare('UPDATE users SET google_subject = ? WHERE id = ? AND google_subject IS NULL')
        .run(payload.sub, account.id)
      account.google_subject = payload.sub
    } else {
      account = { id: crypto.randomUUID(), email, google_subject: payload.sub, passwordLoginEnabled: false }
      db.prepare('INSERT INTO users (id, email, google_subject, created_at) VALUES (?, ?, ?, ?)')
        .run(account.id, account.email, payload.sub, Date.now())
    }
  }
  createAccountSession(request, response, account)
})

app.get('/api/auth/me', requireAccountSession, (request, response) => {
  response.json({ user: request.account })
})

app.post('/api/auth/logout', requireRequestIntent, requireAccountSession, (request, response) => {
  const cookie = (request.headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(`${AUTH_COOKIE}=`))
  if (cookie) db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(tokenDigest(cookie.slice(AUTH_COOKIE.length + 1)))
  if (typeof request.body?.pushEndpoint === 'string') {
    db.prepare('DELETE FROM account_push_subscriptions WHERE user_id = ? AND endpoint = ?')
      .run(request.account.id, request.body.pushEndpoint)
  }
  clearAuthCookie(request, response)
  response.json({ signedOut: true })
})

app.get('/api/data', requireAccountSession, (request, response) => {
  const saved = db.prepare('SELECT data_json, version FROM app_data WHERE user_id = ?').get(request.account.id)
  response.json({ data: saved ? JSON.parse(saved.data_json) : null, version: saved?.version || 0 })
})

app.put('/api/data', requireRequestIntent, requireAccountSession, (request, response) => {
  const { data, version } = request.body || {}
  if (!Number.isSafeInteger(version) || version < 0 || !validateAccountData(data)) {
    return response.status(400).json({ error: 'The account data is invalid or too large to sync.' })
  }

  const now = Date.now()
  const save = db.transaction(() => {
    const saved = db.prepare('SELECT data_json, version FROM app_data WHERE user_id = ?').get(request.account.id)
    const currentVersion = saved?.version || 0
    if (version !== currentVersion) {
      return { conflict: true, data: saved ? JSON.parse(saved.data_json) : null, version: currentVersion }
    }
    const nextVersion = currentVersion + 1
    if (saved) {
      db.prepare('UPDATE app_data SET data_json = ?, version = ?, updated_at = ? WHERE user_id = ?')
        .run(JSON.stringify(data), nextVersion, now, request.account.id)
    } else {
      db.prepare('INSERT INTO app_data (user_id, data_json, version, updated_at) VALUES (?, ?, ?, ?)')
        .run(request.account.id, JSON.stringify(data), nextVersion, now)
    }
    return { conflict: false, version: nextVersion }
  })
  const result = save()
  if (result.conflict) return response.status(409).json({ error: 'Account data changed on another device.', ...result })
  response.json({ version: result.version })
})

app.get('/api/push/status', requireAccountSession, (request, response) => {
  const result = db.prepare('SELECT COUNT(*) AS count FROM account_push_subscriptions WHERE user_id = ?')
    .get(request.account.id)
  const endpoint = typeof request.query.endpoint === 'string' ? request.query.endpoint : ''
  const currentDeviceSubscribed = endpoint
    ? Boolean(db.prepare('SELECT 1 FROM account_push_subscriptions WHERE user_id = ? AND endpoint = ?').get(request.account.id, endpoint))
    : false
  response.json({ subscriptionCount: result.count, currentDeviceSubscribed })
})

app.post('/api/push/subscription', requireRequestIntent, requireAccountSession, (request, response) => {
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
    INSERT INTO account_push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET
      user_id = excluded.user_id,
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      created_at = excluded.created_at
  `).run(request.account.id, endpoint, p256dh, auth, Date.now())

  response.json({ subscribed: true })
})

app.delete('/api/push/subscription', requireRequestIntent, requireAccountSession, (request, response) => {
  const endpoint = request.body?.endpoint
  if (typeof endpoint !== 'string') {
    return response.status(400).json({ error: 'A subscription endpoint is required.' })
  }

  db.prepare('DELETE FROM account_push_subscriptions WHERE user_id = ? AND endpoint = ?')
    .run(request.account.id, endpoint)
  response.json({ subscribed: false })
})

app.put('/api/calendar-events', requireRequestIntent, requireAccountSession, (request, response) => {
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

  const saveEvents = db.transaction((userId, items) => {
    const keep = new Set(items.map(event => event.id))
    const existing = db.prepare('SELECT id FROM account_calendar_events WHERE user_id = ?').all(userId)
    const deleteEvent = db.prepare('DELETE FROM account_calendar_events WHERE user_id = ? AND id = ?')
    for (const event of existing) {
      if (!keep.has(event.id)) deleteEvent.run(userId, event.id)
    }

    const saveEvent = db.prepare(`
      INSERT INTO account_calendar_events (user_id, id, title, note, event_at_ms, reminder_at_ms, revision)
      VALUES (@userId, @id, @title, @note, @eventAt, @reminderAt, @revision)
      ON CONFLICT(user_id, id) DO UPDATE SET
        title = excluded.title,
        note = excluded.note,
        event_at_ms = excluded.event_at_ms,
        reminder_at_ms = excluded.reminder_at_ms,
        revision = excluded.revision
    `)
    for (const event of items) saveEvent.run({ ...event, userId })
  })
  saveEvents(request.account.id, futureEvents)

  response.json({ synced: futureEvents.length, reminderLeadMinutes: 5 })
})

let reminderJobRunning = false
const processDueReminders = async () => {
  if (!isConfigured() || reminderJobRunning) return
  reminderJobRunning = true

  try {
    const now = Date.now()
    const dueEvents = db.prepare(`
      SELECT user_id, id, title, note, event_at_ms, revision
      FROM account_calendar_events
      WHERE reminder_at_ms <= ? AND event_at_ms > ?
    `).all(now, now)
    const subscriptionsByUser = db.prepare('SELECT user_id, endpoint, p256dh, auth FROM account_push_subscriptions WHERE user_id = ?')
    const hasDelivered = db.prepare(`
      SELECT 1 FROM account_sent_reminders WHERE user_id = ? AND event_id = ? AND revision = ? AND endpoint = ?
    `)
    const markDelivered = db.prepare(`
      INSERT OR IGNORE INTO account_sent_reminders (user_id, event_id, revision, endpoint, sent_at)
      VALUES (?, ?, ?, ?, ?)
    `)

    for (const event of dueEvents) {
      const subscriptions = subscriptionsByUser.all(event.user_id)
      for (const subscription of subscriptions) {
        if (hasDelivered.get(event.user_id, event.id, event.revision, subscription.endpoint)) continue

        try {
          await sendNotification({
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          }, JSON.stringify({
            title: event.title,
            body: `Starting in 5 minutes${event.note ? ` · ${event.note}` : ''}`,
            url: '/',
          }), { TTL: 3600 })
          markDelivered.run(event.user_id, event.id, event.revision, subscription.endpoint, Date.now())
        } catch (error) {
          const statusCode = error?.statusCode
          if (statusCode === 404 || statusCode === 410) {
            db.prepare('DELETE FROM account_push_subscriptions WHERE user_id = ? AND endpoint = ?')
              .run(event.user_id, subscription.endpoint)
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
