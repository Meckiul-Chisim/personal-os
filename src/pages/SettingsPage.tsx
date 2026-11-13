import type { AppTheme, WeekStartsOn } from '../types'

type SettingsPageProps = {
  theme: AppTheme
  weekStartsOn: WeekStartsOn
  onThemeChange: (theme: AppTheme) => void
  onWeekStartsOnChange: (weekStartsOn: WeekStartsOn) => void
}

export default function SettingsPage({
  theme,
  weekStartsOn,
  onThemeChange,
  onWeekStartsOnChange,
}: SettingsPageProps) {
  return (
    <div className="settings-page">
      <header className="settings-intro">
        <p className="eyebrow">Workspace</p>
        <h2>Settings</h2>
        <p>Adjust how your planning workspace looks and behaves.</p>
      </header>

      <section className="settings-group" aria-labelledby="appearance-heading">
        <h3 id="appearance-heading">Appearance</h3>
        <div className="settings-row">
          <div>
            <strong>Theme</strong>
            <small>Choose the appearance used across your workspace.</small>
          </div>
          <div className="settings-options" role="group" aria-label="Theme">
            {(['light', 'dark'] as const).map((option) => (
              <button
                type="button"
                key={option}
                className={theme === option ? 'chip active' : 'chip'}
                aria-pressed={theme === option}
                onClick={() => onThemeChange(option)}
              >
                {option === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-group" aria-labelledby="calendar-heading">
        <h3 id="calendar-heading">Calendar</h3>
        <div className="settings-row">
          <div>
            <strong>Week starts on</strong>
            <small>Set the first day shown in your calendar.</small>
          </div>
          <div className="settings-options" role="group" aria-label="First day of the week">
            {(['monday', 'sunday'] as const).map((option) => (
              <button
                type="button"
                key={option}
                className={weekStartsOn === option ? 'chip active' : 'chip'}
                aria-pressed={weekStartsOn === option}
                onClick={() => onWeekStartsOnChange(option)}
              >
                {option === 'monday' ? 'Monday' : 'Sunday'}
              </button>
            ))}
          </div>
        </div>
      </section>
      <p className="settings-note">Your preferences are saved automatically on this device.</p>
    </div>
  )
}
