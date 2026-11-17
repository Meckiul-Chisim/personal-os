import { ChevronLeft, ChevronRight, Pencil, Plus, X } from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Field } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Panel } from '../../components/ui/Panel'
import { useNow } from '../../hooks/useNow'
import { readableTextColor } from '../../lib/color'
import { dateKey } from '../../lib/date'
import { indiaHolidaysForYear } from '../../lib/holidays'
import { uid } from '../../lib/id'
import { removeById, type ListSetter } from '../../lib/lists'
import type { CalendarEntry, CalendarEvent } from '../../types'

const DEFAULT_COLOR = '#5f9e7a'
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarPage({ calendarEvents, setCalendarEvents }: {
  calendarEvents: CalendarEvent[]
  setCalendarEvents: ListSetter<CalendarEvent>
}) {
  const todayKey = dateKey(useNow())
  const [title, setTitle] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [time, setTime] = useState('09:00')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [note, setNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // A 6-week grid starting on the Sunday on or before the 1st of the visible month.
  const gridDates = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    const offset = first.getDay()
    return Array.from({ length: 42 }, (_, index) => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - offset + 1))
  }, [visibleMonth])

  const entries = useMemo<CalendarEntry[]>(() => [
    ...calendarEvents.map(event => ({ ...event, kind: 'event' as const })),
    ...[...new Set(gridDates.map(date => date.getFullYear()))].flatMap(indiaHolidaysForYear),
  ], [gridDates, calendarEvents])

  const entriesByDate = useMemo(() => entries.reduce<Record<string, CalendarEntry[]>>((groups, entry) => {
    groups[entry.date] = [...(groups[entry.date] ?? []), entry]
    return groups
  }, {}), [entries])

  const selectedEntries = entries
    .filter(entry => entry.date === selectedDate)
    .sort((first, second) => {
      if (first.kind !== second.kind) return first.kind === 'holiday' ? -1 : 1
      return first.kind === 'event' && second.kind === 'event' ? first.time.localeCompare(second.time) : 0
    })

  const selectDate = (date: string) => {
    setSelectedDate(date)
    const selected = new Date(`${date}T00:00:00`)
    setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
  }

  const shiftMonth = (delta: number) => {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + delta, 1)
    setVisibleMonth(next)
    setSelectedDate(dateKey(next))
  }

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setNote('')
    setTime('09:00')
    setColor(DEFAULT_COLOR)
  }

  const saveEvent = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    const next: CalendarEvent = { id: editingId ?? uid(), title: trimmed, date: selectedDate, time: time || '09:00', note: note.trim(), color }
    setCalendarEvents(current => (editingId
      ? current.map(item => (item.id === editingId ? next : item))
      : [...current, next]
    ).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()))
    resetForm()
  }

  const editEvent = (item: CalendarEvent) => {
    setEditingId(item.id)
    setTitle(item.title)
    selectDate(item.date)
    setTime(item.time)
    setColor(item.color || DEFAULT_COLOR)
    setNote(item.note)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <div className="po-calendar-layout">
      <Panel
        title={visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        className="po-calendar-panel"
        action={
          <div className="po-calendar-controls">
            <IconButton label="Previous month" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></IconButton>
            <button type="button" className="po-secondary small" onClick={() => selectDate(todayKey)}>Today</button>
            <IconButton label="Next month" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></IconButton>
          </div>
        }
      >
        <div className="po-calendar-grid">
          {WEEKDAYS.map(day => <div className="po-calendar-weekday" key={day}>{day}</div>)}
          {gridDates.map(date => {
            const key = dateKey(date)
            const dayEntries = entriesByDate[key] ?? []
            const outside = date.getMonth() !== visibleMonth.getMonth()
            const selected = key === selectedDate
            return (
              <button
                type="button"
                key={key}
                className={`po-calendar-day${outside ? ' outside' : ''}${selected ? ' selected' : ''}${key === todayKey ? ' is-today' : ''}`}
                aria-pressed={selected}
                aria-label={`${date.toLocaleDateString(undefined, { dateStyle: 'full' })}${dayEntries.length ? `, ${dayEntries.length} calendar item${dayEntries.length === 1 ? '' : 's'}` : ''}`}
                onClick={() => selectDate(key)}
              >
                <span className="po-calendar-day-number">{date.getDate()}</span>
                <span className="po-calendar-events">
                  {dayEntries.slice(0, 2).map(entry => {
                    const entryColor = entry.color || DEFAULT_COLOR
                    return (
                      <span
                        className={`po-calendar-chip${entry.kind === 'holiday' ? ' holiday' : ''}`}
                        key={entry.id}
                        style={{ backgroundColor: entryColor, color: readableTextColor(entryColor) }}
                      >
                        {entry.title}
                      </span>
                    )
                  })}
                  {dayEntries.length > 2 && <span className="po-calendar-more">+{dayEntries.length - 2} more</span>}
                </span>
                {dayEntries.length > 0 && <span className="po-calendar-dot" style={{ backgroundColor: dayEntries[0]?.color || DEFAULT_COLOR }} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
        <p className="po-calendar-legend">Includes India public holidays and festivals.</p>
      </Panel>

      <aside className="po-calendar-side">
        <Panel title={editingId ? 'Edit event' : 'Add an event'}>
          <form ref={formRef} className="po-calendar-form" onSubmit={saveEvent}>
            <Field label="Event name"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Team check-in" required /></Field>
            <Field label="Date"><input type="date" value={selectedDate} onChange={e => e.target.value && selectDate(e.target.value)} required /></Field>
            <Field label="Time"><input type="time" value={time} onChange={e => setTime(e.target.value)} required /></Field>
            <Field label="Event colour"><input type="color" value={color} onChange={e => setColor(e.target.value)} /></Field>
            <Field label="Notes"><input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional location or details" /></Field>
            <div className="po-form-actions">
              {editingId && <button className="po-secondary" type="button" onClick={resetForm}>Cancel</button>}
              <button className="po-primary" type="submit"><Plus size={16} aria-hidden="true" /> {editingId ? 'Save changes' : 'Add event'}</button>
            </div>
          </form>
        </Panel>

        <Panel
          title={new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          action={<span className="po-muted">{selectedEntries.length} {selectedEntries.length === 1 ? 'item' : 'items'}</span>}
        >
          {selectedEntries.length ? (
            <ul className="po-list">
              {selectedEntries.map(entry => (
                <li className="po-row po-agenda-item" key={entry.id} style={{ borderLeftColor: entry.color || DEFAULT_COLOR }}>
                  <time className="po-agenda-time">{entry.kind === 'holiday' ? 'All day' : entry.time}</time>
                  <div className="po-row-main">
                    <strong>{entry.title}</strong>
                    {entry.kind === 'event' && entry.note && <small>{entry.note}</small>}
                    {entry.kind === 'holiday' && <small>India holiday · Built in</small>}
                  </div>
                  {entry.kind === 'event' && (
                    <>
                      <IconButton label={`Edit ${entry.title}`} onClick={() => editEvent(entry)}><Pencil size={15} /></IconButton>
                      <IconButton
                        label={`Delete ${entry.title}`}
                        danger
                        onClick={() => { removeById(setCalendarEvents, entry.id); if (editingId === entry.id) resetForm() }}
                      >
                        <X size={16} />
                      </IconButton>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="po-calendar-empty">Nothing planned for this day. Add an event to get started.</p>
          )}
        </Panel>
      </aside>
    </div>
  )
}
