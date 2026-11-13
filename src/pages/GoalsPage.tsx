import ProgressBar from '../components/ProgressBar'
import type { Goal } from '../types'

type GoalsPageProps = {
  goalList: Goal[]
}

export default function GoalsPage({ goalList }: GoalsPageProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Goal tracking</h3>
        <span>Connected to projects</span>
      </div>
      <div className="goal-list">
        {goalList.map((goal) => (
          <div key={goal.id} className="goal-card">
            <div>
              <strong>{goal.title}</strong>
              <small>{goal.category} · {goal.related}</small>
            </div>
            <div className="progress-meta">
              <ProgressBar value={goal.progress} />
              <span>{goal.progress}%</span>
            </div>
            <small>Target date: {goal.due}</small>
          </div>
        ))}
      </div>
    </div>
  )
}
