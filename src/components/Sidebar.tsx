import type { NavSection, SectionName } from '../types'

type SidebarProps = {
  sections: NavSection[]
  activeSection: SectionName
  isOpen: boolean
  onSelect: (section: SectionName) => void
}

export default function Sidebar({ sections, activeSection, isOpen, onSelect }: SidebarProps) {
  return (
    <aside className={`sidebar${isOpen ? ' is-open' : ''}`} aria-label="Main navigation">
      <div className="brand">
        <div className="brand-mark">M</div>
        <div>
          <strong>MyPlanner</strong>
          <span>Personal OS</span>
        </div>
      </div>

      <nav className="nav-stack">
        {sections.map((section) => (
          <button
            type="button"
            key={section.id}
            className={activeSection === section.id ? 'nav-item active' : 'nav-item'}
            onClick={() => onSelect(section.id)}
          >
            <span>{section.icon}</span>
            <div>
              <strong>{section.id}</strong>
              <small>{section.description}</small>
            </div>
          </button>
        ))}
      </nav>

      <div className="sidebar-card">
        <small>Daily focus</small>
        <h4>Finish investor update deck</h4>
        <button type="button">Open clarity center</button>
      </div>
    </aside>
  )
}
