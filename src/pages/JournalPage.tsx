import type { Note } from '../types'

type JournalPageProps = {
  noteList: Note[]
}

export default function JournalPage({ noteList }: JournalPageProps) {
  return (
    <div className="card-grid">
      {noteList.map((note) => (
        <div key={note.id} className="panel note-card">
          <div className="panel-header">
            <h3>{note.title}</h3>
            <span>{note.category}</span>
          </div>
          <p>{note.excerpt}</p>
          <small>Updated {note.updated}</small>
        </div>
      ))}
    </div>
  )
}
