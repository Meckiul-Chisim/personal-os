import { LogOut } from 'lucide-react'
import { NAV_GROUPS, NAV_ITEMS } from '../../nav'
import { Logo } from '../ui/Logo'
import type { Section } from '../../types'

/** Desktop navigation. Hidden on small screens, where the bottom tab bar is used instead. */
export function Sidebar({ section, email, onSelect, onSignOut }: {
  section: Section
  email: string
  onSelect: (section: Section) => void
  onSignOut: () => void
}) {
  return (
    <aside className="po-sidebar">
      <div className="po-brand">
        <Logo size={40} />
        <div>
          <strong>Personal OS</strong>
          <small>Your life, in one place</small>
        </div>
      </div>

      <nav className="po-nav" aria-label="Main navigation">
        {NAV_GROUPS.map(group => (
          <div className="po-nav-group" key={group}>
            <span className="po-nav-label">{group}</span>
            {NAV_ITEMS.filter(item => item.group === group).map(item => {
              const Icon = item.icon
              const active = section === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`po-nav-item${active ? ' active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onSelect(item.id)}
                >
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  {item.label}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="po-sidebar-footer">
        <div className="po-account-chip">
          <span className="po-avatar" aria-hidden="true">{email.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>Account workspace</strong>
            <small title={email}>{email}</small>
          </div>
        </div>
        <button type="button" className="po-icon-btn" aria-label="Sign out" title="Sign out" onClick={onSignOut}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
