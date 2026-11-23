
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './supabase.js'
import './Income.css'

function Income() {
  const [incomeRecords, setIncomeRecords] = useState([])
  const [source, setSource] = useState('Pocket Money')
  const [amount, setAmount] = useState('')
  const [incomeDate, setIncomeDate] = useState(() => {
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
    loadIncome()
  }, [])

  async function loadIncome() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('personal_income')
      .select('*')
      .order('income_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setIncomeRecords(data || [])
    }

    setLoading(false)
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
        .from('personal_income')
        .insert({
          user_id: user.id,
          source,
          amount: Number(amount),
          income_date: incomeDate,
        })

      if (insertError) throw insertError

      setAmount('')
      setSource('Pocket Money')
      setMessage('Income recorded successfully!')

      await loadIncome()
    } catch (err) {
      setError(err.message || 'Could not save income.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteIncome(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this income record?'
    )

    if (!confirmed) return

    setError('')
    setMessage('')

    const { error } = await supabase
      .from('personal_income')
      .delete()
      .eq('id', id)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Income record deleted.')
    await loadIncome()
  }

  const total = incomeRecords.reduce(
    (sum, record) => sum + Number(record.amount),
    0
  )

  return (
    <main className="income-page">
      <header className="income-header">
        <Link to="/dashboard" className="income-back">
          ← Dashboard
        </Link>

        <h1>My Income</h1>
        <p>Track every rupee that comes in.</p>
      </header>

      <section className="income-summary">
        <span>Total recorded income</span>
        <strong>
          ₹{total.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </strong>
        <small>{incomeRecords.length} income record(s)</small>
      </section>

      <section className="income-form-section">
        <h2>Record income</h2>

        <form onSubmit={handleSubmit} className="income-form">
          <label>
            Income source
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
            >
              <option>Pocket Money</option>
              <option>Salary</option>
              <option>Part-time job</option>
              <option>Scholarship</option>
              <option>Freelance</option>
              <option>Gift</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Amount (₹)
            <input
              type="number"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              min="0.01"
              step="0.01"
              required
            />
          </label>

          <label>
            Date received
            <input
              type="date"
              value={incomeDate}
              onChange={(event) => setIncomeDate(event.target.value)}
              required
            />
          </label>

          {error && <p className="income-error">{error}</p>}
          {message && <p className="income-success">{message}</p>}

          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Record income ↗'}
          </button>
        </form>
      </section>

      <section className="income-history">
        <h2>Income history</h2>

        {loading ? (
          <p>Loading income...</p>
        ) : incomeRecords.length === 0 ? (
          <p className="income-empty">
            No income recorded yet. Add your first income above!
          </p>
        ) : (
          incomeRecords.map((record) => (
            <article className="income-item" key={record.id}>
              <div>
                <strong>{record.source}</strong>
                <span>{record.income_date}</span>
              </div>

              <div className="income-item-actions">
                <strong>
                  +₹{Number(record.amount).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>

                <button
                  type="button"
                  className="income-delete"
                  onClick={() => deleteIncome(record.id)}
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

export default Income
