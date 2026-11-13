import ProgressBar from '../components/ProgressBar'
import type { Goal, Habit, InsightBar, Note, Project, Task } from '../types'

type DashboardPageProps = {
  taskList: Task[]
  projectList: Project[]
  goalList: Goal[]
  habitList: Habit[]
  noteList: Note[]
  insightBars: InsightBar[]
  completionRate: number
}

export default function DashboardPage({
  taskList,
  projectList,
  goalList,
  habitList,
  noteList,
  insightBars,
  completionRate,
}: DashboardPageProps) {
  return (
    <div className="section-grid dashboard-grid">
      <div className="panel hero-panel">
        <div>
          <p className="eyebrow">Today at a glance</p>
          <h2>Focus on what matters most</h2>
        </div>
        <div className="hero-metrics">
          <div>
            <strong>{completionRate}%</strong>
            <span>task completion</span>
          </div>
          <div>
            <strong>{projectList.length}</strong>
            <span>live projects</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Today's priorities</h3>
          <span>Customizable</span>
        </div>
        <ul className="stack-list">
          {taskList.slice(0, 3).map((task) => (
            <li key={task.id}>
              <span className={`priority-dot ${task.priority.toLowerCase()}`}></span>
              <div>
                <strong>{task.title}</strong>
                <small>{task.time} · {task.category}</small>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Upcoming deadlines</h3>
          <span>{taskList.length} items</span>
        </div>
        <ul className="mini-list">
          {taskList.slice(0, 4).map((task) => (
            <li key={task.id}>
              <span>{task.due}</span>
              <strong>{task.title}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel wide-panel">
        <div className="panel-header">
          <h3>Project progress</h3>
          <span>Live overview</span>
        </div>
        <div className="project-rows">
          {projectList.map((project) => (
            <div key={project.id} className="project-row">
              <div>
                <strong>{project.title}</strong>
                <small>{project.category}</small>
              </div>
              <div className="progress-meta">
                <ProgressBar value={project.progress} />
                <span>{project.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Goal progress</h3>
          <span>Growth</span>
        </div>
        <div className="goal-stack">
          {goalList.map((goal) => (
            <div key={goal.id} className="goal-item">
              <div>
                <strong>{goal.title}</strong>
                <small>{goal.category}</small>
              </div>
              <span>{goal.progress}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Habit completion</h3>
          <span>87% this week</span>
        </div>
        {habitList.map((habit) => (
          <div key={habit.id} className="metric-row">
            <div>
              <strong>{habit.title}</strong>
              <small>{habit.schedule}</small>
            </div>
            <span>{habit.completion}%</span>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Quick notes</h3>
          <span>Brain dump</span>
        </div>
        <ul className="notes-list">
          {noteList.slice(0, 2).map((note) => (
            <li key={note.id}>
              <strong>{note.title}</strong>
              <p>{note.excerpt}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel wide-panel">
        <div className="panel-header">
          <h3>Weekly progress overview</h3>
          <span>Last 7 days</span>
        </div>
        <div className="bar-chart">
          {insightBars.map((bar) => (
            <div key={bar.label} className="bar-column">
              <span style={{ height: `${bar.value}%` }} />
              <small>{bar.label}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
