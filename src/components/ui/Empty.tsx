import { Plus } from 'lucide-react'

/** Friendly placeholder shown when a list has no records yet. */
export function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="po-empty">
      <span className="po-empty-mark" aria-hidden="true"><Plus size={18} /></span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  )
}
