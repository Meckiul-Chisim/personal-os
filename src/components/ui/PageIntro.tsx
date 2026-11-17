import type { ReactNode } from 'react'

/** Short heading and description at the top of a page, with an optional action. */
export function PageIntro({ eyebrow, title, description, action }: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="po-intro">
      <div>
        <span className="po-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </header>
  )
}
