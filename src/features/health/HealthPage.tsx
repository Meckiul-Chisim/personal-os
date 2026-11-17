import { Droplets, Footprints, Moon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Empty } from '../../components/ui/Empty'
import { Field } from '../../components/ui/Field'
import { Panel } from '../../components/ui/Panel'
import { today } from '../../lib/date'
import { uid } from '../../lib/id'
import type { ListSetter } from '../../lib/lists'
import type { HealthLog } from '../../types'

export function HealthPage({ health, setHealth }: { health: HealthLog[]; setHealth: ListSetter<HealthLog> }) {
  const [sleep, setSleep] = useState('8')
  const [water, setWater] = useState('6')
  const [movement, setMovement] = useState('30')
  const [mood, setMood] = useState('Good')
  const [note, setNote] = useState('')

  // One check-in per day: saving again replaces today's entry.
  const addHealth = (event: FormEvent) => {
    event.preventDefault()
    const date = today()
    setHealth(current => [
      { id: uid(), date, sleep: Number(sleep), water: Number(water), movement: Number(movement), mood, note },
      ...current.filter(log => log.date !== date),
    ])
    setNote('')
  }

  return (
    <>
      <Panel title="Daily health check-in">
        <form className="po-form po-health-form" onSubmit={addHealth}>
          <Field label="Sleep (hours)"><input type="number" min="0" max="24" step=".5" value={sleep} onChange={e => setSleep(e.target.value)} /></Field>
          <Field label="Water (glasses)"><input type="number" min="0" max="30" value={water} onChange={e => setWater(e.target.value)} /></Field>
          <Field label="Movement (minutes)"><input type="number" min="0" max="1440" value={movement} onChange={e => setMovement(e.target.value)} /></Field>
          <Field label="Mood">
            <select value={mood} onChange={e => setMood(e.target.value)}>
              <option>Great</option><option>Good</option><option>Okay</option><option>Low</option><option>Stressed</option>
            </select>
          </Field>
          <Field label="Notes"><input value={note} onChange={e => setNote(e.target.value)} placeholder="Workout, energy, how you feel…" /></Field>
          <button className="po-primary" type="submit">Save today's check-in</button>
        </form>
      </Panel>

      <Panel title="Health history">
        {health.length ? (
          <ul className="po-list">
            {health.map(log => (
              <li className="po-health-row" key={log.id}>
                <strong>{log.date}</strong>
                <span><Moon size={14} aria-hidden="true" /> {log.sleep}h sleep</span>
                <span><Droplets size={14} aria-hidden="true" /> {log.water} glasses</span>
                <span><Footprints size={14} aria-hidden="true" /> {log.movement} min</span>
                <span className="po-chip">{log.mood}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="Your health timeline starts here" detail="No health records are pre-filled. Save a daily check-in to build your own history." />
        )}
      </Panel>
    </>
  )
}
