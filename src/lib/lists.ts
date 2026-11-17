import type { Dispatch, SetStateAction } from 'react'

/** The setter React gives you for a list of records. */
export type ListSetter<T> = Dispatch<SetStateAction<T[]>>

/** Removes the record with the given id from a list. */
export const removeById = <T extends { id: string }>(setter: ListSetter<T>, id: string) =>
  setter(items => items.filter(item => item.id !== id))

/** Replaces one record in a list with an updated copy. */
export const updateById = <T extends { id: string }>(setter: ListSetter<T>, id: string, changes: Partial<T>) =>
  setter(items => items.map(item => (item.id === id ? { ...item, ...changes } : item)))
