import { Check, Pencil } from 'lucide-react'
import { Fragment } from 'react'
import { Empty } from '../../components/ui/Empty'
import { IconButton } from '../../components/ui/IconButton'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { formatTime, fromMinutes, toMinutes } from '../../lib/date'
import { WEEKDAY_LONG, WEEKDAY_SHORT, WEEK_ORDER, blockInProgress, blockUpNext, blocksForDay } from '../../lib/timetable'
import type { TimetableBlock } from '../../types'

/** One day as a vertical list, with a day picker, progress and (for today) a "now" marker. */
export function DayView({ blocks, weekday, weekDates, todayKey, nowMinute, onSelectDay, onToggleDone, onEdit }: {
  blocks: TimetableBlock[]
  weekday: number
  weekDates: Record<number, string>
  todayKey: string
  nowMinute: number
  onSelectDay: (weekday: number) => void
  onToggleDone: (block: TimetableBlock, date: string) => void
  onEdit: (block: TimetableBlock) => void
}) {
  const date = weekDates[weekday]
  const isToday = date === todayKey
  const dayBlocks = blocksForDay(blocks, weekday)
  const doneCount = dayBlocks.filter(block => block.doneDates.includes(date)).length
  const current = isToday ? blockInProgress(dayBlocks, nowMinute) : undefined
  const next = isToday ? blockUpNext(dayBlocks, nowMinute) : undefined

  // The "now" marker sits just before the first block that has not started yet.
  const markerBeforeId = isToday && !current ? next?.id : undefined

  return (
    <div className="po-day-view">
      <div className="po-day-tabs" role="tablist" aria-label="Choose a day">
        {WEEK_ORDER.map(day => (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={day === weekday}
            className={`po-day-tab${day === weekday ? ' active' : ''}${weekDates[day] === todayKey ? ' today' : ''}`}
            onClick={() => onSelectDay(day)}
          >
            <small>{WEEKDAY_SHORT[day]}</small>
            <strong>{Number(weekDates[day]?.slice(8))}</strong>
          </button>
        ))}
      </div>

      <div className="po-day-summary">
        <div>
          <h3>{WEEKDAY_LONG[weekday]}{isToday ? ' · Today' : ''}</h3>
          <p className="po-muted">
            {dayBlocks.length === 0
              ? 'Nothing scheduled'
              : current
                ? `Now: ${current.title} until ${formatTime(current.end)}`
                : next
                  ? `Next: ${next.title} at ${formatTime(next.start)}`
                  : `${doneCount} of ${dayBlocks.length} blocks done`}
          </p>
        </div>
        {dayBlocks.length > 0 && (
          <div className="po-day-progress">
            <ProgressBar value={(doneCount / dayBlocks.length) * 100} label={`${WEEKDAY_LONG[weekday]} progress`} />
            <small>{doneCount}/{dayBlocks.length} done</small>
          </div>
        )}
      </div>

      {dayBlocks.length === 0 ? (
        <Empty title="A free day" detail="Add a block and choose this day, or pick another day above." />
      ) : (
        <ol className="po-timeline">
          {dayBlocks.map(block => {
            const done = block.doneDates.includes(date)
            const running = current?.id === block.id
            const minutes = toMinutes(block.end) - toMinutes(block.start)
            return (
              <Fragment key={block.id}>
                {markerBeforeId === block.id && (
                  <li className="po-now-marker" aria-label={`Current time ${formatTime(fromMinutes(nowMinute))}`}>
                    <span>{formatTime(fromMinutes(nowMinute))}</span>
                  </li>
                )}
                <li className={`po-timeline-item${done ? ' is-done' : ''}${running ? ' running' : ''}`} style={{ ['--block-color' as string]: block.color }}>
                  <div className="po-timeline-time">
                    <strong>{formatTime(block.start)}</strong>
                    <small>{minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes}m`}</small>
                  </div>
                  <div className="po-timeline-card">
                    <button
                      type="button"
                      className={`po-check${done ? ' checked' : ''}`}
                      aria-pressed={done}
                      aria-label={done ? `Mark "${block.title}" not done` : `Mark "${block.title}" done`}
                      onClick={() => onToggleDone(block, date)}
                    >
                      {done && <Check size={14} strokeWidth={3} />}
                    </button>
                    <div className="po-row-main">
                      <strong>{block.title}</strong>
                      <small>{formatTime(block.start)} – {formatTime(block.end)}{block.note ? ` · ${block.note}` : ''}</small>
                    </div>
                    {running && <span className="po-chip live">Now</span>}
                    <span className="po-chip">{block.category}</span>
                    <IconButton label={`Edit "${block.title}"`} onClick={() => onEdit(block)}><Pencil size={15} /></IconButton>
                  </div>
                </li>
              </Fragment>
            )
          })}
          {isToday && !markerBeforeId && !current && dayBlocks.length > 0 && (
            <li className="po-now-marker" aria-label={`Current time ${formatTime(fromMinutes(nowMinute))}`}>
              <span>{formatTime(fromMinutes(nowMinute))}</span>
            </li>
          )}
        </ol>
      )}
    </div>
  )
}
