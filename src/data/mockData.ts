import type {
  ClarityItem,
  Goal,
  Habit,
  InsightBar,
  NavSection,
  Note,
  Project,
  Task,
} from '../types'

export const navSections: NavSection[] = [
  { id: 'Dashboard', icon: '◌', description: 'Overview' },
  { id: 'My Day', icon: '◎', description: 'Daily flow' },
  { id: 'Tasks', icon: '▣', description: 'Priority list' },
  { id: 'Projects', icon: '◫', description: 'Workstreams' },
  { id: 'Goals & Growth', icon: '△', description: 'Long-term' },
  { id: 'Habits & Routines', icon: '◈', description: 'Consistency' },
  { id: 'Journal & Notes', icon: '✎', description: 'Reflection' },
  { id: 'Clarity Center', icon: '◍', description: 'Focus' },
  { id: 'Calendar', icon: '◩', description: 'Schedule' },
  { id: 'Life Overview', icon: '◬', description: 'Balance' },
  { id: 'Insights & Reviews', icon: '◔', description: 'Reports' },
  { id: 'Settings', icon: '⚙', description: 'Preferences' },
]

export const taskSeed: Task[] = [
  {
    id: 1,
    title: 'Finalize life operating system roadmap',
    category: 'Strategy',
    priority: 'High',
    status: 'In progress',
    due: 'Today',
    tags: ['focus', 'planning'],
    time: '09:00',
    project: 'MyPlanner',
  },
  {
    id: 2,
    title: 'Review and refine weekly goals',
    category: 'Personal',
    priority: 'High',
    status: 'Waiting',
    due: 'Tomorrow',
    tags: ['growth'],
    time: '10:30',
    project: 'Goals',
  },
  {
    id: 3,
    title: 'Draft launch notes for portfolio update',
    category: 'Work',
    priority: 'Medium',
    status: 'Not started',
    due: 'Thu',
    tags: ['creative'],
    time: '14:00',
    project: 'Portfolio',
  },
  {
    id: 4,
    title: 'Book health checkup and schedule gym blocks',
    category: 'Health',
    priority: 'Medium',
    status: 'Completed',
    due: 'Today',
    tags: ['wellbeing'],
    time: '18:00',
    project: 'Wellness',
  },
  {
    id: 5,
    title: 'Plan next milestone for product launch',
    category: 'Projects',
    priority: 'Low',
    status: 'Not started',
    due: 'Mon',
    tags: ['milestone'],
    time: '08:15',
    project: 'Launch',
  },
]

export const projectSeed: Project[] = [
  {
    id: 1,
    title: 'MyPlanner',
    category: 'Life OS',
    status: 'Active',
    progress: 72,
    target: 'Dec 15',
    highlight: 'Unified dashboard, clarity workflows, and planning rituals',
  },
  {
    id: 2,
    title: 'Career Reset',
    category: 'Growth',
    status: 'Planning',
    progress: 38,
    target: 'Jan 20',
    highlight: 'Skills map, networking plan, and portfolio roadmap',
  },
  {
    id: 3,
    title: 'Home Optimization',
    category: 'Lifestyle',
    status: 'On hold',
    progress: 54,
    target: 'Mar 02',
    highlight: 'Declutter, storage system, and weekly reset checklist',
  },
]

export const goalSeed: Goal[] = [
  { id: 1, title: 'Deep work rhythm', category: 'Focus', progress: 82, due: 'Dec 30', related: 'MyPlanner' },
  { id: 2, title: 'Fitness consistency', category: 'Health', progress: 68, due: 'Jan 15', related: 'Wellness' },
  { id: 3, title: 'Financial clarity', category: 'Budget', progress: 44, due: 'Mar 01', related: 'Life Overview' },
]

export const habitSeed = [
  { id: 1, title: 'Morning planning', schedule: 'Daily', streak: 21, completion: 86 },
  { id: 2, title: 'Workout block', schedule: 'Mon / Wed / Fri', streak: 14, completion: 71 },
  { id: 3, title: 'Reading session', schedule: 'Daily', streak: 30, completion: 90 },
] satisfies Habit[]

export const noteSeed: Note[] = [
  { id: 1, title: 'Brain dump', category: 'Ideas', excerpt: 'Launch a personal dashboard for weekly review and reduce decision fatigue.', updated: '2h ago' },
  { id: 2, title: 'Team retrospective', category: 'Reflection', excerpt: 'The biggest blocker is context switching between projects and commitments.', updated: 'Yesterday' },
  { id: 3, title: 'Travel prep', category: 'Planning', excerpt: 'Pack light, define top three priorities, and leave space for recovery time.', updated: '3 days ago' },
]

export const claritySeed: ClarityItem[] = [
  { id: 1, label: 'Brain dump', description: 'Capture everything before it gets lost.', count: 18 },
  { id: 2, label: 'Priority clarity', description: 'Decide what deserves time today.', count: 5 },
  { id: 3, label: 'Decision journal', description: 'Keep trade-offs visible and reviewable.', count: 7 },
  { id: 4, label: 'Weekly reflection', description: 'Close the loop on momentum and friction.', count: 1 },
]

export const overviewStats = [
  { label: 'Daily completion', value: '82%', detail: '12/15 tasks closed' },
  { label: 'Weekly productivity', value: '6.4h', detail: 'Deep work blocks' },
  { label: 'Goal progress', value: '71%', detail: 'Across 3 active goals' },
  { label: 'Habit consistency', value: '88%', detail: 'Up 9% from last week' },
]

export const insightsBars: InsightBar[] = [
  { label: 'Mon', value: 58 },
  { label: 'Tue', value: 72 },
  { label: 'Wed', value: 66 },
  { label: 'Thu', value: 81 },
  { label: 'Fri', value: 90 },
  { label: 'Sat', value: 63 },
  { label: 'Sun', value: 70 },
]

export const calendarDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
