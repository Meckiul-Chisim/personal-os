import ProgressBar from '../components/ProgressBar'
import type { Habit } from '../types'

type HabitsPageProps = {
  habitList: Habit[]
}

export default function HabitsPage({ habitList }: HabitsPageProps) {
  return (
    <div className="card-grid">
      {habitList.map((habit) => (
        <div key={habit.id} className="panel habit-card">
          <div className="panel-header">
            <h3>{habit.title}</h3>
            <span>{habit.schedule}</span>
          </div>
          <div className="habit-badge">
            <strong>{habit.streak}</strong>
            <small>day streak</small>
          </div>
          <ProgressBar value={habit.completion} />
          <div className="detail-row"><strong>Completion</strong><span>{habit.completion}%</span></div>
        </div>
      ))}
    </div>
  )
}
