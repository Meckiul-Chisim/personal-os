import { useEffect, useMemo, useRef, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from 'react'
import MobileTabBar from './components/MobileTabBar'
import './PersonalOS.css'

type Section = 'Overview' | 'Today' | 'Calendar' | 'Tasks' | 'Projects' | 'Goals' | 'Habits' | 'Health' | 'Learning' | 'Finances' | 'Journal' | 'Clarity' | 'Settings'
type Task = { id: string; title: string; area: string; due: string; priority: 'Low' | 'Medium' | 'High'; done: boolean; createdAt: string }
type Project = { id: string; name: string; area: string; status: 'Active' | 'On hold' | 'Completed'; progress: number; next: string }
type Goal = { id: string; title: string; area: string; target: string; progress: number }
type Habit = { id: string; name: string; frequency: string; doneDates: string[] }
type HealthLog = { id: string; date: string; sleep: number; water: number; movement: number; mood: string; note: string }
type Transaction = { id: string; title: string; amount: number; type: 'Income' | 'Expense'; category: string; date: string }
type LearningItem = { id: string; title: string; topic: string; status: 'To learn' | 'Learning' | 'Completed'; minutes: number }
type Note = { id: string; title: string; body: string; kind: 'Journal' | 'Clarity'; date: string }
type CalendarEvent = { id: string; title: string; date: string; time: string; note: string; color?: string }

const nav: { id: Section; label: string; icon: string; group: string }[] = [
  { id: 'Overview', label: 'Overview', icon: '⌂', group: 'Workspace' },
  { id: 'Today', label: 'My day', icon: '◷', group: 'Workspace' },
  { id: 'Calendar', label: 'Calendar', icon: '◫', group: 'Workspace' },
  { id: 'Tasks', label: 'Tasks', icon: '☷', group: 'Workspace' },
  { id: 'Projects', label: 'Projects', icon: '▤', group: 'Workspace' },
  { id: 'Goals', label: 'Goals & growth', icon: '◎', group: 'Personal' },
  { id: 'Habits', label: 'Habits', icon: '↗', group: 'Personal' },
  { id: 'Health', label: 'Health & fitness', icon: '＋', group: 'Personal' },
  { id: 'Learning', label: 'Learning', icon: '▱', group: 'Personal' },
  { id: 'Finances', label: 'Finances', icon: '₹', group: 'Personal' },
  { id: 'Journal', label: 'Journal', icon: '≡', group: 'Personal' },
  { id: 'Settings', label: 'Settings', icon: '⚙', group: 'System' },
]

const today = () => { const date = new Date(); return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') }
const dateKey = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
const eventTextColor = (color: string) => {
  const hex = color.replace('#', '')
  if (!/^[\da-f]{6}$/i.test(hex)) return '#ffffff'

  const luminanceChannel = (index: number) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * luminanceChannel(0) + 0.7152 * luminanceChannel(2) + 0.0722 * luminanceChannel(4)
  return luminance > 0.179 ? '#20251f' : '#ffffff'
}
const apiError = async (response: Response) => {
  let message = `Push service request failed (${response.status}).`
  try {
    const body: { error?: unknown } = await response.json()
    if (typeof body.error === 'string') message = body.error
  } catch {
    message = `Could not read the push service response (${response.status}).`
  }
  return new Error(message)
}
const decodeApplicationServerKey = (key: string) => {
  const padding = '='.repeat((4 - key.length % 4) % 4)
  const base64 = (key + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(window.atob(base64), character => character.charCodeAt(0))
}
const syncPushCalendarEvents = async (token: string, events: CalendarEvent[]) => {
  const response = await fetch('/api/calendar-events', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        note: event.note,
        eventAt: new Date(`${event.date}T${event.time}`).getTime(),
      })),
    }),
  })
  if (!response.ok) throw await apiError(response)
}
const uid = () => crypto.randomUUID()
function useStored<T,>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try { const saved = localStorage.getItem('personal-os:' + key); return saved ? JSON.parse(saved) as T : initial }
    catch { return initial }
  })
  useEffect(() => { localStorage.setItem('personal-os:' + key, JSON.stringify(value)) }, [key, value])
  return [value, setValue] as const
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="po-field"><span>{label}</span>{children}</label>
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="po-empty"><span className="po-empty-mark">＋</span><strong>{title}</strong><p>{detail}</p></div>
}
function Panel({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={'po-panel ' + className}><div className="po-panel-head"><h2>{title}</h2>{action}</div>{children}</section>
}

export default function PersonalOS() {
  const [section, setSection] = useState<Section>('Overview')
  const [theme, setTheme] = useStored<'light' | 'dark'>('theme', 'light')
  const [tasks, setTasks] = useStored<Task[]>('tasks', [])
  const [projects, setProjects] = useStored<Project[]>('projects', [])
  const [goals, setGoals] = useStored<Goal[]>('goals', [])
  const [habits, setHabits] = useStored<Habit[]>('habits', [])
  const [health, setHealth] = useStored<HealthLog[]>('health', [])
  const [transactions, setTransactions] = useStored<Transaction[]>('transactions', [])
  const [learning, setLearning] = useStored<LearningItem[]>('learning', [])
  const [notes, setNotes] = useStored<Note[]>('notes', [])
  const [calendarEvents, setCalendarEvents] = useStored<CalendarEvent[]>('calendar-events', [])
  const [pushSessionToken, setPushSessionToken] = useStored<string>('push-session', '')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskArea, setTaskArea] = useState('Personal')
  const [taskDue, setTaskDue] = useState(today())
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('Medium')
  const [projectName, setProjectName] = useState('')
  const [projectArea, setProjectArea] = useState('Work')
  const [goalTitle, setGoalTitle] = useState('')
  const [habitName, setHabitName] = useState('')
  const [healthSleep, setHealthSleep] = useState('8')
  const [healthWater, setHealthWater] = useState('6')
  const [healthMovement, setHealthMovement] = useState('30')
  const [healthMood, setHealthMood] = useState('Good')
  const [healthNote, setHealthNote] = useState('')
  const [moneyTitle, setMoneyTitle] = useState('')
  const [moneyAmount, setMoneyAmount] = useState('')
  const [moneyType, setMoneyType] = useState<Transaction['type']>('Expense')
  const [moneyCategory, setMoneyCategory] = useState('General')
  const [calendarTitle, setCalendarTitle] = useState('')
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(today())
  const [visibleCalendarMonth, setVisibleCalendarMonth] = useState(() => {
    const date = new Date()
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const [calendarTime, setCalendarTime] = useState('09:00')
  const [calendarColor, setCalendarColor] = useState('#4e735b')
  const [calendarNote, setCalendarNote] = useState('')
  const [editingCalendarEventId, setEditingCalendarEventId] = useState<string | null>(null)
  const calendarFormRef = useRef<HTMLFormElement>(null)
  const pushSyncQueueRef = useRef<Promise<void>>(Promise.resolve())
  const [pushPassword, setPushPassword] = useState('')
  const [pushStatus, setPushStatus] = useState<'off' | 'checking' | 'on' | 'error'>(pushSessionToken ? 'checking' : 'off')
  const [pushError, setPushError] = useState('')
  const [learnTitle, setLearnTitle] = useState('')
  const [learnTopic, setLearnTopic] = useState('Technology')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [search, setSearch] = useState('')

  const completed = tasks.filter(t => t.done).length
  const openTasks = tasks.filter(t => !t.done)
  const income = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0)
  const todayTasks = tasks.filter(t => !t.done && t.due <= today())
  const filteredTasks = useMemo(() => tasks.filter(t => (t.title + t.area).toLowerCase().includes(search.toLowerCase())), [tasks, search])
  const calendarDates = useMemo(() => {
    const firstOfMonth = new Date(visibleCalendarMonth.getFullYear(), visibleCalendarMonth.getMonth(), 1)
    const weekdayOffset = firstOfMonth.getDay()

    return Array.from({ length: 42 }, (_, index) =>
      new Date(visibleCalendarMonth.getFullYear(), visibleCalendarMonth.getMonth(), index - weekdayOffset + 1),
    )
  }, [visibleCalendarMonth])
  const selectedDayEvents = calendarEvents
    .filter(event => event.date === selectedCalendarDate)
    .sort((first, second) => first.time.localeCompare(second.time))
  const eventsByDate = calendarEvents.reduce<Record<string, CalendarEvent[]>>((events, event) => {
    events[event.date] = [...(events[event.date] ?? []), event]
    return events
  }, {})

  const selectCalendarDate = (date: string) => {
    setSelectedCalendarDate(date)
    const selected = new Date(`${date}T00:00:00`)
    setVisibleCalendarMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
  }

  const queuePushCalendarSync = (token: string, events: CalendarEvent[]) => {
    const queuedSync = pushSyncQueueRef.current
      .catch(() => undefined)
      .then(() => syncPushCalendarEvents(token, events))
    pushSyncQueueRef.current = queuedSync
    return queuedSync
  }

  useEffect(() => {
    if (!pushSessionToken) return
    let cancelled = false
    queuePushCalendarSync(pushSessionToken, calendarEvents)
      .then(() => {
        if (cancelled) return
        setPushStatus('on')
        setPushError('')
      })
      .catch(error => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Could not sync calendar reminders.'
        setPushStatus('error')
        setPushError(message)
        if (message.includes('(401)')) setPushSessionToken('')
      })
    return () => { cancelled = true }
  }, [calendarEvents, pushSessionToken, setPushSessionToken])

  const enablePushNotifications = async () => {
    setPushError('')
    setPushStatus('checking')

    try {
      if (!window.isSecureContext) {
        throw new Error('Push notifications require HTTPS, or localhost for local development.')
      }
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        throw new Error('This browser does not support web push notifications.')
      }
      if (!pushPassword.trim()) {
        throw new Error('Enter the push access password configured on the server.')
      }

      let permission = Notification.permission
      if (permission === 'default') permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Allow notifications in your browser settings to receive event reminders.')
      }

      const configResponse = await fetch('/api/push/config')
      if (!configResponse.ok) throw await apiError(configResponse)
      const config: { configured: boolean; missing: string[]; publicKey: string | null } = await configResponse.json()
      if (!config.configured || !config.publicKey) {
        throw new Error(`The push server is not configured. Missing: ${config.missing.join(', ') || 'VAPID keys'}.`)
      }

      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pushPassword }),
      })
      if (!loginResponse.ok) throw await apiError(loginResponse)
      const login: { token: string } = await loginResponse.json()

      await navigator.serviceWorker.register('/sw.js')
      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeApplicationServerKey(config.publicKey),
        })
      }

      const subscriptionResponse = await fetch('/api/push/subscription', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${login.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })
      if (!subscriptionResponse.ok) throw await apiError(subscriptionResponse)

      await queuePushCalendarSync(login.token, calendarEvents)
      setPushSessionToken(login.token)
      setPushPassword('')
      setPushStatus('on')
    } catch (error) {
      setPushStatus('error')
      setPushError(error instanceof Error ? error.message : 'Could not enable push notifications.')
    }
  }

  const disablePushNotifications = async () => {
    setPushError('')
    setPushStatus('checking')

    try {
      const registration = await navigator.serviceWorker.getRegistration('/')
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        const response = await fetch('/api/push/subscription', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${pushSessionToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        if (!response.ok) throw await apiError(response)
        await subscription.unsubscribe()
      }

      setPushSessionToken('')
      setPushStatus('off')
    } catch (error) {
      setPushStatus('error')
      setPushError(error instanceof Error ? error.message : 'Could not turn off push notifications.')
    }
  }

  const retryPushSync = async () => {
    setPushError('')
    setPushStatus('checking')
    try {
      await queuePushCalendarSync(pushSessionToken, calendarEvents)
      setPushStatus('on')
    } catch (error) {
      setPushStatus('error')
      setPushError(error instanceof Error ? error.message : 'Could not sync calendar reminders.')
    }
  }

  const addTask = (event: FormEvent) => {
    event.preventDefault()
    if (!taskTitle.trim()) return
    setTasks(current => [{ id: uid(), title: taskTitle.trim(), area: taskArea, due: taskDue, priority: taskPriority, done: false, createdAt: today() }, ...current])
    setTaskTitle('')
  }
  const addProject = (event: FormEvent) => {
    event.preventDefault()
    if (!projectName.trim()) return
    setProjects(current => [{ id: uid(), name: projectName.trim(), area: projectArea, status: 'Active', progress: 0, next: '' }, ...current])
    setProjectName('')
  }
  const addGoal = (event: FormEvent) => {
    event.preventDefault()
    if (!goalTitle.trim()) return
    setGoals(current => [{ id: uid(), title: goalTitle.trim(), area: 'Personal', target: '', progress: 0 }, ...current])
    setGoalTitle('')
  }
  const addHabit = (event: FormEvent) => {
    event.preventDefault()
    if (!habitName.trim()) return
    setHabits(current => [{ id: uid(), name: habitName.trim(), frequency: 'Daily', doneDates: [] }, ...current])
    setHabitName('')
  }
  const addHealth = (event: FormEvent) => {
    event.preventDefault()
    setHealth(current => [{ id: uid(), date: today(), sleep: Number(healthSleep), water: Number(healthWater), movement: Number(healthMovement), mood: healthMood, note: healthNote }, ...current.filter(log => log.date !== today())])
    setHealthNote('')
  }
  const addTransaction = (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(moneyAmount)
    if (!moneyTitle.trim() || !Number.isFinite(amount) || amount <= 0) return
    setTransactions(current => [{ id: uid(), title: moneyTitle.trim(), amount, type: moneyType, category: moneyCategory, date: today() }, ...current])
    setMoneyTitle('')
    setMoneyAmount('')
  }
  const addLearning = (event: FormEvent) => {
    event.preventDefault()
    if (!learnTitle.trim()) return
    setLearning(current => [{ id: uid(), title: learnTitle.trim(), topic: learnTopic, status: 'To learn', minutes: 0 }, ...current])
    setLearnTitle('')
  }
  const addNote = (event: FormEvent, kindToSave: Note['kind']) => {
    event.preventDefault()
    if (!noteTitle.trim() && !noteBody.trim()) return
    setNotes(current => [{ id: uid(), title: noteTitle.trim() || 'Untitled', body: noteBody.trim(), kind: kindToSave, date: today() }, ...current])
    setNoteTitle('')
    setNoteBody('')
  }
  const addCalendarEntry = (event: FormEvent) => {
    event.preventDefault()
    const trimmedTitle = calendarTitle.trim()
    if (!trimmedTitle) return

    const nextEvent: CalendarEvent = {
      id: editingCalendarEventId ?? uid(),
      title: trimmedTitle,
      date: selectedCalendarDate,
      time: calendarTime || '09:00',
      note: calendarNote.trim(),
      color: calendarColor,
    }

    setCalendarEvents(current => (editingCalendarEventId
      ? current.map(calendarEvent => calendarEvent.id === editingCalendarEventId ? nextEvent : calendarEvent)
      : [...current, nextEvent]).sort((first, second) => {
      const firstValue = new Date(`${first.date}T${first.time}`).getTime()
      const secondValue = new Date(`${second.date}T${second.time}`).getTime()
      return firstValue - secondValue
    }))

    setEditingCalendarEventId(null)
    setCalendarTitle('')
    setCalendarNote('')
    setCalendarTime('09:00')
    setCalendarColor('#4e735b')
  }
  const editCalendarEvent = (calendarEvent: CalendarEvent) => {
    setEditingCalendarEventId(calendarEvent.id)
    setCalendarTitle(calendarEvent.title)
    selectCalendarDate(calendarEvent.date)
    setCalendarTime(calendarEvent.time)
    setCalendarColor(calendarEvent.color || '#4e735b')
    setCalendarNote(calendarEvent.note)
    calendarFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
  const cancelCalendarEventEdit = () => {
    setEditingCalendarEventId(null)
    setCalendarTitle('')
    setCalendarNote('')
    setCalendarTime('09:00')
    setCalendarColor('#4e735b')
  }
  const toggleHabit = (habit: Habit) => setHabits(current => current.map(h => h.id === habit.id ? { ...h, doneDates: h.doneDates.includes(today()) ? h.doneDates.filter(d => d !== today()) : [...h.doneDates, today()] } : h))
  const exportData = () => {
    const payload = { exportedAt: new Date().toISOString(), tasks, projects, goals, habits, health, transactions, learning, notes, calendarEvents, theme }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'personal-os-backup.json'; link.click(); URL.revokeObjectURL(url)
  }
  const importData = async (file?: File) => {
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!data || typeof data !== 'object') throw new Error('Invalid backup')
      if (Array.isArray(data.tasks)) setTasks(data.tasks)
      if (Array.isArray(data.projects)) setProjects(data.projects)
      if (Array.isArray(data.goals)) setGoals(data.goals)
      if (Array.isArray(data.habits)) setHabits(data.habits)
      if (Array.isArray(data.health)) setHealth(data.health)
      if (Array.isArray(data.transactions)) setTransactions(data.transactions)
      if (Array.isArray(data.learning)) setLearning(data.learning)
      if (Array.isArray(data.notes)) setNotes(data.notes)
      if (Array.isArray(data.calendarEvents)) setCalendarEvents(data.calendarEvents)
      window.alert('Your Personal OS backup has been restored.')
    } catch { window.alert('This backup file could not be read.') }
  }

  const remove = <T extends { id: string }>(setter: Dispatch<SetStateAction<T[]>>, id: string) => setter(items => items.filter(item => item.id !== id))
  const title = nav.find(item => item.id === section)?.label ?? section
  const taskForm = <form className="po-form po-task-form" onSubmit={addTask}>
    <Field label="Task name"><input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="What needs to get done?" /></Field>
    <Field label="Area"><select value={taskArea} onChange={e => setTaskArea(e.target.value)}><option>Personal</option><option>Work</option><option>Business</option><option>Health</option><option>Learning</option><option>Finance</option></select></Field>
    <Field label="Due date"><input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} /></Field>
    <Field label="Priority"><select value={taskPriority} onChange={e => setTaskPriority(e.target.value as Task['priority'])}><option>Low</option><option>Medium</option><option>High</option></select></Field>
    <button className="po-primary" type="submit">Add task</button>
  </form>

  const renderTasks = (items: Task[]) => items.length ? <div className="po-list">{items.map(task => <div className={'po-list-row' + (task.done ? ' is-done' : '')} key={task.id}>
    <button className="po-check" aria-label={task.done ? 'Mark incomplete' : 'Complete task'} onClick={() => setTasks(current => current.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}>{task.done ? '✓' : ''}</button>
    <div className="po-row-main"><strong>{task.title}</strong><small>{task.area} · Due {task.due || 'No date'} · {task.priority} priority</small></div>
    <button className="po-icon-btn" aria-label="Delete task" onClick={() => remove(setTasks, task.id)}>×</button>
  </div>)}</div> : <Empty title="Nothing here yet" detail="Add a task when something needs your attention. Your list will grow from your real entries." />

  let page: ReactNode
  if (section === 'Overview' || section === 'Today') {
    page = <div className="po-page-grid">
      <section className="po-welcome"><div><span className="po-kicker">{section === 'Today' ? 'DAILY RESET' : 'YOUR PERSONAL OPERATING SYSTEM'}</span><h2>{section === 'Today' ? 'Make today count.' : 'A clearer view of your life.'}</h2><p>{section === 'Today' ? 'Choose what matters, make progress, and leave room to reset.' : 'Bring your work, personal goals, health and growth into one calm workspace.'}</p></div><div className="po-date">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div></section>
      <div className="po-stats">
        <div className="po-stat"><span>Open tasks</span><strong>{openTasks.length}</strong><small>{completed} completed overall</small></div>
        <div className="po-stat"><span>Active projects</span><strong>{projects.filter(p => p.status === 'Active').length}</strong><small>{projects.length} total projects</small></div>
        <div className="po-stat"><span>Goals in motion</span><strong>{goals.length}</strong><small>Personal milestones</small></div>
        <div className="po-stat"><span>Today's habits</span><strong>{habits.filter(h => h.doneDates.includes(today())).length}/{habits.length}</strong><small>Consistency, not perfection</small></div>
      </div>
      <Panel title={section === 'Today' ? 'Due today and overdue' : 'Your next actions'} action={<button className="po-text-btn" onClick={() => setSection('Tasks')}>All tasks →</button>}>{renderTasks(section === 'Today' ? todayTasks : openTasks.slice(0, 5))}</Panel>
      <Panel title="Life areas"><div className="po-area-grid">{[{name:'Work & business',desc:'Projects, execution and delivery',count:projects.length,section:'Projects' as Section},{name:'Health & fitness',desc:'Check-ins and physical wellbeing',count:health.length,section:'Health' as Section},{name:'Learning',desc:'Skills and deliberate practice',count:learning.length,section:'Learning' as Section},{name:'Money',desc:'Income, spending and awareness',count:transactions.length,section:'Finances' as Section}].map(area => <button className="po-area-card" key={area.name} onClick={() => setSection(area.section)}><strong>{area.name}</strong><span>{area.desc}</span><small>{area.count} records <b>↗</b></small></button>)}</div></Panel>
      <Panel title="Recent notes" action={<button className="po-text-btn" onClick={() => setSection('Journal')}>Open journal →</button>}>{notes.length ? <div className="po-note-list">{notes.slice(0,3).map(note => <article key={note.id}><span>{note.kind} · {note.date}</span><strong>{note.title}</strong><p>{note.body}</p></article>)}</div> : <Empty title="Give your thoughts a home" detail="Capture an idea, reflection or decision in your journal or clarity space." />}</Panel>
    </div>
  } else if (section === 'Calendar') {
    page = <div className="po-calendar-layout">
      <Panel
        title={visibleCalendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        className="po-calendar-panel"
        action={<div className="po-calendar-controls">
          <button type="button" className="po-calendar-control" aria-label="Previous month" onClick={() => {
            const previousMonth = new Date(visibleCalendarMonth.getFullYear(), visibleCalendarMonth.getMonth() - 1, 1)
            setVisibleCalendarMonth(previousMonth)
            setSelectedCalendarDate(dateKey(previousMonth))
          }}>‹</button>
          <button type="button" className="po-calendar-today" onClick={() => selectCalendarDate(today())}>Today</button>
          <button type="button" className="po-calendar-control" aria-label="Next month" onClick={() => {
            const nextMonth = new Date(visibleCalendarMonth.getFullYear(), visibleCalendarMonth.getMonth() + 1, 1)
            setVisibleCalendarMonth(nextMonth)
            setSelectedCalendarDate(dateKey(nextMonth))
          }}>›</button>
        </div>}
      >
        <div className="po-calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div className="po-calendar-weekday" key={day}>{day}</div>)}
          {calendarDates.map(date => {
            const key = dateKey(date)
            const dayEvents = eventsByDate[key] ?? []
            const isCurrentMonth = date.getMonth() === visibleCalendarMonth.getMonth()
            const isSelected = key === selectedCalendarDate

            return <button
              type="button"
              key={key}
              className={`po-calendar-day${isCurrentMonth ? '' : ' outside'}${isSelected ? ' selected' : ''}${key === today() ? ' is-today' : ''}`}
              aria-pressed={isSelected}
              aria-label={`${date.toLocaleDateString(undefined, { dateStyle: 'full' })}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}` : ''}`}
              onClick={() => selectCalendarDate(key)}
            >
              <span className="po-calendar-day-number">{date.getDate()}</span>
              <span className="po-calendar-events">
                {dayEvents.slice(0, 2).map(calendarEvent => {
                  const color = calendarEvent.color || '#4e735b'
                  return <span className="po-calendar-event-chip" key={calendarEvent.id} style={{ backgroundColor: color, color: eventTextColor(color) }}>{calendarEvent.title}</span>
                })}
                {dayEvents.length > 2 && <span className="po-calendar-more">+{dayEvents.length - 2} more</span>}
              </span>
              {dayEvents.length > 0 && <span className="po-calendar-event-dot" style={{ backgroundColor: dayEvents[0]?.color || '#4e735b' }} aria-hidden="true" />}
            </button>
          })}
        </div>
      </Panel>

      <aside className="po-calendar-side">
        <Panel title={editingCalendarEventId ? 'Edit event' : 'Add an event'}>
          <form ref={calendarFormRef} className="po-calendar-form" onSubmit={addCalendarEntry}>
            <Field label="Event name"><input value={calendarTitle} onChange={e => setCalendarTitle(e.target.value)} placeholder="e.g. Team check-in" required /></Field>
            <Field label="Date"><input type="date" value={selectedCalendarDate} onChange={e => e.target.value && selectCalendarDate(e.target.value)} required /></Field>
            <Field label="Time"><input type="time" value={calendarTime} onChange={e => setCalendarTime(e.target.value)} required /></Field>
            <Field label="Event color"><input type="color" value={calendarColor} onChange={e => setCalendarColor(e.target.value)} /></Field>
            <Field label="Notes"><input value={calendarNote} onChange={e => setCalendarNote(e.target.value)} placeholder="Optional location or details" /></Field>
            <div className="po-calendar-form-actions">
              {editingCalendarEventId && <button className="po-secondary" type="button" onClick={cancelCalendarEventEdit}>Cancel</button>}
              <button className="po-primary" type="submit">{editingCalendarEventId ? 'Save changes' : '＋ Add event'}</button>
            </div>
          </form>
        </Panel>
        <Panel title={new Date(`${selectedCalendarDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} action={<span className="po-muted">{selectedDayEvents.length} events</span>}>
          {selectedDayEvents.length ? <div className="po-list">{selectedDayEvents.map(calendarEvent => <div className="po-list-row" key={calendarEvent.id}><time className="po-calendar-event-time">{calendarEvent.time}</time><div className="po-row-main"><strong>{calendarEvent.title}</strong>{calendarEvent.note && <small>{calendarEvent.note}</small>}</div><button type="button" className="po-icon-btn" aria-label={`Edit ${calendarEvent.title}`} onClick={() => editCalendarEvent(calendarEvent)}>✎</button><button type="button" className="po-icon-btn" aria-label={`Delete ${calendarEvent.title}`} onClick={() => { remove(setCalendarEvents, calendarEvent.id); if (editingCalendarEventId === calendarEvent.id) cancelCalendarEventEdit() }}>×</button></div>)}</div> : <p className="po-calendar-empty">Nothing planned for this day. Add an event to get started.</p>}
        </Panel>
      </aside>
    </div>
  } else if (section === 'Tasks') {
    page = <><Panel title="Capture a task">{taskForm}</Panel><Panel title="Your task list" action={<span className="po-muted">{tasks.length} total</span>}><div className="po-search"><input placeholder="Search tasks or areas…" value={search} onChange={e => setSearch(e.target.value)} /></div>{renderTasks(filteredTasks)}</Panel></>
  } else if (section === 'Projects') {
    page = <><Panel title="Create a project"><form className="po-form" onSubmit={addProject}><Field label="Project name"><input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Build my portfolio" /></Field><Field label="Area"><select value={projectArea} onChange={e => setProjectArea(e.target.value)}><option>Work</option><option>Business</option><option>Personal</option><option>Learning</option><option>Health</option></select></Field><button className="po-primary">Create project</button></form></Panel><div className="po-card-grid">{projects.map(p => <article className="po-panel po-project" key={p.id}><div className="po-project-top"><span className="po-tag">{p.area}</span><button className="po-icon-btn" onClick={() => remove(setProjects, p.id)}>×</button></div><h3>{p.name}</h3><span className="po-muted">{p.status}</span><div className="po-progress"><span style={{width:p.progress+'%'}} /></div><div className="po-progress-line"><small>Progress</small><strong>{p.progress}%</strong></div><input aria-label={'Progress for '+p.name} type="range" min="0" max="100" value={p.progress} onChange={e => setProjects(current => current.map(x => x.id === p.id ? {...x,progress:Number(e.target.value),status:Number(e.target.value)===100?'Completed':x.status==='Completed'?'Active':x.status} : x))} /></article>)}</div>{!projects.length && <Empty title="Start with one project" detail="Track a business, work stream or personal project from idea to completion." />}</>
  } else if (section === 'Goals') {
    page = <><Panel title="Set a meaningful goal"><form className="po-form" onSubmit={addGoal}><Field label="Goal"><input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="What do you want to achieve?" /></Field><button className="po-primary">Add goal</button></form></Panel><Panel title="Goals & milestones">{goals.length ? <div className="po-list">{goals.map(g => <div className="po-goal" key={g.id}><div className="po-row-main"><strong>{g.title}</strong><small>{g.area}</small><div className="po-progress"><span style={{width:g.progress+'%'}} /></div></div><input aria-label={'Goal progress for '+g.title} type="range" min="0" max="100" value={g.progress} onChange={e => setGoals(current => current.map(x => x.id===g.id?{...x,progress:Number(e.target.value)}:x))}/><b>{g.progress}%</b><button className="po-icon-btn" onClick={() => remove(setGoals,g.id)}>×</button></div>)}</div> : <Empty title="No goals defined" detail="Add outcomes that matter over months, not just tasks for today." />}</Panel></>
  } else if (section === 'Habits') {
    page = <><Panel title="Build a routine"><form className="po-form" onSubmit={addHabit}><Field label="Habit name"><input value={habitName} onChange={e => setHabitName(e.target.value)} placeholder="e.g. 20 minutes of reading" /></Field><button className="po-primary">Add habit</button></form></Panel><Panel title="Daily check-off"><p className="po-hint">Mark each habit when you complete it. Your check-ins are saved by date.</p>{habits.length ? <div className="po-list">{habits.map(h => <div className="po-list-row" key={h.id}><button className={'po-check'+(h.doneDates.includes(today())?' checked':'')} onClick={() => toggleHabit(h)}>{h.doneDates.includes(today())?'✓':''}</button><div className="po-row-main"><strong>{h.name}</strong><small>{h.doneDates.length} check-ins · Daily</small></div><button className="po-icon-btn" onClick={() => remove(setHabits,h.id)}>×</button></div>)}</div> : <Empty title="Start small" detail="Add one repeatable action. Build consistency before adding more." />}</Panel></>
  } else if (section === 'Health') {
    page = <><Panel title="Daily health check-in"><form className="po-form po-health-form" onSubmit={addHealth}><Field label="Sleep (hours)"><input type="number" min="0" max="24" step=".5" value={healthSleep} onChange={e => setHealthSleep(e.target.value)} /></Field><Field label="Water (glasses)"><input type="number" min="0" max="30" value={healthWater} onChange={e => setHealthWater(e.target.value)} /></Field><Field label="Movement (minutes)"><input type="number" min="0" max="1440" value={healthMovement} onChange={e => setHealthMovement(e.target.value)} /></Field><Field label="Mood"><select value={healthMood} onChange={e => setHealthMood(e.target.value)}><option>Great</option><option>Good</option><option>Okay</option><option>Low</option><option>Stressed</option></select></Field><Field label="Notes"><input value={healthNote} onChange={e => setHealthNote(e.target.value)} placeholder="Workout, energy, how you feel…" /></Field><button className="po-primary">Save today's check-in</button></form></Panel><Panel title="Health history">{health.length ? <div className="po-list">{health.map(log => <div className="po-health-row" key={log.id}><strong>{log.date}</strong><span>{log.sleep}h sleep</span><span>{log.water} glasses</span><span>{log.movement} min movement</span><span>{log.mood}</span></div>)}</div> : <Empty title="Your health timeline starts here" detail="No health records are pre-filled. Save a daily check-in to build your own history." />}</Panel></>
  } else if (section === 'Finances') {
    page = <><div className="po-stats"><div className="po-stat"><span>Recorded income</span><strong>₹{income.toLocaleString('en-IN')}</strong></div><div className="po-stat"><span>Recorded expenses</span><strong>₹{expenses.toLocaleString('en-IN')}</strong></div><div className="po-stat"><span>Net recorded</span><strong className={income-expenses<0?'po-negative':''}>₹{(income-expenses).toLocaleString('en-IN')}</strong></div></div><Panel title="Record a transaction"><form className="po-form" onSubmit={addTransaction}><Field label="Description"><input value={moneyTitle} onChange={e => setMoneyTitle(e.target.value)} placeholder="What was this for?" /></Field><Field label="Amount (₹)"><input type="number" min="0.01" step=".01" value={moneyAmount} onChange={e => setMoneyAmount(e.target.value)} placeholder="0.00" /></Field><Field label="Type"><select value={moneyType} onChange={e => setMoneyType(e.target.value as Transaction['type'])}><option>Expense</option><option>Income</option></select></Field><Field label="Category"><input value={moneyCategory} onChange={e => setMoneyCategory(e.target.value)} /></Field><button className="po-primary">Save transaction</button></form></Panel><Panel title="Transaction history">{transactions.length ? <div className="po-list">{transactions.map(t => <div className="po-list-row" key={t.id}><div className="po-row-main"><strong>{t.title}</strong><small>{t.category} · {t.date}</small></div><b className={t.type==='Income'?'po-positive':'po-negative'}>{t.type==='Income'?'+':'−'}₹{t.amount.toLocaleString('en-IN')}</b><button className="po-icon-btn" onClick={() => remove(setTransactions,t.id)}>×</button></div>)}</div> : <Empty title="No transactions yet" detail="Record income and spending to build a personal money history. Nothing is connected to your bank." />}</Panel></>
  } else if (section === 'Learning') {
    page = <><Panel title="Add something to learn"><form className="po-form" onSubmit={addLearning}><Field label="Skill or topic"><input value={learnTitle} onChange={e => setLearnTitle(e.target.value)} placeholder="e.g. TypeScript fundamentals" /></Field><Field label="Category"><select value={learnTopic} onChange={e => setLearnTopic(e.target.value)}><option>Technology</option><option>Business</option><option>Creative</option><option>Communication</option><option>Personal growth</option></select></Field><button className="po-primary">Add to learning list</button></form></Panel><Panel title="Learning roadmap">{learning.length ? <div className="po-list">{learning.map(item => <div className="po-list-row" key={item.id}><div className="po-row-main"><strong>{item.title}</strong><small>{item.topic} · {item.minutes} minutes logged</small></div><select aria-label={'Status for '+item.title} value={item.status} onChange={e => setLearning(current => current.map(x => x.id===item.id?{...x,status:e.target.value as LearningItem['status']}:x))}><option>To learn</option><option>Learning</option><option>Completed</option></select><button className="po-icon-btn" onClick={() => remove(setLearning,item.id)}>×</button></div>)}</div> : <Empty title="Choose your next skill" detail="Collect the skills and subjects you want to study. Track status as you progress." />}</Panel></>
  } else if (section === 'Journal' || section === 'Clarity') {
    const kind: Note['kind'] = section === 'Journal' ? 'Journal' : 'Clarity'
    const entries = notes.filter(n => n.kind === kind)
    page = <><Panel title={section === 'Journal' ? 'Write a journal entry' : 'Clear your mind'}><form className="po-note-form" onSubmit={event => addNote(event, kind)}><Field label="Title"><input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder={section === 'Journal'?'A moment worth remembering':'What is on your mind?'} /></Field><Field label="Your thoughts"><textarea rows={5} value={noteBody} onChange={e => setNoteBody(e.target.value)} placeholder={section === 'Journal'?'Reflect on your day…':'Capture loose thoughts, decisions, blockers or ideas…'} /></Field><div className="po-form-end"><span className="po-muted">Saved on this device</span><button className="po-primary" type="submit">Save entry</button></div></form></Panel><Panel title={section === 'Journal' ? 'Your journal' : 'Clarity archive'}>{entries.length ? <div className="po-note-list">{entries.map(n => <article key={n.id}><div className="po-note-top"><span>{n.date}</span><button className="po-icon-btn" onClick={() => remove(setNotes,n.id)}>×</button></div><strong>{n.title}</strong><p>{n.body}</p></article>)}</div> : <Empty title={section === 'Journal'?'Your story starts with one entry':'Make space to think'} detail="Your writing is private to this browser profile and is not sent to a server." />}</Panel></>
  } else {
    const pushStatusLabel = pushStatus === 'checking'
      ? 'Connecting and syncing reminders…'
      : pushStatus === 'on'
        ? 'Push reminders are enabled'
        : pushStatus === 'error'
          ? 'Push reminders need attention'
          : 'Push reminders are off'

    page = <>
      <Panel title="Your data stays yours">
        <p className="po-settings-copy">Personal OS stores your records locally in this browser on this device. Export a JSON backup regularly. Calendar events are sent to the push service only when you enable event reminders.</p>
        <div className="po-settings-actions">
          <button className="po-primary" onClick={exportData}>Export full backup (.json)</button>
          <label className="po-secondary">Import backup<input type="file" accept="application/json,.json" onChange={e => importData(e.target.files?.[0])} /></label>
        </div>
      </Panel>
      <Panel title="Calendar push reminders">
        <div className={`po-push-status${pushStatus === 'error' ? ' has-error' : ''}`} role="status" aria-live="polite">
          <span className="po-status-dot" />
          <strong>{pushStatusLabel}</strong>
        </div>
        <p className="po-settings-copy">Receive a browser notification 5 minutes before each upcoming calendar event. This sends event titles, times and notes to your configured push server. Notifications require browser permission, HTTPS, and an always-on server.</p>
        {pushSessionToken ? (
          <div className="po-settings-actions">
            <button className="po-secondary" type="button" disabled={pushStatus === 'checking'} onClick={retryPushSync}>Sync reminders</button>
            <button className="po-secondary" type="button" disabled={pushStatus === 'checking'} onClick={disablePushNotifications}>Turn off on this device</button>
          </div>
        ) : (
          <form className="po-push-form" onSubmit={event => { event.preventDefault(); void enablePushNotifications() }}>
            <Field label="Push access password">
              <input type="password" autoComplete="current-password" value={pushPassword} onChange={event => setPushPassword(event.target.value)} placeholder="Set on the push server" />
            </Field>
            <button className="po-primary" type="submit" disabled={pushStatus === 'checking'}>Enable push reminders</button>
          </form>
        )}
        {pushError && <p className="po-push-error" role="alert">{pushError}</p>}
      </Panel>
      <Panel title="Appearance">
        <div className="po-setting-row">
          <div><strong>Theme</strong><small>Choose a comfortable workspace appearance.</small></div>
          <div className="po-segment">
            <button className={theme==='light'?'active':''} onClick={() => setTheme('light')}>Light</button>
            <button className={theme==='dark'?'active':''} onClick={() => setTheme('dark')}>Dark</button>
          </div>
        </div>
      </Panel>
      <Panel title="About this build">
        <p className="po-settings-copy">Tasks, projects, goals, habits, health check-ins, learning records, transactions, calendar events and notes are stored in browser storage. Push reminders use the optional private server configured for this app.</p>
      </Panel>
    </>
  }

  return <div className={'personal-os'+(theme==='dark'?' po-dark':'')}>
    <aside className="po-sidebar"><div className="po-brand"><div className="po-brand-mark">P</div><div><strong>Personal OS</strong><small>Your life, in one place</small></div></div>
      {['Workspace','Personal','System'].map(group => <div className="po-nav-group" key={group}><span className="po-nav-label">{group}</span>{nav.filter(item=>item.group===group).map(item=><button key={item.id} className={'po-nav-item'+(section===item.id?' active':'')} onClick={()=>setSection(item.id)}><span>{item.icon}</span>{item.label}</button>)}</div>)}
      <div className="po-sidebar-footer"><span className="po-status-dot" /> Local workspace <small>Private on this device</small></div>
    </aside>
    <main className="po-main">
      <header className="po-topbar"><div><span className="po-breadcrumb">PERSONAL OS / {section.toUpperCase()}</span><h1>{title}</h1></div><div className="po-top-actions"><span className="po-today">{new Date().toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</span><button className="po-primary po-new-task" onClick={()=>setSection('Tasks')}>＋ New task</button></div></header>
      <div className="po-content">{page}</div>
      <footer className="po-footer">Personal OS <span>·</span> Your life is a work in progress.</footer>
      <MobileTabBar items={nav} activeItem={section} onSelect={(next) => setSection(next as Section)} />
    </main>
  </div>
}
