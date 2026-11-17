// Small date and time helpers. All dates are local-time "YYYY-MM-DD" strings.

const pad = (value: number) => String(value).padStart(2, '0')

/** Formats a Date as a local "YYYY-MM-DD" key. */
export const dateKey = (date: Date) => [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-')

/** Today's date key in the user's local time zone. */
export const today = () => dateKey(new Date())

/** Converts "HH:MM" to minutes since midnight. Invalid values become 0. */
export const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

/** Converts minutes since midnight to "HH:MM". */
export const fromMinutes = (total: number) => `${pad(Math.floor(total / 60))}:${pad(total % 60)}`

/** Displays "HH:MM" as a friendly 12-hour time, for example "9:30 AM". */
export const formatTime = (time: string) => {
  const minutes = toMinutes(time)
  const hours24 = Math.floor(minutes / 60)
  const suffix = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${hours12}:${pad(minutes % 60)} ${suffix}`
}

/** Minutes since midnight for the given Date. */
export const nowMinutesOf = (date: Date) => date.getHours() * 60 + date.getMinutes()
