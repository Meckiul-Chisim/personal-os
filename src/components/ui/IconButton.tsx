import type { ReactNode } from 'react'

/** Small round icon button. The label is required so screen readers know what it does. */
export function IconButton({ label, onClick, children, danger = false }: {
  label: string
  onClick: () => void
  children: ReactNode
  danger?: boolean
}) {
  return (
    <button type="button" className={`po-icon-btn${danger ? ' danger' : ''}`} aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  )
}
