import type { CalendarEvent } from '../types'

/** Turns a failed push-service response into a readable Error. */
export const apiError = async (response: Response) => {
  let message = `Push service request failed (${response.status}).`
  try {
    const body: { error?: unknown } = await response.json()
    if (typeof body.error === 'string') message = body.error
  } catch {
    message = `Could not read the push service response (${response.status}).`
  }
  return new Error(message)
}

/** Converts the server's base64url VAPID public key into the bytes the browser expects. */
export const decodeApplicationServerKey = (key: string) => {
  const padding = '='.repeat((4 - key.length % 4) % 4)
  const base64 = (key + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(window.atob(base64), character => character.charCodeAt(0))
}

/** Sends the upcoming calendar events to the server so it can schedule reminders. */
export const syncPushCalendarEvents = async (events: CalendarEvent[]) => {
  const response = await fetch('/api/calendar-events', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-PersonalOS-Request': '1',
    },
    body: JSON.stringify({
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        note: event.note,
        eventAt: new Date(`${event.date}T${event.time}`).getTime(),
      })),
    }),
  })
  if (!response.ok) throw await apiError(response)
}

/** The push subscription of this browser, if one exists. */
export const getCurrentPushSubscription = async () => {
  if (!('serviceWorker' in navigator)) return undefined
  const registration = await navigator.serviceWorker.getRegistration('/')
  return (await registration?.pushManager.getSubscription()) ?? undefined
}
