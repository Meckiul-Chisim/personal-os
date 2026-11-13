import { useMemo, useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import MobileTabBar from './components/MobileTabBar'
import {
  claritySeed,
  goalSeed,
  habitSeed,
  insightsBars,
  navSections,
  noteSeed,
  overviewStats,
  projectSeed,
  taskSeed,
} from './data/mockData'
import CalendarPage from './pages/CalendarPage'
import ClarityPage from './pages/ClarityPage'
import DashboardPage from './pages/DashboardPage'
import GoalsPage from './pages/GoalsPage'
import HabitsPage from './pages/HabitsPage'
import InsightsPage from './pages/InsightsPage'
import JournalPage from './pages/JournalPage'
import LifeOverviewPage from './pages/LifeOverviewPage'
import MyDayPage from './pages/MyDayPage'
import ProjectsPage from './pages/ProjectsPage'
import TasksPage from './pages/TasksPage'
import type { SectionName, Task, TaskStatus } from './types'

const getGreeting = () => {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function App() {
  const [activeSection, setActiveSection] = useState<SectionName>('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [taskList, setTaskList] = useState<Task[]>(taskSeed)
  const [quickTask, setQuickTask] = useState('')
  const [taskFilter, setTaskFilter] = useState<'all' | 'today' | 'overdue' | 'completed'>('all')

  const visibleTasks = useMemo(() => {
    if (taskFilter === 'today') {
      return taskList.filter((task) => task.due === 'Today' || task.due === 'Tomorrow')
    }
    if (taskFilter === 'overdue') {
      return taskList.filter((task) => task.status === 'Waiting' || task.status === 'Not started')
    }
    if (taskFilter === 'completed') {
      return taskList.filter((task) => task.status === 'Completed')
    }
    return taskList
  }, [taskFilter, taskList])

  const completionRate = useMemo(
    () => Math.round((taskList.filter((task) => task.status === 'Completed').length / taskList.length) * 100),
    [taskList],
  )

  const handleAddTask = () => {
    if (!quickTask.trim()) return

    const nextTask: Task = {
      id: Date.now(),
      title: quickTask.trim(),
      category: 'Quick capture',
      priority: 'Medium',
      status: 'Not started',
      due: 'Today',
      tags: ['quick'],
      time: 'Now',
      project: 'MyDay',
    }

    setTaskList((current) => [nextTask, ...current])
    setQuickTask('')
    setActiveSection('My Day')
  }

  const handleAddScheduledTask = (title: string, scheduledDate: string, time: string) => {
    const [year, month, day] = scheduledDate.split('-').map(Number)
    const due = new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    const nextTask: Task = {
      id: Date.now(),
      title,
      category: 'Scheduled',
      priority: 'Medium',
      status: 'Not started',
      due,
      scheduledDate,
      tags: ['calendar'],
      time,
      project: 'Calendar',
    }

    setTaskList((current) => [nextTask, ...current])
  }

  const toggleTaskStatus = (id: number) => {
    setTaskList((current) =>
      current.map((task) => {
        if (task.id !== id) return task
        const nextStatus: TaskStatus = task.status === 'Completed' ? 'In progress' : 'Completed'
        return { ...task, status: nextStatus }
      }),
    )
  }

  const handleSectionSelect = (section: SectionName) => {
    setActiveSection(section)
    setSidebarOpen(false)
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'Dashboard':
        return (
          <DashboardPage
            taskList={taskList}
            projectList={projectSeed}
            goalList={goalSeed}
            habitList={habitSeed}
            noteList={noteSeed}
            insightBars={insightsBars}
            completionRate={completionRate}
          />
        )
      case 'My Day':
        return (
          <MyDayPage
            taskList={taskList}
            quickTask={quickTask}
            onQuickTaskChange={setQuickTask}
            onAddTask={handleAddTask}
            onToggleTaskStatus={toggleTaskStatus}
          />
        )
      case 'Tasks':
        return (
          <TasksPage
            taskList={visibleTasks}
            filter={taskFilter}
            onFilterChange={setTaskFilter}
          />
        )
      case 'Projects':
        return <ProjectsPage projectList={projectSeed} />
      case 'Goals & Growth':
        return <GoalsPage goalList={goalSeed} />
      case 'Habits & Routines':
        return <HabitsPage habitList={habitSeed} />
      case 'Journal & Notes':
        return <JournalPage noteList={noteSeed} />
      case 'Clarity Center':
        return <ClarityPage clarityList={claritySeed} />
      case 'Calendar':
        return <CalendarPage taskList={taskList} onAddTask={handleAddScheduledTask} />
      case 'Life Overview':
        return <LifeOverviewPage stats={overviewStats} />
      case 'Insights & Reviews':
        return <InsightsPage insightBars={insightsBars} />
      default:
        return null
    }
  }

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        sections={navSections}
        activeSection={activeSection}
        isOpen={sidebarOpen}
        onSelect={handleSectionSelect}
      />
      <main className="main-panel">
        <TopBar
          greeting={getGreeting()}
          dateLabel={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          onMenuClick={() => setSidebarOpen(true)}
          menuExpanded={sidebarOpen}
        />
        <div className="page-content">{renderSection()}</div>
      </main>
      <MobileTabBar sections={navSections} activeSection={activeSection} onSelect={handleSectionSelect} />
    </div>
  )
}

export default App
