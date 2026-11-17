import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import PersonalOS from './PersonalOS'
import type { Account, PersonalOSData } from './types'

type ApiResult<T> = { data: T; response: Response }
type CloudData = { data: PersonalOSData | null; version: number }
type Migration = { account: Account; localData: PersonalOSData; cloudData: PersonalOSData | null; version: number }
type AppMode = 'loading' | 'auth' | 'migration' | 'ready' | 'error'
type AuthMode = 'login' | 'register'
type GoogleCredentialResponse = { credential: string }

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void
          renderButton: (element: HTMLElement, options: { theme: string; size: string; width: number }) => void
        }
      }
    }
  }
}

const EMPTY_DATA: PersonalOSData = {
  theme: 'light',
  tasks: [],
  projects: [],
  goals: [],
  habits: [],
  health: [],
  transactions: [],
  learning: [],
  notes: [],
  calendarEvents: [],
  timetable: [],
}
const STORAGE_KEYS: [keyof PersonalOSData, string][] = [
  ['theme', 'theme'],
  ['tasks', 'tasks'],
  ['projects', 'projects'],
  ['goals', 'goals'],
  ['habits', 'habits'],
  ['health', 'health'],
  ['transactions', 'transactions'],
  ['learning', 'learning'],
  ['notes', 'notes'],
  ['calendarEvents', 'calendar-events'],
  ['timetable', 'timetable'],
]

// How long to wait after the last change before saving to the cloud.
const SYNC_DELAY_MS = 800

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const responseJson = async <T,>(response: Response): Promise<ApiResult<T>> => {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new Error(`Could not read the server response (${response.status}).`)
  }
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
      ? body.error
      : `The request failed (${response.status}).`
    throw new ApiError(message, response.status)
  }
  return { data: body as T, response }
}

const request = async <T,>(url: string, init?: RequestInit) => {
  const response = await fetch(url, { credentials: 'same-origin', ...init })
  return responseJson<T>(response)
}

const normalizeData = (value: unknown): PersonalOSData => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The saved account data is invalid.')
  const data = value as Partial<PersonalOSData>
  if (data.theme !== 'light' && data.theme !== 'dark') throw new Error('The saved account theme is invalid.')
  for (const [key] of STORAGE_KEYS) {
    // `timetable` was added later, so older saved data may not have it yet.
    if (key !== 'theme' && key !== 'timetable' && !Array.isArray(data[key])) throw new Error('The saved account data is incomplete.')
  }
  if (data.timetable !== undefined && !Array.isArray(data.timetable)) throw new Error('The saved account data is incomplete.')
  return {
    theme: data.theme,
    tasks: data.tasks!,
    projects: data.projects!,
    goals: data.goals!,
    habits: data.habits!,
    health: data.health!,
    transactions: data.transactions!,
    learning: data.learning!,
    notes: data.notes!,
    calendarEvents: data.calendarEvents!,
    timetable: data.timetable ?? [],
  }
}

const serializeData = (data: PersonalOSData) => JSON.stringify(data)
const accountStorageKey = (accountId: string, key: string) => `personal-os:${accountId}:${key}`
const normalizeAccount = (value: unknown): Account => {
  if (!value || typeof value !== 'object' || !('id' in value) || typeof value.id !== 'string'
    || !('email' in value) || typeof value.email !== 'string') {
    throw new Error('The server returned an invalid account.')
  }
  const account = value as Partial<Account>
  return {
    id: account.id!,
    email: account.email!,
    googleLinked: Boolean(account.googleLinked),
    passwordLoginEnabled: typeof account.passwordLoginEnabled === 'boolean' ? account.passwordLoginEnabled : true,
  }
}
const hasRecords = (data: PersonalOSData) => STORAGE_KEYS.some(([key]) =>
  key === 'theme' ? data.theme === 'dark' : data[key].length > 0,
)

const readStoredData = (accountId?: string): PersonalOSData | null => {
  const data: Record<string, unknown> = { ...EMPTY_DATA }
  let found = false
  for (const [dataKey, storageKey] of STORAGE_KEYS) {
    const key = accountId ? accountStorageKey(accountId, storageKey) : `personal-os:${storageKey}`
    const stored = localStorage.getItem(key)
    if (stored === null) continue
    found = true
    data[dataKey] = JSON.parse(stored)
  }
  return found ? normalizeData(data) : null
}

