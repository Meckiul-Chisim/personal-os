import type { InsightBar } from '../types'

type InsightsPageProps = {
  insightBars: InsightBar[]
}

export default function InsightsPage({ insightBars }: InsightsPageProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Insights & reviews</h3>
        <span>Momentum</span>
      </div>
      <div className="bar-chart insights-bar-chart">
        {insightBars.map((bar) => (
          <div key={bar.label} className="bar-column">
            <span style={{ height: `${bar.value}%` }} />
            <small>{bar.label}</small>
          </div>
        ))}
      </div>
    </div>
  )
}
