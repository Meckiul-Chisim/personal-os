import type { ClarityItem } from '../types'

type ClarityPageProps = {
  clarityList: ClarityItem[]
}

export default function ClarityPage({ clarityList }: ClarityPageProps) {
  return (
    <div className="card-grid clarity-grid">
      {clarityList.map((item) => (
        <div key={item.id} className="panel clarity-card">
          <div className="panel-header">
            <h3>{item.label}</h3>
            <span>{item.count} entries</span>
          </div>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  )
}
