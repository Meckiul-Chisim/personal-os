type ProgressBarProps = {
  value: number
}

export default function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="progress-bar">
      <span style={{ width: `${value}%` }} />
    </div>
  )
}