const mergeData = (local: PersonalOSData, cloud: PersonalOSData): PersonalOSData => {
  const mergeList = <T extends { id: string }>(localItems: T[], cloudItems: T[]) => {
    const merged = new Map(cloudItems.map(item => [item.id, item]))
    for (const item of localItems) merged.set(item.id, item)
    return [...merged.values()]
  }
  return {
    theme: local.theme,
    tasks: mergeList(local.tasks, cloud.tasks),
    projects: mergeList(local.projects, cloud.projects),
    goals: mergeList(local.goals, cloud.goals),
    habits: mergeList(local.habits, cloud.habits),
    health: mergeList(local.health, cloud.health),
    transactions: mergeList(local.transactions, cloud.transactions),
    learning: mergeList(local.learning, cloud.learning),
    notes: mergeList(local.notes, cloud.notes),
    calendarEvents: mergeList(local.calendarEvents, cloud.calendarEvents),
    timetable: mergeList(local.timetable, cloud.timetable),
  }
}

const writeAccountData = (accountId: string, data: PersonalOSData, version: number) => {
  for (const [dataKey, storageKey] of STORAGE_KEYS) {
    localStorage.setItem(accountStorageKey(accountId, storageKey), JSON.stringify(data[dataKey]))
  }
  localStorage.setItem(accountStorageKey(accountId, 'sync-baseline'), serializeData(data))
  localStorage.setItem(accountStorageKey(accountId, 'sync-version'), String(version))
}

