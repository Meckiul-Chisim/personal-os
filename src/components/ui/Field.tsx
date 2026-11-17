import type { ReactNode } from 'react'

/** A labelled form control. The label wraps the control so clicking it focuses the input. */
export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`po-field ${className}`.trim()}>
      <span>{label}</span>
      {children}
    </label>
  )
}
