import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Empty } from '../../components/ui/Empty'
import { Field } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Panel } from '../../components/ui/Panel'
import { today } from '../../lib/date'
import { uid } from '../../lib/id'
import { removeById, type ListSetter } from '../../lib/lists'
import type { Note } from '../../types'

/** Shared by the Journal (reflections) and Clarity (brain dump) sections. */
export function JournalPage({ kind, notes, setNotes }: { kind: Note['kind']; notes: Note[]; setNotes: ListSetter<Note> }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const isJournal = kind === 'Journal'
  const entries = notes.filter(note => note.kind === kind)

  const addNote = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim() && !body.trim()) return
    setNotes(current => [{ id: uid(), title: title.trim() || 'Untitled', body: body.trim(), kind, date: today() }, ...current])
    setTitle('')
    setBody('')
  }

  return (
    <>
      <Panel title={isJournal ? 'Write a journal entry' : 'Clear your mind'}>
        <form className="po-note-form" onSubmit={addNote}>
          <Field label="Title"><input value={title} onChange={e => setTitle(e.target.value)} placeholder={isJournal ? 'A moment worth remembering' : 'What is on your mind?'} /></Field>
          <Field label="Your thoughts"><textarea rows={5} value={body} onChange={e => setBody(e.target.value)} placeholder={isJournal ? 'Reflect on your day…' : 'Capture loose thoughts, decisions, blockers or ideas…'} /></Field>
          <div className="po-form-end">
            <span className="po-muted">Synced to your account</span>
            <button className="po-primary" type="submit">Save entry</button>
          </div>
        </form>
      </Panel>

      <Panel title={isJournal ? 'Your journal' : 'Clarity archive'}>
        {entries.length ? (
          <div className="po-note-list">
            {entries.map(note => (
              <article key={note.id}>
                <div className="po-note-top">
                  <span>{note.date}</span>
                  <IconButton label={`Delete note "${note.title}"`} danger onClick={() => removeById(setNotes, note.id)}><X size={16} /></IconButton>
                </div>
                <strong>{note.title}</strong>
                <p>{note.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title={isJournal ? 'Your story starts with one entry' : 'Make space to think'}
            detail="Your writing is stored in your private account and synced between your devices. It is not shared with anyone."
          />
        )}
      </Panel>
    </>
  )
}
