import { ArrowUpRight, BookOpen, HeartPulse, IndianRupee, Briefcase } from 'lucide-react'
import { Empty } from '../../components/ui/Empty'
import { Panel } from '../../components/ui/Panel'
import { useNow } from '../../hooks/useNow'
import { dateKey } from '../../lib/date'
import type { ListSetter } from '../../lib/lists'
import type { Goal, Habit, HealthLog, LearningItem, Note, Project, Section, Task, TimetableBlock, Transaction } from '../../types'
import { TaskList } from '../tasks/TaskList'
import { TodaySchedule } from '../timetable/TodaySchedule'

type Props = {
  mode: 'Overview' | 'Today'
  tasks: Task[]
  setTasks: ListSetter<Task>
  projects: Project[]
  goals: Goal[]
  habits: Habit[]
  health: HealthLog[]
  learning: LearningItem[]
  transactions: Transaction[]
  notes: Note[]
  timetable: TimetableBlock[]
  setTimetable: ListSetter<TimetableBlock>
  onNavigate: (section: Section) => void
}

/** Shared by "Overview" and "My day": a bento grid of the most useful numbers and lists. */
export function OverviewPage({ mode, tasks, setTasks, projects, goals, habits, health, learning, transactions, notes, timetable, setTimetable, onNavigate }: Props) {
  const now = useNow()
  const todayKey = dateKey(now)
  const isToday = mode === 'Today'

  const openTasks = tasks.filter(task => !task.done)
  const completedCount = tasks.length - openTasks.length
  // Tasks without a due date are not "due today", so they are left out here.
  const dueTasks = openTasks.filter(task => task.due && task.due <= todayKey)
  const habitsDone = habits.filter(habit => habit.doneDates.includes(todayKey)).length

  const areas = [
    { name: 'Work & business', description: 'Projects, execution and delivery', count: projects.length, section: 'Projects' as Section, icon: Briefcase },
    { name: 'Health & fitness', description: 'Check-ins and physical wellbeing', count: health.length, section: 'Health' as Section, icon: HeartPulse },
    { name: 'Learning', description: 'Skills and deliberate practice', count: learning.length, section: 'Learning' as Section, icon: BookOpen },
    { name: 'Money', description: 'Income, spending and awareness', count: transactions.length, section: 'Finances' as Section, icon: IndianRupee },
  ]

  return (
    <div className="po-bento">
      <section className="po-hero">
        <div className="po-hero-copy">
          <span className="po-eyebrow">{isToday ? 'Daily reset' : 'Your personal operating system'}</span>
          <h2>{isToday ? 'Make today count.' : 'A clearer view of your life.'}</h2>
          <p>{isToday
            ? 'Choose what matters, make progress, and leave room to reset.'
            : 'Bring your work, personal goals, health and growth into one calm workspace.'}</p>
          <span className="po-date-pill">{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="po-orb" aria-hidden="true"><span /></div>
      </section>

      <div className="po-stats">
        <div className="po-stat"><span>Open tasks</span><strong>{openTasks.length}</strong><small>{completedCount} completed overall</small></div>
        <div className="po-stat"><span>Active projects</span><strong>{projects.filter(project => project.status === 'Active').length}</strong><small>{projects.length} total projects</small></div>
        <div className="po-stat"><span>Goals in motion</span><strong>{goals.length}</strong><small>Personal milestones</small></div>
        <div className="po-stat"><span>Today's habits</span><strong>{habitsDone}/{habits.length}</strong><small>Consistency, not perfection</small></div>
      </div>

      <Panel title="Today's routine" action={<button type="button" className="po-text-btn" onClick={() => onNavigate('Timetable')}>Timetable →</button>} className="po-span-half">
        <TodaySchedule timetable={timetable} setTimetable={setTimetable} onOpen={() => onNavigate('Timetable')} />
      </Panel>

      <Panel
        title={isToday ? 'Due today and overdue' : 'Your next actions'}
        action={<button type="button" className="po-text-btn" onClick={() => onNavigate('Tasks')}>All tasks →</button>}
        className="po-span-half"
      >
        <TaskList
          tasks={isToday ? dueTasks : openTasks.slice(0, 5)}
          setTasks={setTasks}
          emptyTitle={isToday ? 'Nothing due today' : 'Nothing here yet'}
          emptyDetail={isToday ? 'Enjoy the space, or pull something forward from your task list.' : 'Add a task when something needs your attention. Your list will grow from your real entries.'}
        />
      </Panel>

      <Panel title="Life areas">
        <div className="po-area-grid">
          {areas.map(area => {
            const Icon = area.icon
            return (
              <button type="button" className="po-area-card" key={area.name} onClick={() => onNavigate(area.section)}>
                <span className="po-area-icon" aria-hidden="true"><Icon size={18} /></span>
                <strong>{area.name}</strong>
                <span>{area.description}</span>
                <small>{area.count} records <ArrowUpRight size={14} aria-hidden="true" /></small>
              </button>
            )
          })}
        </div>
      </Panel>

      <Panel title="Recent notes" action={<button type="button" className="po-text-btn" onClick={() => onNavigate('Journal')}>Open journal →</button>}>
        {notes.length ? (
          <div className="po-note-list">
            {notes.slice(0, 3).map(note => (
              <article key={note.id}>
                <span>{note.kind} · {note.date}</span>
                <strong>{note.title}</strong>
                <p>{note.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="Give your thoughts a home" detail="Capture an idea, reflection or decision in your journal or clarity space." />
        )}
      </Panel>
    </div>
  )
}
