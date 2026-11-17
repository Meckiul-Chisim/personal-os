import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Empty } from '../../components/ui/Empty'
import { Field } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Panel } from '../../components/ui/Panel'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { uid } from '../../lib/id'
import { removeById, updateById, type ListSetter } from '../../lib/lists'
import type { Goal } from '../../types'

export function GoalsPage({ goals, setGoals }: { goals: Goal[]; setGoals: ListSetter<Goal> }) {
  const [title, setTitle] = useState('')

  const addGoal = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    setGoals(current => [{ id: uid(), title: title.trim(), area: 'Personal', target: '', progress: 0 }, ...current])
    setTitle('')
  }

  return (
    <>
      <Panel title="Set a meaningful goal">
        <form className="po-form" onSubmit={addGoal}>
          <Field label="Goal"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="What do you want to achieve?" /></Field>
          <button className="po-primary" type="submit">Add goal</button>
        </form>
      </Panel>

      <Panel title="Goals & milestones">
        {goals.length ? (
          <ul className="po-list">
            {goals.map(goal => (
              <li className="po-goal" key={goal.id}>
                <div className="po-row-main">
                  <strong>{goal.title}</strong>
                  <small>{goal.area}</small>
                  <ProgressBar value={goal.progress} label={`Progress for ${goal.title}`} />
                </div>
                <input
                  className="po-range"
                  aria-label={`Set progress for ${goal.title}`}
                  type="range"
                  min="0"
                  max="100"
                  value={goal.progress}
                  onChange={e => updateById(setGoals, goal.id, { progress: Number(e.target.value) })}
                />
                <b className="po-percent">{goal.progress}%</b>
                <IconButton label={`Delete goal "${goal.title}"`} danger onClick={() => removeById(setGoals, goal.id)}><X size={16} /></IconButton>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No goals defined" detail="Add outcomes that matter over months, not just tasks for today." />
        )}
      </Panel>
    </>
  )
}
