import StatusBadge from '../components/StatusBadge'
import type { Task } from '../types'

type TasksPageProps = {
  taskList: Task[]
  filter: 'all' | 'today' | 'overdue' | 'completed'
  onFilterChange: (filter: 'all' | 'today' | 'overdue' | 'completed') => void
}

export default function TasksPage({ taskList, filter, onFilterChange }: TasksPageProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Task board</h3>
        <div className="chip-row">
          {(['all', 'today', 'overdue', 'completed'] as const).map((chipFilter) => (
            <button
              key={chipFilter}
              type="button"
              className={filter === chipFilter ? 'chip active' : 'chip'}
              onClick={() => onFilterChange(chipFilter)}
            >
              {chipFilter}
            </button>
          ))}
        </div>
      </div>
      <div className="task-list board">
        {taskList.map((task) => (
          <div key={task.id} className="task-row">
            <div className="task-main">
              <strong>{task.title}</strong>
              <small>{task.category} · {task.tags.join(' · ')}</small>
            </div>
            <div className="task-meta">
              <StatusBadge priority={task.priority} />
              <span className="status-pill">{task.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
