import { MoreHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { MOBILE_PRIMARY, NAV_ITEMS } from '../../nav'
import type { Section } from '../../types'

/** Bottom navigation for phones: four main sections plus a "More" sheet for the rest. */
export function MobileTabBar({ section, onSelect }: { section: Section; onSelect: (section: Section) => void }) {
  const [moreOpen, setMoreOpen] = useState(false)

  const primary = NAV_ITEMS.filter(item => MOBILE_PRIMARY.includes(item.id))
  const more = NAV_ITEMS.filter(item => !MOBILE_PRIMARY.includes(item.id))
  const moreIsActive = more.some(item => item.id === section)

  const choose = (next: Section) => {
    onSelect(next)
    setMoreOpen(false)
  }

  return (
    <div className="po-mobile-bar">
      {moreOpen && (
        <div className="po-more-sheet" role="dialog" aria-label="More sections">
          <div className="po-more-head">
            <strong>More</strong>
            <button type="button" className="po-icon-btn" aria-label="Close more menu" onClick={() => setMoreOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="po-more-grid">
            {more.map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`po-more-item${section === item.id ? ' active' : ''}`}
                  aria-current={section === item.id ? 'page' : undefined}
                  onClick={() => choose(item.id)}
                >
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <nav className="po-tabbar" aria-label="Primary navigation">
        {primary.map(item => {
          const Icon = item.icon
          const active = section === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`po-tab${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => choose(item.id)}
            >
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          )
        })}
        <button
          type="button"
          className={`po-tab${moreIsActive || moreOpen ? ' active' : ''}`}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(open => !open)}
        >
          <MoreHorizontal size={20} strokeWidth={1.8} aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>
    </div>
  )
}
