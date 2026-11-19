// Install prompt and "new version available" detection.
//
// This is a small module-level store (instead of React state) because the browser fires
// `beforeinstallprompt` once, early, before any page that wants it has mounted.
import { useSyncExternalStore } from 'react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type PwaState = {
  canInstall: boolean
  installed: boolean
  updateReady: boolean
}

const VERSION_CHECK_MS = 30 * 60 * 1000

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

let installEvent: InstallPromptEvent | null = null
let state: PwaState = { canInstall: false, installed: false, updateReady: false }
const listeners = new Set<() => void>()

const update = (patch: Partial<PwaState>) => {
  state = { ...state, ...patch }
  listeners.forEach(listener => listener())
}

const checkForNewVersion = async () => {
  try {
    const response = await fetch('/version.json', { cache: 'no-store' })
    if (!response.ok) return
    const { id } = await response.json() as { id?: string }
    if (id && id !== __BUILD_ID__) update({ updateReady: true })
  } catch {
    // Offline or no version file: try again next time.
  }
}

export const startPwa = () => {
  update({ installed: isStandalone() })

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    installEvent = event as InstallPromptEvent
    update({ canInstall: true })
  })
  window.addEventListener('appinstalled', () => {
    installEvent = null
    update({ canInstall: false, installed: true })
  })

  // Everything below needs a production build: the service worker and version.json do not exist in dev.
  if (!import.meta.env.PROD) return
  if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js').catch(() => undefined)

  void checkForNewVersion()
  window.setInterval(() => void checkForNewVersion(), VERSION_CHECK_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkForNewVersion()
  })
}

export const promptInstall = async () => {
  if (!installEvent) return
  await installEvent.prompt()
  await installEvent.userChoice
  installEvent = null
  update({ canInstall: false })
}

export const reloadForUpdate = () => window.location.reload()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const usePwa = () => useSyncExternalStore(subscribe, () => state)
