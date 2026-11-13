import { useMemo, useState, type FormEvent } from 'react'
import { calendarDays } from '../data/mockData'
import type { Task } from '../types'

type CalendarPageProps = {
  taskList: Task[]
  onAddTask: (title: string, scheduledDate: string, time: string) => void
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', options).format(date)

export default function CalendarPage({ taskList, onAddTask }: CalendarPageProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')

  const calendarDates = useMemo(() => {
    const firstOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate()
    const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7

    return Array.from({ length: cellCount }, (_, index) =>
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - mondayOffset + 1),
    )
  }, [visibleMonth])

  const selectedTasks = taskList
    .filter((task) => task.scheduledDate === selectedDate)
    .sort((first, second) => first.time.localeCompare(second.time))
  const selectedDateObject = new Date(`${selectedDate}T00:00:00`)

  const changeMonth = (amount: number) => {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + amount, 1)
    setVisibleMonth(nextMonth)
    setSelectedDate(toDateKey(nextMonth))
  }

  const selectDate = (date: Date) => {
    setSelectedDate(toDateKey(date))
    if (date.getMonth() !== visibleMonth.getMonth() || date.getFullYear() !== visibleMonth.getFullYear()) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    onAddTask(trimmedTitle, selectedDate, time)
    setTitle('')
  }

  return (
    <div className="calendar-layout">
      <section className="panel calendar-panel">
        <div className="panel-header calendar-header">
          <div>
            <h3>{formatDate(visibleMonth, { month: 'long', year: 'numeric' })}</h3>
            <span>Choose a day to view or schedule tasks</span>
          </div>
          <div className="calendar-controls">
            <button type="button" className="chip" aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button>
            <button
              type="button"
              className="chip"
              onClick={() => {
                const today = new Date()
                setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1))
                setSelectedDate(toDateKey(today))
              }}
            >
              Today
            </button>
            <button type="button" className="chip" aria-label="Next month" onClick={() => changeMonth(1)}>›</button>
          </div>
        </div>
        <div className="calendar-grid">
          {calendarDays.map((day) => (
            <div key={day} className="calendar-day-label">{day}</div>
          ))}
          {calendarDates.map((date) => {
            const dateKey = toDateKey(date)
            const dayTasks = taskList.filter((task) => task.scheduledDate === dateKey)
            const isCurrentMonth = date.getMonth() === visibleMonth.getMonth()
            const isSelected = dateKey === selectedDate

            return (
              <button
                key={dateKey}
                type="button"
                className={`calendar-day${isSelected ? ' day-active' : ''}${isCurrentMonth ? '' : ' day-outside'}`}
                aria-pressed={isSelected}
                aria-label={`${formatDate(date, { dateStyle: 'full' })}${dayTasks.length ? `, ${dayTasks.length} scheduled task${dayTasks.length === 1 ? '' : 's'}` : ''}`}
                onClick={() => selectDate(date)}
              >
                <span className="calendar-day-number">{date.getDate()}</span>
                {dayTasks.length > 0 && (
                  <span className="calendar-day-count">{dayTasks.length} task{dayTasks.length === 1 ? '' : 's'}</span>
                )}
              </button>
            )
          })}
        </div>
        <div className="calendar-agenda">
          <div className="panel-header">
            <h3>{formatDate(selectedDateObject, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            <span>{selectedTasks.length} scheduled</span>
          </div>
          {selectedTasks.length > 0 ? (
            <ul className="calendar-task-list">
              {selectedTasks.map((task) => (
                <li key={task.id}>
                  <time>{task.time}</time>
                  <strong>{task.title}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="calendar-empty">No tasks scheduled for this day.</p>
          )}
        </div>
      </section>
      <aside className="panel calendar-form-panel">
        <div className="panel-header">
          <h3>Add a task</h3>
        </div>
        <form className="calendar-form" onSubmit={handleSubmit}>
          <label>
            Task name
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs to get done?"
              required
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                if (event.target.value) selectDate(new Date(`${event.target.value}T00:00:00`))
              }}
              required
            />
          </label>
          <label>
            Time
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
          </label>
          <button type="submit" className="primary-btn">Add to calendar</button>
        </form>
      </aside>
    </div>
  )
}
