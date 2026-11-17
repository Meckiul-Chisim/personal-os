import { Search } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Field } from '../../components/ui/Field'
import { Panel } from '../../components/ui/Panel'
import { today } from '../../lib/date'
import { uid } from '../../lib/id'
import type { ListSetter } from '../../lib/lists'
import type { Task } from '../../types'
import { TaskList } from './TaskList'

export function TasksPage({ tasks, setTasks }: { tasks: Task[]; setTasks: ListSetter<Task> }) {
  const [title, setTitle] = useState('')
  const [area, setArea] = useState('Personal')
  const [due, setDue] = useState(today())
  const [priority, setPriority] = useState<Task['priority']>('Medium')
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => tasks.filter(task => (task.title + task.area).toLowerCase().includes(search.toLowerCase())),
    [tasks, search],
  )

  const addTask = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    setTasks(current => [
      { id: uid(), title: title.trim(), area, due, priority, done: false, createdAt: today() },
      ...current,
    ])
    setTitle('')
  }

  return (
    <>
      <Panel title="Capture a task">
        <form className="po-form po-task-form" onSubmit={addTask}>
          <Field label="Task name"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to get done?" /></Field>
          <Field label="Area">
            <select value={area} onChange={e => setArea(e.target.value)}>
              <option>Personal</option><option>Work</option><option>Business</option><option>Health</option><option>Learning</option><option>Finance</option>
            </select>
          </Field>
          <Field label="Due date"><input type="date" value={due} onChange={e => setDue(e.target.value)} /></Field>
          <Field label="Priority">
            <select value={priority} onChange={e => setPriority(e.target.value as Task['priority'])}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </Field>
          <button className="po-primary" type="submit">Add task</button>
        </form>
      </Panel>

      <Panel title="Your task list" action={<span className="po-muted">{tasks.length} total</span>}>
        <div className="po-search">
          <Search size={16} aria-hidden="true" />
          <input aria-label="Search tasks" placeholder="Search tasks or areas…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <TaskList tasks={filtered} setTasks={setTasks} />
      </Panel>
    </>
  )
}
