/** Thin progress bar. `value` is a percentage from 0 to 100. */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="po-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped}>
      <span style={{ width: `${clamped}%` }} />
    </div>
  )
}
