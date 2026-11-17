import { Check, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Empty } from '../../components/ui/Empty'
import { Field } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Panel } from '../../components/ui/Panel'
import { today } from '../../lib/date'
import { uid } from '../../lib/id'
import { removeById, type ListSetter } from '../../lib/lists'
import type { Habit } from '../../types'

export function HabitsPage({ habits, setHabits }: { habits: Habit[]; setHabits: ListSetter<Habit> }) {
  const [name, setName] = useState('')
  const todayKey = today()

  const addHabit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    setHabits(current => [{ id: uid(), name: name.trim(), frequency: 'Daily', doneDates: [] }, ...current])
    setName('')
  }

  // Checking a habit again on the same day un-checks it.
  const toggleHabit = (habit: Habit) =>
    setHabits(current => current.map(item => {
      if (item.id !== habit.id) return item
      const doneToday = item.doneDates.includes(todayKey)
      return { ...item, doneDates: doneToday ? item.doneDates.filter(date => date !== todayKey) : [...item.doneDates, todayKey] }
    }))

  return (
    <>
      <Panel title="Build a routine">
        <form className="po-form" onSubmit={addHabit}>
          <Field label="Habit name"><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 20 minutes of reading" /></Field>
          <button className="po-primary" type="submit">Add habit</button>
        </form>
      </Panel>

      <Panel title="Daily check-off">
        <p className="po-hint">Mark each habit when you complete it. Your check-ins are saved by date.</p>
        {habits.length ? (
          <ul className="po-list">
            {habits.map(habit => {
              const done = habit.doneDates.includes(todayKey)
              return (
                <li className="po-row" key={habit.id}>
                  <button
                    type="button"
                    className={`po-check${done ? ' checked' : ''}`}
                    aria-pressed={done}
                    aria-label={done ? `Undo "${habit.name}" for today` : `Check off "${habit.name}" for today`}
                    onClick={() => toggleHabit(habit)}
                  >
                    {done && <Check size={14} strokeWidth={3} />}
                  </button>
                  <div className="po-row-main">
                    <strong>{habit.name}</strong>
                    <small>{habit.doneDates.length} check-ins · Daily</small>
                  </div>
                  <IconButton label={`Delete habit "${habit.name}"`} danger onClick={() => removeById(setHabits, habit.id)}><X size={16} /></IconButton>
                </li>
              )
            })}
          </ul>
        ) : (
          <Empty title="Start small" detail="Add one repeatable action. Build consistency before adding more." />
        )}
      </Panel>
    </>
  )
}
