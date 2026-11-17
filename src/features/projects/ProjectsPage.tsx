import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Empty } from '../../components/ui/Empty'
import { Field } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Panel } from '../../components/ui/Panel'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { uid } from '../../lib/id'
import { removeById, updateById, type ListSetter } from '../../lib/lists'
import type { Project } from '../../types'

export function ProjectsPage({ projects, setProjects }: { projects: Project[]; setProjects: ListSetter<Project> }) {
  const [name, setName] = useState('')
  const [area, setArea] = useState('Work')

  const addProject = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    setProjects(current => [{ id: uid(), name: name.trim(), area, status: 'Active', progress: 0, next: '' }, ...current])
    setName('')
  }

  // Moving the slider to 100% completes the project; moving it back reopens it.
  const setProgress = (project: Project, progress: number) => {
    const status: Project['status'] = progress === 100 ? 'Completed' : project.status === 'Completed' ? 'Active' : project.status
    updateById(setProjects, project.id, { progress, status })
  }

  return (
    <>
      <Panel title="Create a project">
        <form className="po-form" onSubmit={addProject}>
          <Field label="Project name"><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Build my portfolio" /></Field>
          <Field label="Area">
            <select value={area} onChange={e => setArea(e.target.value)}>
              <option>Work</option><option>Business</option><option>Personal</option><option>Learning</option><option>Health</option>
            </select>
          </Field>
          <button className="po-primary" type="submit">Create project</button>
        </form>
      </Panel>

      {projects.length > 0 && (
        <div className="po-card-grid">
          {projects.map(project => (
            <article className="po-panel po-project" key={project.id}>
              <div className="po-project-top">
                <span className="po-chip">{project.area}</span>
                <IconButton label={`Delete project "${project.name}"`} danger onClick={() => removeById(setProjects, project.id)}><X size={16} /></IconButton>
              </div>
              <h3>{project.name}</h3>
              <span className="po-muted">{project.status}</span>
              <ProgressBar value={project.progress} label={`Progress for ${project.name}`} />
              <div className="po-progress-line"><small>Progress</small><strong>{project.progress}%</strong></div>
              <input
                className="po-range"
                aria-label={`Set progress for ${project.name}`}
                type="range"
                min="0"
                max="100"
                value={project.progress}
                onChange={e => setProgress(project, Number(e.target.value))}
              />
            </article>
          ))}
        </div>
      )}
      {!projects.length && <Empty title="Start with one project" detail="Track a business, work stream or personal project from idea to completion." />}
    </>
  )
}
