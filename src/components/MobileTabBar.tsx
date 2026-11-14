import { useState } from 'react'

type MobileNavItem = {
  id: string
  label: string
  icon: string
}

type MobileTabBarProps = {
  items: MobileNavItem[]
  activeItem: string
  onSelect: (section: string) => void
}

const primaryItems = ['Overview', 'Today', 'Tasks', 'Calendar']

export default function MobileTabBar({ items, activeItem, onSelect }: MobileTabBarProps) {
  const [moreOpen, setMoreOpen] = useState(false)

  const filteredItems = items.filter((item) => item.id && item.label)
  const primary = filteredItems.filter((item) => primaryItems.includes(item.id))
  const more = filteredItems.filter((item) => !primaryItems.includes(item.id))
  const moreIsActive = more.some((item) => item.id === activeItem)

  const selectSection = (section: string) => {
    onSelect(section)
    setMoreOpen(false)
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 md:hidden">
      <nav
        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur"
        aria-label="Primary navigation"
      >
        {primary.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`flex flex-1 flex-col items-center justify-center rounded-xl px-2 py-2 text-[10px] font-semibold transition ${activeItem === item.id ? 'bg-emerald-100 text-emerald-900' : 'text-slate-600 hover:bg-slate-100'}`}
            aria-current={activeItem === item.id ? 'page' : undefined}
            onClick={() => selectSection(item.id)}
          >
            <span aria-hidden="true" className="mb-1 text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className={`flex min-w-[68px] flex-col items-center justify-center rounded-xl px-2 py-2 text-[10px] font-semibold transition ${moreIsActive || moreOpen ? 'bg-emerald-100 text-emerald-900' : 'text-slate-600 hover:bg-slate-100'}`}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <span aria-hidden="true" className="mb-1 text-base">···</span>
          More
        </button>
      </nav>

      {moreOpen && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(100%+0.75rem)]">
          <div className="pointer-events-auto mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-800">More</h2>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-lg leading-none text-slate-500 hover:bg-slate-100"
                aria-label="Close more menu"
                onClick={() => setMoreOpen(false)}
              >
                ×
              </button>
            </div>
            <nav className="flex flex-col p-2" aria-label="More sections">
              {more.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${activeItem === item.id ? 'bg-emerald-100 text-emerald-900' : 'text-slate-700 hover:bg-slate-100'}`}
                  onClick={() => selectSection(item.id)}
                >
                  <span aria-hidden="true" className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}
