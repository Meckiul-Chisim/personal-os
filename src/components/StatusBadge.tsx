import type { Priority } from '../types'

type StatusBadgeProps = {
  priority: Priority
}

export default function StatusBadge({ priority }: StatusBadgeProps) {
  return <span className={`badge ${priority.toLowerCase()}`}>{priority}</span>
}
