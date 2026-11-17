import { useEffect, useState } from 'react'

/**
 * Returns the current time and refreshes it every minute (or at the given interval).
 * Using this instead of calling `new Date()` while rendering keeps components predictable
 * and lets "today" and the timetable's "now" line stay correct if the tab stays open.
 */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])

  return now
}
