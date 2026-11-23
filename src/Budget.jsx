
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './supabase.js'
import './Budget.css'

function Budget() {
  const [budget, setBudget] = useState('')
  const [savedBudget, setSavedBudget] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, '0')}-01`

  useEffect(() => {
    loadBudgetData()
  }, [])

  async function loadBudgetData() {
    setLoading(true)
    setError('')

    const { data: budgetData, error: budgetError } = await supabase
      .from('personal_budgets')
      .select('*')
      .eq('month', currentMonth)
      .maybeSingle()

    if (budgetError) {
      setError(budgetError.message)
      setLoading(false)
      return
    }

    setSavedBudget(budgetData)

    if (budgetData) {
      setBudget(String(budgetData.amount))
    }

    const monthStart = currentMonth
    const nextMonthDate = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1
    )

    const nextMonth = `${nextMonthDate.getFullYear()}-${String(
      nextMonthDate.getMonth() + 1
    ).padStart(2, '0')}-01`

    const { data: expenseData, error: expenseError } = await supabase
      .from('personal_expenses')
      .select('amount, expense_date')
      .gte('expense_date', monthStart)
      .lt('expense_date', nextMonth)

    if (expenseError) {
      setError(expenseError.message)
    } else {
      setExpenses(expenseData || [])
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

      const budgetAmount = Number(budget)

      if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
        throw new Error('Enter a budget amount greater than zero.')
      }

      let result

      if (savedBudget) {
        result = await supabase
          .from('personal_budgets')
          .update({
            amount: budgetAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', savedBudget.id)
      } else {
        result = await supabase
          .from('personal_budgets')
          .insert({
            user_id: user.id,
            month: currentMonth,
            amount: budgetAmount,
          })
      }

      if (result.error) throw result.error

      setMessage('Monthly budget saved!')
      await loadBudgetData()
    } catch (err) {
      setError(err.message || 'Could not save budget.')
    } finally {
      setSaving(false)
    }
  }

  const spent = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  )

  const budgetAmount = Number(savedBudget?.amount || 0)
  const remaining = budgetAmount - spent
  const progress = budgetAmount > 0
    ? Math.min((spent / budgetAmount) * 100, 100)
    : 0

  const monthLabel = today.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="budget-page">
      <header className="budget-header">
        <Link to="/dashboard" className="budget-back">
          ← Dashboard
        </Link>

        <h1>Monthly Budget</h1>
        <p>Give your money a plan.</p>
      </header>

      <section className="budget-overview">
        <span>{monthLabel}</span>

        <strong>
          ₹{budgetAmount.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
          })}
        </strong>

        <small>Monthly spending limit</small>

        <div className="budget-progress">
          <div
            className="budget-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="budget-stats">
          <div>
            <span>Spent</span>
            <strong>₹{spent.toLocaleString('en-IN')}</strong>
          </div>

          <div>
            <span>Remaining</span>
            <strong className={remaining < 0 ? 'budget-over' : ''}>
              ₹{remaining.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>

        {remaining < 0 && (
          <p className="budget-warning">
            You've exceeded your monthly budget.
          </p>
        )}
      </section>

      <section className="budget-form-section">
        <h2>Set your monthly budget</h2>

        <form onSubmit={handleSubmit} className="budget-form">
          <label>
            Budget amount (₹)
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 7000"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              required
            />
          </label>

          {error && <p className="budget-error">{error}</p>}
          {message && <p className="budget-success">{message}</p>}

          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save budget ↗'}
          </button>
        </form>
      </section>

      {loading && <p>Loading budget...</p>}
    </main>
  )
}

export default Budget
