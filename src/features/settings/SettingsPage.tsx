import { Download, Upload } from 'lucide-react'
import type { RefObject } from 'react'
import { Panel } from '../../components/ui/Panel'
import { promptInstall, usePwa } from '../../lib/pwa'
import type { PushStatus } from '../../hooks/usePushReminders'
import type { Account, SyncState, Theme } from '../../types'

type Props = {
  account: Account
  theme: Theme
  onThemeChange: (theme: Theme) => void
  onSignOut: () => void
  syncState: SyncState
  syncError: string
  onReloadCloudData: () => Promise<void>
  onRetrySync: () => Promise<void>
  googleButtonRef: RefObject<HTMLDivElement | null>
  googleConfigured: boolean
  googleError: string
  push: {
    status: PushStatus
    error: string
    enable: () => Promise<void>
    disable: () => Promise<void>
    retry: () => Promise<void>
  }
  onExport: () => void
  onImport: (file?: File) => void
}

const SYNC_LABEL: Record<SyncState, string> = {
  synced: 'Up to date',
  syncing: 'Syncing…',
  conflict: 'Updated on another device',
  error: 'Sync needs attention',
}

export function SettingsPage({ account, theme, onThemeChange, onSignOut, syncState, syncError, onReloadCloudData, onRetrySync, googleButtonRef, googleConfigured, googleError, push, onExport, onImport }: Props) {
  const pwa = usePwa()
  const signInMethods = [account.passwordLoginEnabled ? 'Email and password' : '', account.googleLinked ? 'Google' : ''].filter(Boolean).join(' · ')
  const pushLabel = push.status === 'checking'
    ? 'Connecting and syncing reminders…'
    : push.status === 'on'
      ? 'Push reminders are enabled'
      : push.status === 'error'
        ? 'Push reminders need attention'
        : 'Push reminders are off'

  return (
    <div className="po-settings">
      <Panel title="Account details">
        <div className="po-account-details">
          <div><span>Email address</span><strong>{account.email}</strong></div>
          <div><span>Sign-in methods</span><strong>{signInMethods}</strong></div>
        </div>
        <p className="po-settings-copy">{account.googleLinked ? 'Google sign-in is linked to this account.' : 'Link Google after signing in if you want to use both sign-in methods.'}</p>
        {googleConfigured && !account.googleLinked && <div className="po-google-button" ref={googleButtonRef} />}
        {!googleConfigured && !account.googleLinked && <p className="po-auth-note">Google linking becomes available after the server’s Google client ID is configured.</p>}
        {googleError && <p className="po-push-error" role="alert">{googleError}</p>}
        {!account.googleLinked && <p className="po-auth-note">Email verification and password recovery are not available yet. Keep a backup of your data.</p>}
        <div className="po-settings-actions"><button type="button" className="po-secondary" onClick={onSignOut}>Sign out</button></div>
      </Panel>

      <Panel title="Install the app">
        <p className="po-settings-copy">
          {pwa.installed
            ? 'Personal OS is installed on this device. New versions load automatically; you will be asked to reload when one is ready.'
            : 'Install Personal OS to open it in its own window or from your home screen. Updates arrive automatically.'}
        </p>
        {pwa.canInstall && <div className="po-settings-actions"><button type="button" className="po-primary" onClick={() => void promptInstall()}><Download size={16} aria-hidden="true" /> Install Personal OS</button></div>}
        {!pwa.installed && !pwa.canInstall && <p className="po-auth-note">If there is no install button, use your browser’s menu: “Install app” or “Add to Home Screen”.</p>}
      </Panel>

      <Panel title="Cloud sync">
        <p className="po-settings-copy">Your workspace is available on desktop and mobile when you sign in with this account. Changes are checked across devices automatically.</p>
        <div className={`po-status${syncState === 'error' || syncState === 'conflict' ? ' has-error' : ''}`} role="status" aria-live="polite">
          <span className="po-status-dot" />
          <strong>{SYNC_LABEL[syncState]}</strong>
        </div>
        {syncError && <p className="po-push-error" role="alert">{syncError}</p>}
        {syncState === 'conflict' && <div className="po-settings-actions"><button type="button" className="po-secondary" onClick={() => void onReloadCloudData()}>Load latest cloud data</button></div>}
        {syncState === 'error' && <div className="po-settings-actions"><button type="button" className="po-secondary" onClick={() => void onRetrySync()}>Retry sync</button></div>}
      </Panel>

      <Panel title="Your data stays yours">
        <p className="po-settings-copy">Your records sync to your account so they are available on desktop and mobile, and a local copy is kept in this browser. Export a JSON backup regularly.</p>
        <div className="po-settings-actions">
          <button type="button" className="po-primary" onClick={onExport}><Download size={16} aria-hidden="true" /> Export full backup</button>
          <label className="po-secondary">
            <Upload size={16} aria-hidden="true" /> Import backup
            <input
              type="file"
              accept="application/json,.json"
              onChange={event => {
                onImport(event.target.files?.[0])
                event.target.value = '' // lets you pick the same file twice
              }}
            />
          </label>
        </div>
      </Panel>

      <Panel title="Calendar push reminders">
        <div className={`po-status${push.status === 'error' ? ' has-error' : ''}`} role="status" aria-live="polite">
          <span className="po-status-dot" />
          <strong>{pushLabel}</strong>
        </div>
        <p className="po-settings-copy">Receive a browser notification 5 minutes before each upcoming calendar event. This sends event titles, times and notes to your configured push server. Notifications require browser permission, HTTPS, and an always-on server.</p>
        {push.status === 'on' ? (
          <div className="po-settings-actions">
            <button type="button" className="po-secondary" onClick={() => void push.retry()}>Sync reminders</button>
            <button type="button" className="po-secondary" onClick={() => void push.disable()}>Turn off on this device</button>
          </div>
        ) : (
          <button type="button" className="po-primary" onClick={() => void push.enable()} disabled={push.status === 'checking'}>Enable push reminders</button>
        )}
        {push.error && <p className="po-push-error" role="alert">{push.error}</p>}
      </Panel>

      <Panel title="Appearance">
        <div className="po-setting-row">
          <div><strong>Theme</strong><small>Light is calm and minimal. Dark is a quiet night sky.</small></div>
          <div className="po-segment" role="group" aria-label="Theme">
            <button type="button" className={theme === 'light' ? 'active' : ''} aria-pressed={theme === 'light'} onClick={() => onThemeChange('light')}>Light</button>
            <button type="button" className={theme === 'dark' ? 'active' : ''} aria-pressed={theme === 'dark'} onClick={() => onThemeChange('dark')}>Dark</button>
          </div>
        </div>
      </Panel>

      <Panel title="About this build">
        <p className="po-settings-copy">Your tasks, projects, goals, habits, health check-ins, learning records, transactions, calendar events, timetable, notes and appearance sync with your account. Push reminders use the optional private server configured for this app.</p>
      </Panel>
    </div>
  )
}
