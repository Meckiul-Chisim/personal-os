import StatusBadge from '../components/StatusBadge'
import type { Task } from '../types'

type MyDayPageProps = {
  taskList: Task[]
  quickTask: string
  onQuickTaskChange: (value: string) => void
  onAddTask: () => void
  onToggleTaskStatus: (id: number) => void
}

export default function MyDayPage({
  taskList,
  quickTask,
  onQuickTaskChange,
  onAddTask,
  onToggleTaskStatus,
}: MyDayPageProps) {
  return (
    <div className="two-column">
      <div className="panel">
        <div className="panel-header">
          <h3>Today's task list</h3>
          <span>Daily rhythm</span>
        </div>
        <div className="quick-add">
          <input
            value={quickTask}
            onChange={(event) => onQuickTaskChange(event.target.value)}
            placeholder="Quick task..."
            aria-label="Quick task"
          />
          <button type="button" onClick={onAddTask}>Add</button>
        </div>
        <div className="task-list">
          {taskList.map((task) => (
            <button type="button" key={task.id} className="task-item" onClick={() => onToggleTaskStatus(task.id)}>
              <input aria-label={task.title} type="checkbox" checked={task.status === 'Completed'} readOnly />
              <div>
                <strong>{task.title}</strong>
                <small>{task.category} · {task.due}</small>
              </div>
              <StatusBadge priority={task.priority} />
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Daily schedule</h3>
          <span>Time blocking</span>
        </div>
        <div className="schedule-list">
          <div><strong>09:00</strong><span>Deep work</span></div>
          <div><strong>11:00</strong><span>Life admin / errands</span></div>
          <div><strong>14:00</strong><span>Project review</span></div>
          <div><strong>18:00</strong><span>Workout + reset</span></div>
        </div>
      </div>
    </div>
  )
}
