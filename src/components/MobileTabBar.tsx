import { useState } from 'react'
import type { NavSection, SectionName } from '../types'

type MobileTabBarProps = {
  sections: NavSection[]
  activeSection: SectionName
  onSelect: (section: SectionName) => void
}

const primarySections: SectionName[] = ['Dashboard', 'My Day', 'Tasks', 'Calendar']

export default function MobileTabBar({ sections, activeSection, onSelect }: MobileTabBarProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const primaryItems = sections.filter((section) => primarySections.includes(section.id))
  const moreItems = sections.filter((section) => !primarySections.includes(section.id))
  const moreIsActive = moreItems.some((section) => section.id === activeSection)

  const selectSection = (section: SectionName) => {
    onSelect(section)
    setMoreOpen(false)
  }

  return (
    <>
      <nav className="mobile-tabbar" aria-label="Primary navigation">
        {primaryItems.map((section) => (
          <button
            type="button"
            key={section.id}
            className={activeSection === section.id ? 'mobile-tab active' : 'mobile-tab'}
            aria-current={activeSection === section.id ? 'page' : undefined}
            onClick={() => selectSection(section.id)}
          >
            <span aria-hidden="true">{section.icon}</span>
            <small>{section.id}</small>
          </button>
        ))}
        <button
          type="button"
          className={moreIsActive || moreOpen ? 'mobile-tab active' : 'mobile-tab'}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <span aria-hidden="true">···</span>
          <small>More</small>
        </button>
      </nav>

      {moreOpen && (
        <div className="mobile-more-overlay">
          <button
            type="button"
            className="mobile-more-backdrop"
            aria-label="Close more menu"
            onClick={() => setMoreOpen(false)}
          />
          <section className="mobile-more-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title">
            <div className="mobile-more-heading">
              <h2 id="mobile-more-title">More</h2>
              <button type="button" aria-label="Close more menu" onClick={() => setMoreOpen(false)}>×</button>
            </div>
            <nav aria-label="More sections">
              {moreItems.map((section) => (
                <button
                  type="button"
                  key={section.id}
                  className={activeSection === section.id ? 'mobile-more-item active' : 'mobile-more-item'}
                  onClick={() => selectSection(section.id)}
                >
                  <span aria-hidden="true">{section.icon}</span>
                  {section.id}
                </button>
              ))}
            </nav>
          </section>
        </div>
      )}
    </>
  )
}
