import type { TimetableBlock, TimetableCategory } from '../types'
import { dateKey, toMinutes } from './date'

/** Weekday order shown in the timetable (Monday first). Values are JavaScript weekday numbers. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Soft colours that suit both themes. The first one is the default. */
export const BLOCK_COLORS = ['#5f9e7a', '#6b8fd6', '#c08a4f', '#b9708f', '#8b78c9', '#5aa5a8'] as const

export const CATEGORY_COLORS: Record<TimetableCategory, string> = {
  Routine: '#5f9e7a',
  Study: '#6b8fd6',
  Work: '#c08a4f',
  Health: '#b9708f',
  Personal: '#8b78c9',
  Break: '#5aa5a8',
}

/** True when two blocks share at least one weekday and their time ranges overlap. */
export const blocksOverlap = (first: Pick<TimetableBlock, 'days' | 'start' | 'end'>, second: Pick<TimetableBlock, 'days' | 'start' | 'end'>) => {
  const shareDay = first.days.some(day => second.days.includes(day))
  if (!shareDay) return false
  return toMinutes(first.start) < toMinutes(second.end) && toMinutes(second.start) < toMinutes(first.end)
}

/** Blocks that run on the given weekday, ordered by start time. */
export const blocksForDay = (blocks: TimetableBlock[], weekday: number) =>
  blocks.filter(block => block.days.includes(weekday)).sort((a, b) => toMinutes(a.start) - toMinutes(b.start))

export type PositionedBlock = { block: TimetableBlock; lane: number; lanes: number }

/**
 * Places blocks side by side when they overlap, so none are hidden in the week grid.
 * Blocks are grouped into clusters of overlapping blocks; each cluster shares its lane count.
 */
export const layoutDay = (blocks: TimetableBlock[]): PositionedBlock[] => {
  const sorted = [...blocks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start) || toMinutes(a.end) - toMinutes(b.end))
  const placed: PositionedBlock[] = []
  let cluster: PositionedBlock[] = []
  let clusterEnd = -1

  const closeCluster = () => {
    const lanes = Math.max(1, ...cluster.map(item => item.lane + 1))
    for (const item of cluster) item.lanes = lanes
    placed.push(...cluster)
    cluster = []
  }

  for (const block of sorted) {
    const start = toMinutes(block.start)
    if (cluster.length && start >= clusterEnd) {
      closeCluster()
      clusterEnd = -1
    }
    const takenLanes = new Set(cluster.filter(item => toMinutes(item.block.end) > start).map(item => item.lane))
    let lane = 0
    while (takenLanes.has(lane)) lane += 1
    cluster.push({ block, lane, lanes: 1 })
    clusterEnd = Math.max(clusterEnd, toMinutes(block.end))
  }
  if (cluster.length) closeCluster()
  return placed
}

/**
 * Maps each weekday number (0 = Sunday ... 6 = Saturday) to its date in the current
 * Monday-to-Sunday week. Completion is stored per date, so this tells us which date
 * "Wednesday" means right now.
 */
export const currentWeekDates = (now: Date): Record<number, string> => {
  const daysSinceMonday = (now.getDay() + 6) % 7
  const dates: Record<number, string> = {}
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday + offset)
    dates[date.getDay()] = dateKey(date)
  }
  return dates
}

/** The block that is running at the given minute of the day, if any. */
export const blockInProgress = (dayBlocks: TimetableBlock[], minute: number) =>
  dayBlocks.find(block => toMinutes(block.start) <= minute && minute < toMinutes(block.end))

/** The next block that starts after the given minute of the day, if any. */
export const blockUpNext = (dayBlocks: TimetableBlock[], minute: number) =>
  dayBlocks.find(block => toMinutes(block.start) > minute)

/** Adds or removes a date from a block's completion list. */
export const toggleDone = (block: TimetableBlock, date: string): TimetableBlock => ({
  ...block,
  doneDates: block.doneDates.includes(date) ? block.doneDates.filter(item => item !== date) : [...block.doneDates, date],
})
