
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './supabase.js'
import './Expenses.css'

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [expenseDate, setExpenseDate] = useState(() => {
    const today = new Date()

    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('personal_expenses')
      .select('*')
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setExpenses(data || [])
    }

    setLoading(false)
  }


async function deleteExpense(id) {
  const confirmed = window.confirm(
    'Are you sure you want to delete this expense?'
  )

  if (!confirmed) return

  setError('')
  setMessage('')

  const { error } = await supabase
    .from('personal_expenses')
    .delete()
    .eq('id', id)

  if (error) {
    setError(error.message)
    return
  }

  setMessage('Expense deleted successfully!')
  await loadExpenses()
}


  async function handleSubmit(event) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('Please log in again.')

      const { error: insertError } = await supabase
        .from('personal_expenses')
        .insert({
          user_id: user.id,
          title: title.trim(),
          amount: Number(amount),
          category,
          expense_date: expenseDate,
        })

      if (insertError) throw insertError

      setTitle('')
      setAmount('')
      setCategory('Food')
      setMessage('Expense added successfully!')

      await loadExpenses()
    } catch (err) {
      setError(err.message || 'Could not save the expense.')
    } finally {
      setSaving(false)
    }
  }

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  )

  return (
    <main className="expenses-page">
      <header className="expenses-header">
        <Link to="/dashboard" className="expenses-back">
          ← Dashboard
        </Link>

        <h1>My Expenses</h1>
        <p>Every rupee tracked. Every goal closer.</p>
      </header>

      <section className="expenses-summary">
        <span>Total recorded expenses</span>
        <strong>
          ₹{total.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </strong>
        <small>{expenses.length} expense(s) recorded</small>
      </section>

      <section className="expenses-form-section">
        <h2>Add an expense</h2>

        <form onSubmit={handleSubmit} className="expenses-form">
          <label>
            Expense name
            <input
              type="text"
              placeholder="e.g. Lunch"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={100}
            />
          </label>

          <label>
            Amount (₹)
            <input
              type="number"
              placeholder="e.g. 120"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              min="0.01"
              step="0.01"
              required
            />
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>Food</option>
              <option>Rent</option>
              <option>Travel</option>
              <option>Shopping</option>
              <option>Education</option>
              <option>Bills</option>
              <option>Personal care</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Expense date
            <input
              type="date"
              value={expenseDate}
              onChange={(event) => setExpenseDate(event.target.value)}
              required
            />
          </label>

          {error && <p className="expenses-error">{error}</p>}
          {message && <p className="expenses-success">{message}</p>}

          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Add expense ↗'}
          </button>
        </form>
      </section>

      <section className="expenses-history">
        <h2>Expense history</h2>

        {loading ? (
          <p>Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="expenses-empty">
            No expenses yet. Add your first expense above!
          </p>
        ) : (
          expenses.map((expense) => (
            <article className="expense-item" key={expense.id}>
              <div>
                <strong>{expense.title}</strong>
                <span>
                  {expense.category} · {expense.expense_date}
                </span>
              </div>

              
<div className="expense-item-actions">
  <strong>
    −₹{Number(expense.amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
  </strong>

  <button
    type="button"
    className="expense-delete"
    onClick={() => deleteExpense(expense.id)}
  >
    Delete
  </button>
</div>

            </article>
          ))
        )}
      </section>
    </main>
  )
}

export default Expenses
