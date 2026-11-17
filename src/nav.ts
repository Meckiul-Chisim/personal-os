import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  Flame,
  FolderKanban,
  HeartPulse,
  IndianRupee,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  NotebookPen,
  Settings,
  Sun,
  Target,
  type LucideIcon,
} from 'lucide-react'
import type { Section } from './types'

export type NavGroup = 'Workspace' | 'Personal' | 'System'

export type NavItem = {
  id: Section
  label: string
  icon: LucideIcon
  group: NavGroup
}

export const NAV_GROUPS: NavGroup[] = ['Workspace', 'Personal', 'System']

export const NAV_ITEMS: NavItem[] = [
  { id: 'Overview', label: 'Overview', icon: LayoutDashboard, group: 'Workspace' },
  { id: 'Today', label: 'My day', icon: Sun, group: 'Workspace' },
  { id: 'Timetable', label: 'Timetable', icon: CalendarClock, group: 'Workspace' },
  { id: 'Calendar', label: 'Calendar', icon: CalendarDays, group: 'Workspace' },
  { id: 'Tasks', label: 'Tasks', icon: ListChecks, group: 'Workspace' },
  { id: 'Projects', label: 'Projects', icon: FolderKanban, group: 'Workspace' },
  { id: 'Goals', label: 'Goals & growth', icon: Target, group: 'Personal' },
  { id: 'Habits', label: 'Habits', icon: Flame, group: 'Personal' },
  { id: 'Health', label: 'Health & fitness', icon: HeartPulse, group: 'Personal' },
  { id: 'Learning', label: 'Learning', icon: BookOpen, group: 'Personal' },
  { id: 'Finances', label: 'Finances', icon: IndianRupee, group: 'Personal' },
  { id: 'Journal', label: 'Journal', icon: NotebookPen, group: 'Personal' },
  { id: 'Clarity', label: 'Clarity', icon: Lightbulb, group: 'Personal' },
  { id: 'Settings', label: 'Settings', icon: Settings, group: 'System' },
]

/** Sections pinned to the mobile bottom bar. Everything else opens from "More". */
export const MOBILE_PRIMARY: Section[] = ['Overview', 'Today', 'Timetable', 'Tasks']
