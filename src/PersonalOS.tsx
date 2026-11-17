import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Backdrop } from './components/layout/Backdrop'
import { MobileTabBar } from './components/layout/MobileTabBar'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { CalendarPage } from './features/calendar/CalendarPage'
import { FinancesPage } from './features/finances/FinancesPage'
import { GoalsPage } from './features/goals/GoalsPage'
import { HabitsPage } from './features/habits/HabitsPage'
import { HealthPage } from './features/health/HealthPage'
import { JournalPage } from './features/journal/JournalPage'
import { LearningPage } from './features/learning/LearningPage'
import { OverviewPage } from './features/overview/OverviewPage'
import { ProjectsPage } from './features/projects/ProjectsPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TasksPage } from './features/tasks/TasksPage'
import { TimetablePage } from './features/timetable/TimetablePage'
import { usePushReminders } from './hooks/usePushReminders'
import { useStored } from './hooks/useStored'
import { parseBackup } from './lib/backup'
import { getCurrentPushSubscription } from './lib/push'
import { NAV_ITEMS } from './nav'
import type {
  Account,
  CalendarEvent,
  Goal,
  Habit,
  HealthLog,
  LearningItem,
  Note,
  PersonalOSData,
  Project,
  Section,
  SyncState,
  Task,
  Theme,
  TimetableBlock,
  Transaction,
} from './types'

export type { PersonalOSData } from './types'

type Props = {
  account: Account
  onSignOut: (pushEndpoint?: string) => Promise<boolean>
  onSyncData: (data: PersonalOSData) => void
  syncState: SyncState
  syncError: string
  onReloadCloudData: () => Promise<void>
  onRetrySync: () => Promise<void>
  googleButtonRef: RefObject<HTMLDivElement | null>
  googleConfigured: boolean
  googleError: string
  onSettingsOpen: () => void
}

/**
 * The signed-in workspace. It owns all the account's records (saved in this browser and
 * synced by the parent), and shows the page for the selected section.
 */
