import { Check } from 'lucide-react'
import { Empty } from '../../components/ui/Empty'
import { useNow } from '../../hooks/useNow'
import { dateKey, formatTime, nowMinutesOf } from '../../lib/date'
import type { ListSetter } from '../../lib/lists'
import { blockInProgress, blockUpNext, blocksForDay, toggleDone } from '../../lib/timetable'
import type { TimetableBlock } from '../../types'

/** Today's timetable blocks as a compact checklist. Used on Overview and My day. */
export function TodaySchedule({ timetable, setTimetable, onOpen }: {
  timetable: TimetableBlock[]
  setTimetable: ListSetter<TimetableBlock>
  onOpen: () => void
}) {
  const now = useNow()
  const todayKey = dateKey(now)
  const minute = nowMinutesOf(now)
  const blocks = blocksForDay(timetable, now.getDay())
  const current = blockInProgress(blocks, minute)
  const next = blockUpNext(blocks, minute)

  if (!blocks.length) {
    return (
      <Empty
        title="No routine for today"
        detail="Build a weekly timetable and today's blocks will show up here."
      />
    )
  }

  return (
    <>
      <p className="po-muted po-schedule-status">
        {current ? `Now: ${current.title} until ${formatTime(current.end)}` : next ? `Next: ${next.title} at ${formatTime(next.start)}` : 'All blocks for today have finished.'}
      </p>
      <ul className="po-list">
        {blocks.map(block => {
          const done = block.doneDates.includes(todayKey)
          return (
            <li className={`po-row po-schedule-row${done ? ' is-done' : ''}${current?.id === block.id ? ' running' : ''}`} key={block.id} style={{ ['--block-color' as string]: block.color }}>
              <button
                type="button"
                className={`po-check${done ? ' checked' : ''}`}
                aria-pressed={done}
                aria-label={done ? `Mark "${block.title}" not done` : `Mark "${block.title}" done`}
                onClick={() => setTimetable(items => items.map(item => (item.id === block.id ? toggleDone(item, todayKey) : item)))}
              >
                {done && <Check size={14} strokeWidth={3} />}
              </button>
              <div className="po-row-main">
                <strong>{block.title}</strong>
                <small>{formatTime(block.start)} – {formatTime(block.end)} · {block.category}</small>
              </div>
            </li>
          )
        })}
      </ul>
      <button type="button" className="po-text-btn" onClick={onOpen}>Open timetable →</button>
    </>
  )
}
