import { useEffect, useState } from 'react'

/**
 * Like useState, but the value is also saved in this browser's localStorage under a key
 * scoped to the signed-in account. The account data is synced to the server separately.
 */
export function useStored<T>(key: string, initial: T, accountId: string) {
  const storageKey = `personal-os:${accountId}:${key}`
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? (JSON.parse(saved) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // Storage can be full or blocked. The cloud copy still keeps the data.
    }
  }, [storageKey, value])

  return [value, setValue] as const
}