const getCloudData = async () => {
  const result = await request<CloudData>('/api/data')
  return { data: result.data.data ? normalizeData(result.data.data) : null, version: result.data.version }
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('loading')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [account, setAccount] = useState<Account | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [appError, setAppError] = useState('')
  const [migration, setMigration] = useState<Migration | null>(null)
  const [migrationError, setMigrationError] = useState('')
  const [syncState, setSyncState] = useState<'syncing' | 'synced' | 'error' | 'conflict'>('syncing')
  const [syncError, setSyncError] = useState('')
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleError, setGoogleError] = useState('')
  const [googleLinkError, setGoogleLinkError] = useState('')
  const [googleRenderRequest, setGoogleRenderRequest] = useState(0)
  const [mountGeneration, setMountGeneration] = useState(0)
  const [busy, setBusy] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<Account | null>(null)
  const cloudVersionRef = useRef(0)
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve())
  const latestDataRef = useRef<PersonalOSData | null>(null)
  const baselineDataRef = useRef<PersonalOSData | null>(null)
  const syncPausedRef = useRef(false)
  const syncInFlightRef = useRef(false)
  const syncTimerRef = useRef<number | undefined>(undefined)

  const activateAccount = useCallback((activeAccount: Account, data: PersonalOSData, version: number) => {
    writeAccountData(activeAccount.id, data, version)
    accountRef.current = activeAccount
    cloudVersionRef.current = version
    latestDataRef.current = data
    baselineDataRef.current = data
    syncPausedRef.current = false
    window.clearTimeout(syncTimerRef.current)
    setAccount(activeAccount)
    setSyncState('synced')
    setSyncError('')
    setGoogleLinkError('')
    setMode('ready')
  }, [])

  const prepareAccount = useCallback(async (activeAccount: Account) => {
    const cloud = await getCloudData()
    const legacyKey = accountStorageKey(activeAccount.id, 'legacy-reviewed')
    const alreadyReviewedLegacy = localStorage.getItem(legacyKey) === '1'
    const legacyData = alreadyReviewedLegacy ? null : readStoredData()
    const cache = readStoredData(activeAccount.id)
    const baselineValue = localStorage.getItem(accountStorageKey(activeAccount.id, 'sync-baseline'))
    const baseline = baselineValue ? normalizeData(JSON.parse(baselineValue)) : null
    const cacheVersion = Number(localStorage.getItem(accountStorageKey(activeAccount.id, 'sync-version')) || 0)
    const cacheHasUnsyncedChanges = Boolean(cache && (!baseline || serializeData(cache) !== serializeData(baseline)))
    const cacheIsBehindCloud = Boolean(cache && cloud.data && cacheVersion < cloud.version && serializeData(cache) !== serializeData(cloud.data))
    const localData = legacyData && hasRecords(legacyData)
      ? legacyData
      : (cacheHasUnsyncedChanges || cacheIsBehindCloud ? cache : null)

    if (localData) {
      setMigration({ account: activeAccount, localData, cloudData: cloud.data, version: cloud.version })
      setMigrationError('')
      setMode('migration')
      return
    }
    activateAccount(activeAccount, cloud.data || EMPTY_DATA, cloud.version)
  }, [activateAccount])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const result = await request<{ user: unknown }>('/api/auth/me')
        if (!cancelled) await prepareAccount(normalizeAccount(result.data.user))
      } catch (error) {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) {
          setMode('auth')
          return
        }
        setAppError(error instanceof Error ? error.message : 'Could not load your account.')
        setMode('error')
      }
    }
    void load()
    return () => { cancelled = true }
  }, [prepareAccount])

  useEffect(() => {
    let cancelled = false
    request<{ googleClientId: string | null }>('/api/auth/config')
      .then(result => { if (!cancelled) setGoogleClientId(result.data.googleClientId || '') })
      .catch(error => { if (!cancelled) setGoogleError(error instanceof Error ? error.message : 'Google sign-in is unavailable.') })
    return () => { cancelled = true }
  }, [])

  const signInWithGoogle = useCallback(async (credential: string) => {
    if (mode === 'ready' && accountRef.current) {
      setBusy(true)
      setGoogleLinkError('')
      try {
        const result = await request<{ user: unknown }>('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-PersonalOS-Request': '1' },
          body: JSON.stringify({ credential }),
        })
        const linkedAccount = normalizeAccount(result.data.user)
        if (linkedAccount.id !== accountRef.current.id) {
          throw new Error('This Google account belongs to a different Personal OS account.')
        }
        accountRef.current = linkedAccount
        setAccount(linkedAccount)
      } catch (error) {
        setGoogleLinkError(error instanceof Error ? error.message : 'Could not link Google to this account.')
      } finally {
        setBusy(false)
      }
      return
    }

    setBusy(true)
    setAuthError('')
    setMode('loading')
    try {
      const result = await request<{ user: unknown }>('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-PersonalOS-Request': '1' },
        body: JSON.stringify({ credential }),
      })
      await prepareAccount(normalizeAccount(result.data.user))
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Google sign-in failed.')
      setMode('auth')
    } finally {
      setBusy(false)
    }
  }, [mode, prepareAccount])

  useEffect(() => {
    const showGoogleButton = mode === 'auth' || (mode === 'ready' && Boolean(account && !account.googleLinked))
    if (!googleClientId || !showGoogleButton || !googleButtonRef.current) return
    let cancelled = false
    const renderGoogleButton = () => {
      if (cancelled || !window.google || !googleButtonRef.current) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: response => { void signInWithGoogle(response.credential) },
      })
      googleButtonRef.current.replaceChildren()
      window.google.accounts.id.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large', width: 320 })
    }

    if (window.google) {
      renderGoogleButton()
    } else {
      const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]')
      const script = existing || document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.dataset.googleIdentity = 'true'
      script.addEventListener('load', renderGoogleButton)
      script.addEventListener('error', () => setGoogleError('Could not load Google sign-in. Check your connection or use email and password.'))
      if (!existing) document.head.appendChild(script)
    }
    return () => { cancelled = true }
  }, [account, googleClientId, mode, googleRenderRequest, signInWithGoogle])

  useEffect(() => {
    if (mode !== 'ready' || !account) return
    let cancelled = false
    const checkForRemoteChanges = async () => {
      try {
        const cloud = await getCloudData()
        if (cancelled || cloud.version <= cloudVersionRef.current) return
        const latest = latestDataRef.current
        const baseline = baselineDataRef.current
        if (syncInFlightRef.current) return
        if (latest && cloud.data && serializeData(latest) === serializeData(cloud.data)) {
          cloudVersionRef.current = cloud.version
          baselineDataRef.current = cloud.data
          writeAccountData(account.id, cloud.data, cloud.version)
          setSyncState('synced')
          setSyncError('')
          return
        }
        if (!latest || !baseline || serializeData(latest) !== serializeData(baseline)) {
          syncPausedRef.current = true
          setSyncState('conflict')
          setSyncError('This account changed on another device while this device had unsynced changes. Load the latest cloud version or export a backup before replacing this copy.')
          return
        }

        const newData = cloud.data || EMPTY_DATA
        cloudVersionRef.current = cloud.version
        latestDataRef.current = newData
        baselineDataRef.current = newData
        syncPausedRef.current = false
        writeAccountData(account.id, newData, cloud.version)
        setSyncState('synced')
        setSyncError('')
        setMountGeneration(current => current + 1)
      } catch (error) {
        if (cancelled) return
        setSyncState('error')
        setSyncError(error instanceof Error ? error.message : 'Could not check for updates from your other devices.')
      }
    }
    const timer = window.setInterval(() => { void checkForRemoteChanges() }, 15_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [account, mode, syncState])

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault()
    setAuthError('')
    if (authMode === 'register' && password !== confirmPassword) {
      setAuthError('The passwords do not match.')
      return
    }
    if (authMode === 'register' && password.length < 12) {
      setAuthError('Use a password with at least 12 characters.')
      return
    }
    setBusy(true)
    setMode('loading')
    try {
      const result = await request<{ user: unknown }>(authMode === 'register' ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-PersonalOS-Request': '1' },
        body: JSON.stringify({ email, password }),
      })
      await prepareAccount(normalizeAccount(result.data.user))
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign in.')
      setMode('auth')
    } finally {
      setBusy(false)
      setPassword('')
      setConfirmPassword('')
    }
  }

  const finishMigration = async (useLocalData: boolean) => {
    if (!migration) return
    setBusy(true)
    setMigrationError('')
    try {
      const finalData = useLocalData
        ? (migration.cloudData ? mergeData(migration.localData, migration.cloudData) : migration.localData)
        : (migration.cloudData || EMPTY_DATA)
      let version = migration.version
      if (useLocalData) {
        const result = await request<{ version: number }>('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-PersonalOS-Request': '1' },
          body: JSON.stringify({ data: finalData, version }),
        })
        version = result.data.version
      }
      localStorage.setItem(accountStorageKey(migration.account.id, 'legacy-reviewed'), '1')
      activateAccount(migration.account, finalData, version)
      setMigration(null)
    } catch (error) {
      setMigrationError(error instanceof Error ? error.message : 'Could not move this device’s data into your account.')
    } finally {
      setBusy(false)
    }
  }

  // Saves the latest data to the cloud. Calls are queued so two saves never run at once.
  const pushToCloud = useCallback(async () => {
    if (syncPausedRef.current) return
    const queuedSync = syncQueueRef.current.catch(() => undefined).then(async () => {
      const data = latestDataRef.current
      if (!data || syncPausedRef.current) return
      setSyncState('syncing')
      setSyncError('')
      syncInFlightRef.current = true
      try {
        const response = await fetch('/api/data', {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'X-PersonalOS-Request': '1' },
          body: JSON.stringify({ data, version: cloudVersionRef.current }),
        })
        if (response.status === 409) {
          let message = 'This account changed on another device. Load the latest cloud version before continuing.'
          try {
            const body: { error?: unknown } = await response.json()
            if (typeof body.error === 'string') message = body.error
          } catch {
            message = 'Could not read the cloud conflict response. Load the latest cloud version before continuing.'
          }
          syncPausedRef.current = true
          setSyncState('conflict')
          setSyncError(message)
          return
        }
        const result = await responseJson<{ version: number }>(response)
        const currentAccount = accountRef.current
        cloudVersionRef.current = result.data.version
        baselineDataRef.current = data
        if (currentAccount) writeAccountData(currentAccount.id, data, result.data.version)
        setSyncState('synced')
      } catch (error) {
        setSyncState('error')
        setSyncError(error instanceof Error ? error.message : 'Could not sync your account data.')
      } finally {
        syncInFlightRef.current = false
      }
    })
    syncQueueRef.current = queuedSync
    await queuedSync
  }, [])

  // Called whenever the workspace data changes. Waits a moment so quick edits (such as dragging
  // a slider) become one save, and skips the save when nothing differs from the cloud copy.
  const syncData = useCallback((data: PersonalOSData) => {
    latestDataRef.current = data
    if (syncPausedRef.current) return
    window.clearTimeout(syncTimerRef.current)
    const baseline = baselineDataRef.current
    if (baseline && serializeData(baseline) === serializeData(data)) {
      if (!syncInFlightRef.current) setSyncState('synced')
      return
    }
    setSyncState('syncing')
    syncTimerRef.current = window.setTimeout(() => { void pushToCloud() }, SYNC_DELAY_MS)
  }, [pushToCloud])

  useEffect(() => () => window.clearTimeout(syncTimerRef.current), [])

  const reloadCloudData = async () => {
    if (!accountRef.current || !window.confirm('Replace this device’s current data with the latest cloud version? Export a backup first if you need to keep unsynced changes.')) return
    setBusy(true)
    try {
      await syncQueueRef.current.catch(() => undefined)
      const cloud = await getCloudData()
      activateAccount(accountRef.current, cloud.data || EMPTY_DATA, cloud.version)
      setMountGeneration(current => current + 1)
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Could not load the latest cloud data.')
    } finally {
      setBusy(false)
    }
  }

  const retrySync = async () => {
    if (syncPausedRef.current) return
    window.clearTimeout(syncTimerRef.current)
    if (latestDataRef.current) await pushToCloud()
  }

  const signOut = async (pushEndpoint?: string) => {
    if (syncState !== 'synced' && !window.confirm('Some changes may not have reached the cloud yet. Sign out anyway? Your local copy will remain on this device.')) return false
    try {
      await request<{ signedOut: boolean }>('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-PersonalOS-Request': '1' },
        body: JSON.stringify({ pushEndpoint }),
      })
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Could not sign out.')
      return false
    }
    accountRef.current = null
    setAccount(null)
    setMode('auth')
    setAuthMode('login')
    setAuthError('')
    return true
  }

  if (mode === 'loading') {
    return <div className="po-auth-screen"><div className="po-auth-card"><div className="po-brand-mark">P</div><h1>Personal OS</h1><p>Connecting to your private workspace…</p></div></div>
  }

  if (mode === 'error') {
    return <div className="po-auth-screen"><div className="po-auth-card"><div className="po-brand-mark">P</div><h1>Personal OS</h1><p className="po-auth-error" role="alert">{appError}</p><button className="po-primary" type="button" onClick={() => window.location.reload()}>Try again</button></div></div>
  }

  if (mode === 'migration' && migration) {
    const hasCloudData = Boolean(migration.cloudData && hasRecords(migration.cloudData))
    return <div className="po-auth-screen"><section className="po-auth-card po-migration-card">
      <div className="po-brand-mark">P</div>
      <h1>Bring your data with you</h1>
      <p>This device has personal data that is not in <strong>{migration.account.email}</strong>’s cloud workspace.</p>
      <p>Merge this device’s records with the cloud account? Items with the same ID use this device’s version. Your original local data remains on this device.</p>
      {migrationError && <p className="po-auth-error" role="alert">{migrationError}</p>}
      <div className="po-auth-actions">
        <button className="po-primary" type="button" disabled={busy} onClick={() => void finishMigration(true)}>{hasCloudData ? 'Merge device data' : 'Import device data'}</button>
        <button className="po-secondary" type="button" disabled={busy} onClick={() => void finishMigration(false)}>Use cloud data</button>
      </div>
    </section></div>
  }

  if (mode === 'ready' && account) {
    return <PersonalOS
      key={`${account.id}:${mountGeneration}`}
      account={account}
      onSignOut={signOut}
      onSyncData={syncData}
      syncState={syncState}
      syncError={syncError}
      onReloadCloudData={reloadCloudData}
      onRetrySync={retrySync}
      googleButtonRef={googleButtonRef}
      googleConfigured={Boolean(googleClientId)}
      googleError={googleLinkError || googleError}
      onSettingsOpen={() => setGoogleRenderRequest(current => current + 1)}
    />
  }

  return <div className="po-auth-screen">
    <section className="po-auth-card">
      <div className="po-brand-mark">P</div>
      <h1>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p>Sign in to keep your personal workspace in sync across devices.</p>
      <form className="po-auth-form" onSubmit={event => { void submitAuth(event) }}>
        <label className="po-field"><span>Email</span><input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label className="po-field"><span>Password</span><input type="password" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} minLength={authMode === 'register' ? 12 : undefined} required value={password} onChange={event => setPassword(event.target.value)} placeholder={authMode === 'register' ? 'At least 12 characters' : 'Your password'} /></label>
        {authMode === 'register' && <label className="po-field"><span>Confirm password</span><input type="password" autoComplete="new-password" required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Enter your password again" /></label>}
        {authError && <p className="po-auth-error" role="alert">{authError}</p>}
        <button className="po-primary" type="submit" disabled={busy}>{authMode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <div className="po-auth-divider"><span>or</span></div>
      {googleClientId
        ? <div className="po-google-button" ref={googleButtonRef} />
        : <p className="po-auth-note">Google sign-in will appear after the server’s Google client ID is configured.</p>}
      {googleError && <p className="po-auth-note" role="status">{googleError}</p>}
      <p className="po-auth-switch">{authMode === 'login' ? 'New to Personal OS?' : 'Already have an account?'} <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }}>{authMode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
    </section>
  </div>
}
