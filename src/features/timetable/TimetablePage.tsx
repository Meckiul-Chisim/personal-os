import { useRef, useState } from 'react'
import { Panel } from '../../components/ui/Panel'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useNow } from '../../hooks/useNow'
import { dateKey, nowMinutesOf, toMinutes } from '../../lib/date'
import type { ListSetter } from '../../lib/lists'
import { blocksForDay, currentWeekDates, toggleDone } from '../../lib/timetable'
import type { TimetableBlock } from '../../types'
import { BlockForm } from './BlockForm'
import { DayView } from './DayView'
import { WeekGrid } from './WeekGrid'

type View = 'week' | 'day'

/**
 * Timetable & routine: recurring weekly blocks you can view as a week grid or a single day,
 * tick off as you go, and edit in the form beside it.
 */
export function TimetablePage({ timetable, setTimetable }: { timetable: TimetableBlock[]; setTimetable: ListSetter<TimetableBlock> }) {
  const now = useNow()
  const isNarrow = useMediaQuery('(max-width: 900px)')
  const [view, setView] = useState<View>('week')
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDay())
  const [editing, setEditing] = useState<TimetableBlock | null>(null)
  const [formKey, setFormKey] = useState(0)
  const formRef = useRef<HTMLDivElement>(null)

  const todayKey = dateKey(now)
  const nowMinute = nowMinutesOf(now)
  const weekDates = currentWeekDates(now)
  const effectiveView: View = isNarrow ? 'day' : view

  // Summary numbers for the tiles above the schedule.
  const todayBlocks = blocksForDay(timetable, now.getDay())
  const doneToday = todayBlocks.filter(block => block.doneDates.includes(todayKey)).length
  const weeklyMinutes = timetable.reduce((sum, block) => sum + (toMinutes(block.end) - toMinutes(block.start)) * block.days.length, 0)

  const resetForm = () => {
    setEditing(null)
    setFormKey(key => key + 1)
  }

  const saveBlock = (block: TimetableBlock) => {
    setTimetable(current => (current.some(item => item.id === block.id)
      ? current.map(item => (item.id === block.id ? block : item))
      : [...current, block]))
    resetForm()
  }

  const deleteBlock = (block: TimetableBlock) => {
    if (!window.confirm(`Delete "${block.title}" from every day it repeats?`)) return
    setTimetable(current => current.filter(item => item.id !== block.id))
    resetForm()
  }

  const startEdit = (block: TimetableBlock) => {
    setEditing(block)
    setFormKey(key => key + 1)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const markDone = (block: TimetableBlock, date: string) =>
    setTimetable(current => current.map(item => (item.id === block.id ? toggleDone(item, date) : item)))

  return (
    <>
      <div className="po-stats three">
        <div className="po-stat"><span>Today</span><strong>{todayBlocks.length}</strong><small>{todayBlocks.length === 1 ? 'block scheduled' : 'blocks scheduled'}</small></div>
        <div className="po-stat"><span>Done today</span><strong>{doneToday}/{todayBlocks.length}</strong><small>Small steps add up</small></div>
        <div className="po-stat"><span>Planned this week</span><strong>{Math.round((weeklyMinutes / 60) * 10) / 10}h</strong><small>{timetable.length} recurring {timetable.length === 1 ? 'block' : 'blocks'}</small></div>
      </div>

      <div className="po-tt-layout">
        <Panel
          title={effectiveView === 'week' ? 'This week' : 'Daily schedule'}
          className="po-tt-panel"
          action={!isNarrow && (
            <div className="po-segment" role="group" aria-label="Timetable view">
              <button type="button" className={view === 'week' ? 'active' : ''} aria-pressed={view === 'week'} onClick={() => setView('week')}>Week</button>
              <button type="button" className={view === 'day' ? 'active' : ''} aria-pressed={view === 'day'} onClick={() => setView('day')}>Day</button>
            </div>
          )}
        >
          {effectiveView === 'week' ? (
            <>
              <WeekGrid
                blocks={timetable}
                weekDates={weekDates}
                todayKey={todayKey}
                nowMinute={nowMinute}
                selectedId={editing?.id ?? null}
                onSelect={startEdit}
              />
              {timetable.length === 0 && (
                <p className="po-tt-hint">Your week is empty. Add your first block on the right to start building a routine.</p>
              )}
            </>
          ) : (
            <DayView
              blocks={timetable}
              weekday={selectedDay}
              weekDates={weekDates}
              todayKey={todayKey}
              nowMinute={nowMinute}
              onSelectDay={setSelectedDay}
              onToggleDone={markDone}
              onEdit={startEdit}
            />
          )}
        </Panel>

        <div ref={formRef} className="po-tt-side">
          <Panel title={editing ? 'Edit block' : 'Add a block'}>
            <BlockForm
              key={`${editing?.id ?? 'new'}-${formKey}`}
              editing={editing}
              blocks={timetable}
              defaultDay={selectedDay}
              onSave={saveBlock}
              onCancel={resetForm}
              onDelete={deleteBlock}
            />
          </Panel>
          <p className="po-tt-hint">
            Blocks repeat every week on the days you choose. Tick them off in the Day view; each day keeps its own completion.
          </p>
        </div>
      </div>
    </>
  )
}
