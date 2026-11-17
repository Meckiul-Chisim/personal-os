import { Check, X } from 'lucide-react'
import { Empty } from '../../components/ui/Empty'
import { IconButton } from '../../components/ui/IconButton'
import { removeById, updateById, type ListSetter } from '../../lib/lists'
import type { Task } from '../../types'

/** A list of tasks with a complete toggle and a delete button. Used by Tasks, Overview and My day. */
export function TaskList({ tasks, setTasks, emptyTitle = 'Nothing here yet', emptyDetail = 'Add a task when something needs your attention. Your list will grow from your real entries.' }: {
  tasks: Task[]
  setTasks: ListSetter<Task>
  emptyTitle?: string
  emptyDetail?: string
}) {
  if (!tasks.length) return <Empty title={emptyTitle} detail={emptyDetail} />

  return (
    <ul className="po-list">
      {tasks.map(task => (
        <li className={`po-row${task.done ? ' is-done' : ''}`} key={task.id}>
          <button
            type="button"
            className={`po-check${task.done ? ' checked' : ''}`}
            aria-label={task.done ? `Mark "${task.title}" incomplete` : `Complete "${task.title}"`}
            aria-pressed={task.done}
            onClick={() => updateById(setTasks, task.id, { done: !task.done })}
          >
            {task.done && <Check size={14} strokeWidth={3} />}
          </button>
          <div className="po-row-main">
            <strong>{task.title}</strong>
            <small>{task.area} · Due {task.due || 'No date'}</small>
          </div>
          <span className={`po-chip priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
          <IconButton label={`Delete "${task.title}"`} danger onClick={() => removeById(setTasks, task.id)}>
            <X size={16} />
          </IconButton>
        </li>
      ))}
    </ul>
  )
}
