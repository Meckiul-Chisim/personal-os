export type SectionName =
  | 'Dashboard'
  | 'My Day'
  | 'Tasks'
  | 'Projects'
  | 'Goals & Growth'
  | 'Habits & Routines'
  | 'Journal & Notes'
  | 'Clarity Center'
  | 'Calendar'
  | 'Life Overview'
  | 'Insights & Reviews'

export type TaskStatus = 'Not started' | 'In progress' | 'Waiting' | 'Completed'
export type Priority = 'High' | 'Medium' | 'Low'

export type Task = {
  id: number
  title: string
  category: string
  priority: Priority
  status: TaskStatus
  due: string
  scheduledDate?: string
  tags: string[]
  time: string
  project: string
}

export type Project = {
  id: number
  title: string
  category: string
  status: 'Planning' | 'Active' | 'On hold' | 'Completed' | 'Archived'
  progress: number
  target: string
  highlight: string
}

export type Goal = {
  id: number
  title: string
  category: string
  progress: number
  due: string
  related: string
}

export type Habit = {
  id: number
  title: string
  schedule: string
  streak: number
  completion: number
}

export type Note = {
  id: number
  title: string
  category: string
  excerpt: string
  updated: string
}

export type ClarityItem = {
  id: number
  label: string
  description: string
  count: number
}

export type OverviewStat = {
  label: string
  value: string
  detail: string
}

export type InsightBar = {
  label: string
  value: number
}

export type NavSection = {
  id: SectionName
  icon: string
  description: string
}