export default function PersonalOS({ account, onSignOut, onSyncData, syncState, syncError, onReloadCloudData, onRetrySync, googleButtonRef, googleConfigured, googleError, onSettingsOpen }: Props) {
  const [section, setSection] = useState<Section>('Overview')
  const [theme, setTheme] = useStored<Theme>('theme', 'light', account.id)
  const [tasks, setTasks] = useStored<Task[]>('tasks', [], account.id)
  const [projects, setProjects] = useStored<Project[]>('projects', [], account.id)
  const [goals, setGoals] = useStored<Goal[]>('goals', [], account.id)
  const [habits, setHabits] = useStored<Habit[]>('habits', [], account.id)
  const [health, setHealth] = useStored<HealthLog[]>('health', [], account.id)
  const [transactions, setTransactions] = useStored<Transaction[]>('transactions', [], account.id)
  const [learning, setLearning] = useStored<LearningItem[]>('learning', [], account.id)
  const [notes, setNotes] = useStored<Note[]>('notes', [], account.id)
  const [calendarEvents, setCalendarEvents] = useStored<CalendarEvent[]>('calendar-events', [], account.id)
  const [timetable, setTimetable] = useStored<TimetableBlock[]>('timetable', [], account.id)
  const mainRef = useRef<HTMLElement>(null)

  const push = usePushReminders(account.id, calendarEvents)

  // Everything that syncs to the account, gathered in one object.
  const accountData = useMemo<PersonalOSData>(
    () => ({ theme, tasks, projects, goals, habits, health, transactions, learning, notes, calendarEvents, timetable }),
    [theme, tasks, projects, goals, habits, health, transactions, learning, notes, calendarEvents, timetable],
  )
  useEffect(() => {
    onSyncData(accountData)
  }, [accountData, onSyncData])

  // The theme is applied to the whole page so the background and browser colour follow it.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b1020' : '#f4f6f3')
  }, [theme])

  // Start each section at the top.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [section])

  const navigate = (next: Section) => {
    setSection(next)
    if (next === 'Settings') onSettingsOpen()
  }

  const signOutFromWorkspace = async () => {
    try {
      const subscription = await getCurrentPushSubscription()
      const signedOut = await onSignOut(subscription?.endpoint)
      if (signedOut && subscription) await subscription.unsubscribe()
    } catch (error) {
      push.setError(error instanceof Error ? error.message : 'Could not remove push reminders from this device.')
    }
  }

  const exportData = () => {
    const payload = { exportedAt: new Date().toISOString(), ...accountData }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'personal-os-backup.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (file?: File) => {
    if (!file) return
    try {
      const backup = parseBackup(JSON.parse(await file.text()))
      if (!window.confirm('Restore this backup? Sections included in the file will replace the current records on this account.')) return
      if (backup.theme) setTheme(backup.theme)
      if (backup.tasks) setTasks(backup.tasks)
      if (backup.projects) setProjects(backup.projects)
      if (backup.goals) setGoals(backup.goals)
      if (backup.habits) setHabits(backup.habits)
      if (backup.health) setHealth(backup.health)
      if (backup.transactions) setTransactions(backup.transactions)
      if (backup.learning) setLearning(backup.learning)
      if (backup.notes) setNotes(backup.notes)
      if (backup.calendarEvents) setCalendarEvents(backup.calendarEvents)
      if (backup.timetable) setTimetable(backup.timetable)
      window.alert('Your Personal OS backup has been restored.')
    } catch (error) {
      window.alert(error instanceof SyntaxError ? 'This backup file could not be read.' : (error as Error).message)
    }
  }

  const title = NAV_ITEMS.find(item => item.id === section)?.label ?? section

  let page
  switch (section) {
    case 'Overview':
    case 'Today':
      page = (
        <OverviewPage
          mode={section}
          tasks={tasks}
          setTasks={setTasks}
          projects={projects}
          goals={goals}
          habits={habits}
          health={health}
          learning={learning}
          transactions={transactions}
          notes={notes}
          timetable={timetable}
          setTimetable={setTimetable}
          onNavigate={navigate}
        />
      )
      break
    case 'Timetable':
      page = <TimetablePage timetable={timetable} setTimetable={setTimetable} />
      break
    case 'Calendar':
      page = <CalendarPage calendarEvents={calendarEvents} setCalendarEvents={setCalendarEvents} />
      break
    case 'Tasks':
      page = <TasksPage tasks={tasks} setTasks={setTasks} />
      break
    case 'Projects':
      page = <ProjectsPage projects={projects} setProjects={setProjects} />
      break
    case 'Goals':
      page = <GoalsPage goals={goals} setGoals={setGoals} />
      break
    case 'Habits':
      page = <HabitsPage habits={habits} setHabits={setHabits} />
      break
    case 'Health':
      page = <HealthPage health={health} setHealth={setHealth} />
      break
    case 'Finances':
      page = <FinancesPage transactions={transactions} setTransactions={setTransactions} />
      break
    case 'Learning':
      page = <LearningPage learning={learning} setLearning={setLearning} />
      break
    case 'Journal':
    case 'Clarity':
      page = <JournalPage kind={section} notes={notes} setNotes={setNotes} />
      break
    case 'Settings':
      page = (
        <SettingsPage
          account={account}
          theme={theme}
          onThemeChange={setTheme}
          onSignOut={() => void signOutFromWorkspace()}
          syncState={syncState}
          syncError={syncError}
          onReloadCloudData={onReloadCloudData}
          onRetrySync={onRetrySync}
          googleButtonRef={googleButtonRef}
          googleConfigured={googleConfigured}
          googleError={googleError}
          push={push}
          onExport={exportData}
          onImport={file => void importData(file)}
        />
      )
      break
  }

  return (
    <div className="personal-os">
      <Backdrop dark={theme === 'dark'} />
      <Sidebar section={section} email={account.email} onSelect={navigate} onSignOut={() => void signOutFromWorkspace()} />
      <main className="po-main" ref={mainRef}>
        <TopBar
          title={title}
          sectionLabel={title}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onNewTask={() => navigate('Tasks')}
          onSignOut={() => void signOutFromWorkspace()}
        />
        <div className="po-content" key={section}>{page}</div>
        <footer className="po-footer">Personal OS <span>·</span> Your life is a work in progress.</footer>
      </main>
      <MobileTabBar section={section} onSelect={navigate} />
    </div>
  )
}
