import type { OverviewStat } from '../types'

type LifeOverviewPageProps = {
  stats: OverviewStat[]
}

export default function LifeOverviewPage({ stats }: LifeOverviewPageProps) {
  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div key={stat.label} className="panel stat-card">
          <h3>{stat.label}</h3>
          <strong>{stat.value}</strong>
          <small>{stat.detail}</small>
        </div>
      ))}
    </div>
  )
}
