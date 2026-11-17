// Shared types for Personal OS. Every record that syncs to the server lives here.

export type Section =
  | 'Overview'
  | 'Today'
  | 'Calendar'
  | 'Timetable'
  | 'Tasks'
  | 'Projects'
  | 'Goals'
  | 'Habits'
  | 'Health'
  | 'Learning'
  | 'Finances'
  | 'Journal'
  | 'Clarity'
  | 'Settings'

export type Theme = 'light' | 'dark'

export type Task = {
  id: string
  title: string
  area: string
  due: string
  priority: 'Low' | 'Medium' | 'High'
  done: boolean
  createdAt: string
}

export type Project = {
  id: string
  name: string
  area: string
  status: 'Active' | 'On hold' | 'Completed'
  progress: number
  next: string
}

export type Goal = {
  id: string
  title: string
  area: string
  target: string
  progress: number
}

export type Habit = {
  id: string
  name: string
  frequency: string
  doneDates: string[]
}

export type HealthLog = {
  id: string
  date: string
  sleep: number
  water: number
  movement: number
  mood: string
  note: string
}

export type Transaction = {
  id: string
  title: string
  amount: number
  type: 'Income' | 'Expense'
  category: string
  date: string
}

export type LearningItem = {
  id: string
  title: string
  topic: string
  status: 'To learn' | 'Learning' | 'Completed'
  minutes: number
}

export type Note = {
  id: string
  title: string
  body: string
  kind: 'Journal' | 'Clarity'
  date: string
}

export type CalendarEvent = {
  id: string
  title: string
  date: string
  time: string
  note: string
  color?: string
}

export type CalendarHoliday = {
  id: string
  title: string
  date: string
  color: string
  kind: 'holiday'
}

export type CalendarEntry = (CalendarEvent & { kind: 'event' }) | CalendarHoliday

export const TIMETABLE_CATEGORIES = ['Routine', 'Study', 'Work', 'Health', 'Personal', 'Break'] as const
export type TimetableCategory = (typeof TIMETABLE_CATEGORIES)[number]

/**
 * One recurring block in the weekly timetable.
 * `days` uses JavaScript weekday numbers (0 = Sunday ... 6 = Saturday).
 * `start` and `end` are 24-hour "HH:MM" strings on the same day.
 * `doneDates` records the dates (YYYY-MM-DD) on which the block was completed.
 */
export type TimetableBlock = {
  id: string
  title: string
  days: number[]
  start: string
  end: string
  category: TimetableCategory
  color: string
  note: string
  doneDates: string[]
}

/** Everything that is saved to the account and synced across devices. */
export type PersonalOSData = {
  theme: Theme
  tasks: Task[]
  projects: Project[]
  goals: Goal[]
  habits: Habit[]
  health: HealthLog[]
  transactions: Transaction[]
  learning: LearningItem[]
  notes: Note[]
  calendarEvents: CalendarEvent[]
  timetable: TimetableBlock[]
}

export type Account = {
  id: string
  email: string
  googleLinked: boolean
  passwordLoginEnabled: boolean
}

export type SyncState = 'syncing' | 'synced' | 'error' | 'conflict'
