import ProgressBar from '../components/ProgressBar'
import type { Project } from '../types'

type ProjectsPageProps = {
  projectList: Project[]
}

export default function ProjectsPage({ projectList }: ProjectsPageProps) {
  return (
    <div className="card-grid">
      {projectList.map((project) => (
        <div key={project.id} className="panel project-card">
          <div className="panel-header">
            <h3>{project.title}</h3>
            <span>{project.status}</span>
          </div>
          <p>{project.highlight}</p>
          <div className="detail-row"><strong>Category</strong><span>{project.category}</span></div>
          <div className="detail-row"><strong>Target</strong><span>{project.target}</span></div>
          <ProgressBar value={project.progress} />
          <div className="detail-row"><strong>Progress</strong><span>{project.progress}%</span></div>
        </div>
      ))}
    </div>
  )
}
