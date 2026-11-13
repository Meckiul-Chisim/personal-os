type TopBarProps = {
  greeting: string
  dateLabel: string
  onMenuClick: () => void
  menuExpanded: boolean
}

export default function TopBar({ greeting, dateLabel, onMenuClick, menuExpanded }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-heading">
        <button
          type="button"
          className="menu-toggle"
          aria-label="Open navigation"
          aria-expanded={menuExpanded}
          onClick={onMenuClick}
        >
          <span />
          <span />
          <span />
        </button>
        <div>
          <p className="eyebrow">{greeting}, Maya</p>
          <h1>Personal command center</h1>
        </div>
      </div>
      <div className="topbar-actions">
        <span className="date-pill">{dateLabel}</span>
        <button type="button" className="primary-btn">New entry</button>
      </div>
    </header>
  )
}
