import { LogOut, Moon, Plus, Sun } from 'lucide-react'
import { useNow } from '../../hooks/useNow'
import { Logo } from '../ui/Logo'
import type { Theme } from '../../types'

/** Page title, today's date and the quick actions (theme, new task, sign out). */
export function TopBar({ title, sectionLabel, theme, onToggleTheme, onNewTask, onSignOut }: {
  title: string
  sectionLabel: string
  theme: Theme
  onToggleTheme: () => void
  onNewTask: () => void
  onSignOut: () => void
}) {
  const now = useNow()

  return (
    <header className="po-topbar">
      <div className="po-topbar-title">
        <Logo size={36} className="po-topbar-logo" />
        <div>
          <span className="po-breadcrumb">Personal OS / {sectionLabel}</span>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="po-top-actions">
        <span className="po-today-chip">{now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <button
          type="button"
          className="po-icon-btn round"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button type="button" className="po-icon-btn round po-signout-top" aria-label="Sign out" title="Sign out" onClick={onSignOut}>
          <LogOut size={17} />
        </button>
        <button type="button" className="po-primary po-new-task" onClick={onNewTask}>
          <Plus size={16} aria-hidden="true" /> New task
        </button>
      </div>
    </header>
  )
}
