import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Empty } from '../../components/ui/Empty'
import { Field } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Panel } from '../../components/ui/Panel'
import { uid } from '../../lib/id'
import { removeById, updateById, type ListSetter } from '../../lib/lists'
import type { LearningItem } from '../../types'

export function LearningPage({ learning, setLearning }: { learning: LearningItem[]; setLearning: ListSetter<LearningItem> }) {
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('Technology')

  const addLearning = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    setLearning(current => [{ id: uid(), title: title.trim(), topic, status: 'To learn', minutes: 0 }, ...current])
    setTitle('')
  }

  return (
    <>
      <Panel title="Add something to learn">
        <form className="po-form" onSubmit={addLearning}>
          <Field label="Skill or topic"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. TypeScript fundamentals" /></Field>
          <Field label="Category">
            <select value={topic} onChange={e => setTopic(e.target.value)}>
              <option>Technology</option><option>Business</option><option>Creative</option><option>Communication</option><option>Personal growth</option>
            </select>
          </Field>
          <button className="po-primary" type="submit">Add to learning list</button>
        </form>
      </Panel>

      <Panel title="Learning roadmap">
        {learning.length ? (
          <ul className="po-list">
            {learning.map(item => (
              <li className="po-row po-learning-row" key={item.id}>
                <div className="po-row-main">
                  <strong>{item.title}</strong>
                  <small>{item.topic} · {item.minutes} minutes logged</small>
                </div>
                <select
                  className="po-inline-select"
                  aria-label={`Status for ${item.title}`}
                  value={item.status}
                  onChange={e => updateById(setLearning, item.id, { status: e.target.value as LearningItem['status'] })}
                >
                  <option>To learn</option><option>Learning</option><option>Completed</option>
                </select>
                <IconButton label={`Delete "${item.title}"`} danger onClick={() => removeById(setLearning, item.id)}><X size={16} /></IconButton>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="Choose your next skill" detail="Collect the skills and subjects you want to study. Track status as you progress." />
        )}
      </Panel>
    </>
  )
}
