import type { ReactNode } from 'react'

/** The basic frosted-glass card with a title and an optional action on the right. */
export function Panel({ title, action, children, className = '' }: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`po-panel ${className}`.trim()}>
      {(title || action) && (
        <div className="po-panel-head">
          {title ? <h2>{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
