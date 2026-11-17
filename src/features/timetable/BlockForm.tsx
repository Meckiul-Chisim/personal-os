import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Field } from '../../components/ui/Field'
import { formatTime, toMinutes } from '../../lib/date'
import { uid } from '../../lib/id'
import { BLOCK_COLORS, CATEGORY_COLORS, WEEKDAY_SHORT, WEEK_ORDER, blocksOverlap } from '../../lib/timetable'
import { TIMETABLE_CATEGORIES, type TimetableBlock, type TimetableCategory } from '../../types'

/**
 * Form for adding or editing one timetable block.
 * Give it a different `key` whenever the block being edited changes so the fields reset.
 */
export function BlockForm({ editing, blocks, defaultDay, onSave, onCancel, onDelete }: {
  editing: TimetableBlock | null
  blocks: TimetableBlock[]
  defaultDay: number
  onSave: (block: TimetableBlock) => void
  onCancel: () => void
  onDelete: (block: TimetableBlock) => void
}) {
  const [title, setTitle] = useState(editing?.title ?? '')
  const [days, setDays] = useState<number[]>(editing?.days ?? [defaultDay])
  const [start, setStart] = useState(editing?.start ?? '09:00')
  const [end, setEnd] = useState(editing?.end ?? '10:00')
  const [category, setCategory] = useState<TimetableCategory>(editing?.category ?? 'Routine')
  const [color, setColor] = useState(editing?.color ?? CATEGORY_COLORS.Routine)
  const [note, setNote] = useState(editing?.note ?? '')
  const [submitted, setSubmitted] = useState(false)

  const timeError = toMinutes(end) <= toMinutes(start) ? 'The end time must be after the start time.' : ''
  const dayError = days.length === 0 ? 'Choose at least one day.' : ''
  const titleError = !title.trim() ? 'Give this block a name.' : ''

  // Overlaps are a warning, not an error: you may want two things in the same slot.
  const conflicts = useMemo(
    () => blocks.filter(other => other.id !== editing?.id && blocksOverlap({ days, start, end }, other)),
    [blocks, days, editing?.id, end, start],
  )

  const toggleDay = (day: number) =>
    setDays(current => (current.includes(day) ? current.filter(item => item !== day) : [...current, day]))

  // Changing the category also changes the colour, unless you picked a custom colour.
  const chooseCategory = (next: TimetableCategory) => {
    if (color === CATEGORY_COLORS[category]) setColor(CATEGORY_COLORS[next])
    setCategory(next)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (titleError || dayError || timeError) return
    onSave({
      id: editing?.id ?? uid(),
      title: title.trim(),
      days: [...days].sort((a, b) => a - b),
      start,
      end,
      category,
      color,
      note: note.trim(),
      doneDates: editing?.doneDates ?? [],
    })
  }

  return (
    <form className="po-tt-form" onSubmit={submit} noValidate>
      <Field label="Block name">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Morning workout" aria-invalid={submitted && Boolean(titleError)} />
      </Field>
      {submitted && titleError && <p className="po-form-error" role="alert">{titleError}</p>}

      <fieldset className="po-fieldset">
        <legend>Repeats on</legend>
        <div className="po-day-chips">
          {WEEK_ORDER.map(day => (
            <button
              key={day}
              type="button"
              className={`po-day-chip${days.includes(day) ? ' active' : ''}`}
              aria-pressed={days.includes(day)}
              onClick={() => toggleDay(day)}
            >
              {WEEKDAY_SHORT[day]}
            </button>
          ))}
        </div>
        <div className="po-chip-shortcuts">
          <button type="button" className="po-text-btn" onClick={() => setDays([1, 2, 3, 4, 5])}>Weekdays</button>
          <button type="button" className="po-text-btn" onClick={() => setDays([...WEEK_ORDER])}>Every day</button>
        </div>
      </fieldset>
      {submitted && dayError && <p className="po-form-error" role="alert">{dayError}</p>}

      <div className="po-form-pair">
        <Field label="Starts"><input type="time" value={start} onChange={e => setStart(e.target.value)} required /></Field>
        <Field label="Ends"><input type="time" value={end} onChange={e => setEnd(e.target.value)} required /></Field>
      </div>
      {timeError && <p className="po-form-error" role="alert">{timeError}</p>}

      <Field label="Category">
        <select value={category} onChange={e => chooseCategory(e.target.value as TimetableCategory)}>
          {TIMETABLE_CATEGORIES.map(item => <option key={item}>{item}</option>)}
        </select>
      </Field>

      <fieldset className="po-fieldset">
        <legend>Colour</legend>
        <div className="po-swatches">
          {BLOCK_COLORS.map(swatch => (
            <button
              key={swatch}
              type="button"
              className={`po-swatch${color === swatch ? ' active' : ''}`}
              style={{ backgroundColor: swatch }}
              aria-label={`Colour ${swatch}`}
              aria-pressed={color === swatch}
              onClick={() => setColor(swatch)}
            />
          ))}
        </div>
      </fieldset>

      <Field label="Notes">
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional details, room or reminder" />
      </Field>

      {conflicts.length > 0 && !timeError && (
        <div className="po-warning" role="status">
          <AlertTriangle size={16} aria-hidden="true" />
          <div>
            <strong>Overlaps with another block</strong>
            <ul>
              {conflicts.slice(0, 3).map(other => (
                <li key={other.id}>{other.title} · {formatTime(other.start)}–{formatTime(other.end)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="po-form-actions">
        {editing && (
          <button type="button" className="po-secondary danger" onClick={() => onDelete(editing)}>
            <Trash2 size={15} aria-hidden="true" /> Delete
          </button>
        )}
        {editing && <button type="button" className="po-secondary" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="po-primary"><Plus size={16} aria-hidden="true" /> {editing ? 'Save changes' : 'Add block'}</button>
      </div>
    </form>
  )
}
