import { Check } from 'lucide-react'
import { useMemo } from 'react'
import { formatTime, toMinutes } from '../../lib/date'
import { WEEKDAY_SHORT, WEEK_ORDER, blocksForDay, layoutDay } from '../../lib/timetable'
import type { TimetableBlock } from '../../types'

const HOUR_HEIGHT = 56 // pixels per hour in the grid
const MIN_BLOCK_HEIGHT = 24

/**
 * The weekly timetable: seven day columns on a shared hour axis.
 * The visible hours stretch to fit your earliest and latest block.
 */
export function WeekGrid({ blocks, weekDates, todayKey, nowMinute, selectedId, onSelect }: {
  blocks: TimetableBlock[]
  weekDates: Record<number, string>
  todayKey: string
  nowMinute: number
  selectedId: string | null
  onSelect: (block: TimetableBlock) => void
}) {
  const { firstHour, lastHour } = useMemo(() => {
    let first = 6
    let last = 22
    for (const block of blocks) {
      first = Math.min(first, Math.floor(toMinutes(block.start) / 60))
      last = Math.max(last, Math.ceil(toMinutes(block.end) / 60))
    }
    return { firstHour: Math.max(0, first), lastHour: Math.min(24, last) }
  }, [blocks])

  const hours = Array.from({ length: lastHour - firstHour }, (_, index) => firstHour + index)
  const gridHeight = (lastHour - firstHour) * HOUR_HEIGHT
  const offsetOf = (minute: number) => ((minute - firstHour * 60) / 60) * HOUR_HEIGHT

  return (
    <div className="po-week" role="group" aria-label="Weekly timetable">
      <div className="po-week-head">
        <span />
        {WEEK_ORDER.map(day => {
          const isToday = weekDates[day] === todayKey
          return (
            <div key={day} className={`po-week-day-label${isToday ? ' today' : ''}`}>
              <small>{WEEKDAY_SHORT[day]}</small>
              <strong>{Number(weekDates[day]?.slice(8))}</strong>
            </div>
          )
        })}
      </div>

      <div className="po-week-body" style={{ height: gridHeight }}>
        <div className="po-week-hours" aria-hidden="true">
          {hours.map(hour => (
            <span key={hour} style={{ top: (hour - firstHour) * HOUR_HEIGHT }}>{formatTime(`${hour}:00`).replace(':00', '')}</span>
          ))}
        </div>

        {WEEK_ORDER.map(day => {
          const date = weekDates[day]
          const isToday = date === todayKey
          const positioned = layoutDay(blocksForDay(blocks, day))
          return (
            <div key={day} className={`po-week-col${isToday ? ' today' : ''}`} style={{ backgroundSize: `100% ${HOUR_HEIGHT}px` }}>
              {positioned.map(({ block, lane, lanes }) => {
                const startMinute = toMinutes(block.start)
                const endMinute = toMinutes(block.end)
                const height = Math.max(MIN_BLOCK_HEIGHT, ((endMinute - startMinute) / 60) * HOUR_HEIGHT - 2)
                const done = block.doneDates.includes(date)
                return (
                  <button
                    key={block.id}
                    type="button"
                    className={`po-tt-block${height < 44 ? ' compact' : ''}${done ? ' done' : ''}${selectedId === block.id ? ' selected' : ''}`}
                    style={{
                      top: offsetOf(startMinute),
                      height,
                      left: `calc(${(lane / lanes) * 100}% + 2px)`,
                      width: `calc(${100 / lanes}% - 4px)`,
                      ['--block-color' as string]: block.color,
                    }}
                    aria-label={`${block.title}, ${WEEKDAY_SHORT[day]} ${formatTime(block.start)} to ${formatTime(block.end)}${done ? ', done' : ''}. Edit`}
                    onClick={() => onSelect(block)}
                  >
                    <span className="po-tt-block-title">{done && <Check size={12} strokeWidth={3} aria-hidden="true" />} {block.title}</span>
                    <span className="po-tt-block-time">{formatTime(block.start)} – {formatTime(block.end)}</span>
                  </button>
                )
              })}
              {isToday && nowMinute >= firstHour * 60 && nowMinute <= lastHour * 60 && (
                <span className="po-now-line" style={{ top: offsetOf(nowMinute) }} aria-hidden="true" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
