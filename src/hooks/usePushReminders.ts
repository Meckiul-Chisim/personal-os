import { useCallback, useEffect, useRef, useState } from 'react'
import type { CalendarEvent } from '../types'
import { apiError, decodeApplicationServerKey, syncPushCalendarEvents } from '../lib/push'

export type PushStatus = 'off' | 'checking' | 'on' | 'error'

/**
 * Manages browser push reminders for calendar events:
 * checks whether this device is subscribed, subscribes/unsubscribes, and keeps the
 * server's copy of upcoming events up to date while reminders are on.
 */
export function usePushReminders(accountId: string, calendarEvents: CalendarEvent[]) {
  const [status, setStatus] = useState<PushStatus>('checking')
  const [error, setError] = useState('')
  const queueRef = useRef<Promise<void>>(Promise.resolve())

  // Calls are queued so two syncs never run at the same time.
  const queueSync = useCallback((events: CalendarEvent[]) => {
    const queued = queueRef.current.catch(() => undefined).then(() => syncPushCalendarEvents(events))
    queueRef.current = queued
    return queued
  }, [])

  // On load (and when the account changes), find out if this device is already subscribed.
  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration('/') : undefined
      const subscription = await registration?.pushManager.getSubscription()
      const endpoint = subscription ? `?endpoint=${encodeURIComponent(subscription.endpoint)}` : ''
      const response = await fetch(`/api/push/status${endpoint}`, { credentials: 'same-origin' })
      if (!response.ok) throw await apiError(response)
      const result: { subscriptionCount: number; currentDeviceSubscribed: boolean } = await response.json()
      if (!cancelled) setStatus(result.currentDeviceSubscribed ? 'on' : 'off')
    }
    check().catch(caught => {
      if (cancelled) return
      setStatus('error')
      setError(caught instanceof Error ? caught.message : 'Could not check calendar reminders.')
    })
    return () => { cancelled = true }
  }, [accountId])

  // While reminders are on, keep the server's event list in step with the calendar.
  useEffect(() => {
    if (status !== 'on') return
    let cancelled = false
    queueSync(calendarEvents)
      .then(() => { if (!cancelled) setError('') })
      .catch(caught => {
        if (cancelled) return
        setStatus('error')
        setError(caught instanceof Error ? caught.message : 'Could not sync calendar reminders.')
      })
    return () => { cancelled = true }
  }, [calendarEvents, queueSync, status])

  const enable = async () => {
    setError('')
    setStatus('checking')
    try {
      if (!window.isSecureContext) throw new Error('Push notifications require HTTPS, or localhost for local development.')
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        throw new Error('This browser does not support web push notifications.')
      }
      let permission = Notification.permission
      if (permission === 'default') permission = await Notification.requestPermission()
      if (permission !== 'granted') throw new Error('Allow notifications in your browser settings to receive event reminders.')

      const configResponse = await fetch('/api/push/config')
      if (!configResponse.ok) throw await apiError(configResponse)
      const config: { configured: boolean; missing: string[]; publicKey: string | null } = await configResponse.json()
      if (!config.configured || !config.publicKey) {
        throw new Error(`The push server is not configured. Missing: ${config.missing.join(', ') || 'VAPID keys'}.`)
      }

      await navigator.serviceWorker.register('/sw.js')
      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeApplicationServerKey(config.publicKey),
        })
      }

      const response = await fetch('/api/push/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-PersonalOS-Request': '1' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })
      if (!response.ok) throw await apiError(response)

      await queueSync(calendarEvents)
      setStatus('on')
    } catch (caught) {
      setStatus('error')
      setError(caught instanceof Error ? caught.message : 'Could not enable push notifications.')
    }
  }

  const disable = async () => {
    setError('')
    setStatus('checking')
    try {
      const registration = await navigator.serviceWorker.getRegistration('/')
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        const response = await fetch('/api/push/subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'X-PersonalOS-Request': '1' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        if (!response.ok) throw await apiError(response)
        await subscription.unsubscribe()
      }
      setStatus('off')
    } catch (caught) {
      setStatus('error')
      setError(caught instanceof Error ? caught.message : 'Could not turn off push notifications.')
    }
  }

  const retry = async () => {
    setError('')
    setStatus('checking')
    try {
      await queueSync(calendarEvents)
      setStatus('on')
    } catch (caught) {
      setStatus('error')
      setError(caught instanceof Error ? caught.message : 'Could not sync calendar reminders.')
    }
  }

  return { status, error, setError, enable, disable, retry }
}
