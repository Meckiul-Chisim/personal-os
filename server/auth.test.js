import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
let server
let temporaryDirectory
let baseUrl

const unusedPort = async () => {
  const listener = net.createServer()
  await new Promise((resolve, reject) => {
    listener.once('error', reject)
    listener.listen(0, '127.0.0.1', resolve)
  })
  const { port } = listener.address()
  await new Promise((resolve, reject) => listener.close(error => error ? reject(error) : resolve()))
  return port
}

const api = async (route, options = {}) => fetch(`${baseUrl}${route}`, options)
const authHeaders = cookie => ({
  Cookie: cookie,
  'Content-Type': 'application/json',
  'X-PersonalOS-Request': '1',
})
const accountData = theme => ({
  theme,
  tasks: [],
  projects: [],
  goals: [],
  habits: [],
  health: [],
  transactions: [],
  learning: [],
  notes: [],
  calendarEvents: [],
})

before(async () => {
  temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'personal-os-auth-'))
  const port = await unusedPort()
  baseUrl = `http://127.0.0.1:${port}`
  server = spawn(process.execPath, [path.join(rootDir, 'server', 'push-server.js')], {
    cwd: temporaryDirectory,
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_PATH: path.join(temporaryDirectory, 'test.sqlite'),
      GOOGLE_CLIENT_ID: '',
      VAPID_PUBLIC_KEY: '',
      VAPID_PRIVATE_KEY: '',
      VAPID_SUBJECT: '',
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  })
  let serverError = ''
  server.stderr.on('data', chunk => { serverError += chunk.toString() })

  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Test API exited early: ${serverError}`)
    try {
      const response = await api('/api/health')
      if (response.ok) return
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  throw new Error(`Test API did not start: ${serverError}`)
})

after(async () => {
  if (server && server.exitCode === null) {
    server.kill()
    await Promise.race([once(server, 'exit'), new Promise(resolve => setTimeout(resolve, 3000))])
  }
  if (temporaryDirectory) await fs.rm(temporaryDirectory, { recursive: true, force: true })
})

test('email accounts keep cloud data private and reject stale writes', async () => {
  const googleConfig = await api('/api/auth/config')
  assert.deepEqual(await googleConfig.json(), { googleClientId: null })
  const googleUnavailable = await api('/api/auth/google', {
    method: 'POST',
    headers: authHeaders(''),
    body: JSON.stringify({ credential: 'not-a-token' }),
  })
  assert.equal(googleUnavailable.status, 503)

  const registration = await api('/api/auth/register', {
    method: 'POST',
    headers: authHeaders(''),
    body: JSON.stringify({ email: 'Alice@example.com', password: 'a-very-long-password' }),
  })
  assert.equal(registration.status, 200)
  const aliceCookie = registration.headers.get('set-cookie')?.split(';')[0]
  assert.ok(aliceCookie)
  assert.match(registration.headers.get('set-cookie'), /HttpOnly/i)
  const registeredAccount = (await registration.json()).user
  assert.equal(typeof registeredAccount.id, 'string')
  assert.equal(registeredAccount.email, 'alice@example.com')
  assert.equal(registeredAccount.googleLinked, false)
  assert.equal(registeredAccount.passwordLoginEnabled, true)
  assert.equal((await api('/api/auth/me', { headers: { Cookie: aliceCookie } })).status, 200)

  const duplicate = await api('/api/auth/register', {
    method: 'POST',
    headers: authHeaders(aliceCookie),
    body: JSON.stringify({ email: 'ALICE@example.com', password: 'another-long-password' }),
  })
  assert.equal(duplicate.status, 409)

  const initialData = await api('/api/data', { headers: { Cookie: aliceCookie } })
  assert.deepEqual(await initialData.json(), { data: null, version: 0 })
  const save = await api('/api/data', {
    method: 'PUT',
    headers: authHeaders(aliceCookie),
    body: JSON.stringify({ data: accountData('dark'), version: 0 }),
  })
  assert.equal(save.status, 200)
  assert.deepEqual(await save.json(), { version: 1 })

  const staleWrite = await api('/api/data', {
    method: 'PUT',
    headers: authHeaders(aliceCookie),
    body: JSON.stringify({ data: accountData('light'), version: 0 }),
  })
  assert.equal(staleWrite.status, 409)
  assert.equal((await staleWrite.json()).version, 1)

  const bobRegistration = await api('/api/auth/register', {
    method: 'POST',
    headers: authHeaders(''),
    body: JSON.stringify({ email: 'bob@example.com', password: 'a-different-long-password' }),
  })
  assert.equal(bobRegistration.status, 200)
  const bobCookie = bobRegistration.headers.get('set-cookie')?.split(';')[0]
  assert.ok(bobCookie)
  assert.deepEqual(await (await api('/api/data', { headers: { Cookie: bobCookie } })).json(), { data: null, version: 0 })
  assert.equal((await api('/api/data')).status, 401)

  const invalidData = await api('/api/data', {
    method: 'PUT',
    headers: authHeaders(bobCookie),
    body: JSON.stringify({ data: { ...accountData('dark'), tasks: 'not-an-array' }, version: 0 }),
  })
  assert.equal(invalidData.status, 400)

  const pushEndpoint = 'https://push.example.test/browser'
  const aliceSubscription = await api('/api/push/subscription', {
    method: 'POST',
    headers: authHeaders(aliceCookie),
    body: JSON.stringify({ subscription: { endpoint: pushEndpoint, keys: { p256dh: 'public-key', auth: 'auth-key' } } }),
  })
  assert.equal(aliceSubscription.status, 200)
  const alicePushStatus = await api(`/api/push/status?endpoint=${encodeURIComponent(pushEndpoint)}`, {
    headers: { Cookie: aliceCookie },
  })
  assert.deepEqual(await alicePushStatus.json(), { subscriptionCount: 1, currentDeviceSubscribed: true })
  const bobPushStatus = await api(`/api/push/status?endpoint=${encodeURIComponent(pushEndpoint)}`, {
    headers: { Cookie: bobCookie },
  })
  assert.deepEqual(await bobPushStatus.json(), { subscriptionCount: 0, currentDeviceSubscribed: false })
  const bobSubscription = await api('/api/push/subscription', {
    method: 'POST',
    headers: authHeaders(bobCookie),
    body: JSON.stringify({ subscription: { endpoint: pushEndpoint, keys: { p256dh: 'public-key', auth: 'auth-key' } } }),
  })
  assert.equal(bobSubscription.status, 200)
  const aliceAfterDeviceSwitch = await api(`/api/push/status?endpoint=${encodeURIComponent(pushEndpoint)}`, {
    headers: { Cookie: aliceCookie },
  })
  assert.deepEqual(await aliceAfterDeviceSwitch.json(), { subscriptionCount: 0, currentDeviceSubscribed: false })

  const logout = await api('/api/auth/logout', { method: 'POST', headers: authHeaders(aliceCookie) })
  assert.equal(logout.status, 200)
  assert.equal((await api('/api/auth/me', { headers: { Cookie: aliceCookie } })).status, 401)

  const aliceLogin = await api('/api/auth/login', {
    method: 'POST',
    headers: authHeaders(''),
    body: JSON.stringify({ email: 'alice@example.com', password: 'a-very-long-password' }),
  })
  assert.equal(aliceLogin.status, 200)
})
