import type { PersonalOSData } from '../types'

const LIST_KEYS = [
  'tasks',
  'projects',
  'goals',
  'habits',
  'health',
  'transactions',
  'learning',
  'notes',
  'calendarEvents',
  'timetable',
] as const

/**
 * Checks a parsed backup file and returns only the parts that are safe to restore.
 * Every record must be an object with a string id: the server rejects anything else,
 * which would otherwise stop syncing for good.
 */
export const parseBackup = (value: unknown): Partial<PersonalOSData> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('This file is not a Personal OS backup.')
  const source = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  let found = false

  for (const key of LIST_KEYS) {
    const list = source[key]
    if (list === undefined) continue
    const valid = Array.isArray(list)
      && list.every(item => item && typeof item === 'object' && !Array.isArray(item) && typeof (item as { id?: unknown }).id === 'string')
    if (!valid) throw new Error(`The "${key}" section of this backup has an unsupported format.`)
    result[key] = list
    found = true
  }
  if (source.theme === 'light' || source.theme === 'dark') result.theme = source.theme
  if (!found) throw new Error('This backup does not contain any Personal OS records.')
  return result as Partial<PersonalOSData>
}
