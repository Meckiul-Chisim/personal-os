import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Empty } from '../../components/ui/Empty'
import { Field } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Panel } from '../../components/ui/Panel'
import { today } from '../../lib/date'
import { uid } from '../../lib/id'
import { removeById, type ListSetter } from '../../lib/lists'
import type { Transaction } from '../../types'

const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`

export function FinancesPage({ transactions, setTransactions }: { transactions: Transaction[]; setTransactions: ListSetter<Transaction> }) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<Transaction['type']>('Expense')
  const [category, setCategory] = useState('General')

  const income = transactions.filter(item => item.type === 'Income').reduce((sum, item) => sum + item.amount, 0)
  const expenses = transactions.filter(item => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0)
  const net = income - expenses

  const addTransaction = (event: FormEvent) => {
    event.preventDefault()
    const value = Number(amount)
    if (!title.trim() || !Number.isFinite(value) || value <= 0) return
    setTransactions(current => [{ id: uid(), title: title.trim(), amount: value, type, category, date: today() }, ...current])
    setTitle('')
    setAmount('')
  }

  return (
    <>
      <div className="po-stats three">
        <div className="po-stat"><span>Recorded income</span><strong>{rupees(income)}</strong></div>
        <div className="po-stat"><span>Recorded expenses</span><strong>{rupees(expenses)}</strong></div>
        <div className="po-stat"><span>Net recorded</span><strong className={net < 0 ? 'po-negative' : ''}>{rupees(net)}</strong></div>
      </div>

      <Panel title="Record a transaction">
        <form className="po-form" onSubmit={addTransaction}>
          <Field label="Description"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="What was this for?" /></Field>
          <Field label="Amount (₹)"><input type="number" min="0.01" step=".01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></Field>
          <Field label="Type">
            <select value={type} onChange={e => setType(e.target.value as Transaction['type'])}>
              <option>Expense</option><option>Income</option>
            </select>
          </Field>
          <Field label="Category"><input value={category} onChange={e => setCategory(e.target.value)} /></Field>
          <button className="po-primary" type="submit">Save transaction</button>
        </form>
      </Panel>

      <Panel title="Transaction history">
        {transactions.length ? (
          <ul className="po-list">
            {transactions.map(item => (
              <li className="po-row" key={item.id}>
                <div className="po-row-main">
                  <strong>{item.title}</strong>
                  <small>{item.category} · {item.date}</small>
                </div>
                <b className={item.type === 'Income' ? 'po-positive' : 'po-negative'}>{item.type === 'Income' ? '+' : '−'}{rupees(item.amount)}</b>
                <IconButton label={`Delete transaction "${item.title}"`} danger onClick={() => removeById(setTransactions, item.id)}><X size={16} /></IconButton>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No transactions yet" detail="Record income and spending to build a personal money history. Nothing is connected to your bank." />
        )}
      </Panel>
    </>
  )
}
