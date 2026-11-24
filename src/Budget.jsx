
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

  const now = new Date()

  const [currentMonth, setCurrentMonth] = useState(
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-01`
  )

  const monthDate = new Date(`${currentMonth}T00:00:00`)

  const monthLabel = monthDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  const nextMonthDate = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    1
  )

  const nextMonth = `${nextMonthDate.getFullYear()}-${String(
    nextMonthDate.getMonth() + 1
  ).padStart(2, '0')}-01`

  const previousMonthDate = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() - 1,
    1
  )

  const previousMonth = `${previousMonthDate.getFullYear()}-${String(
    previousMonthDate.getMonth() + 1
  ).padStart(2, '0')}-01`

  const formatMoney = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`

  useEffect(() => {
    loadBudgetData()
  }, [currentMonth])

  async function loadBudgetData() {
    setLoading(true)
    setError('')
    setMessage('')

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
    setBudget(budgetData ? String(budgetData.amount) : '')

    const { data: expenseData, error: expenseError } = await supabase
      .from('personal_expenses')
      .select('id, title, amount, category, expense_date')
      .gte('expense_date', currentMonth)
      .lt('expense_date', nextMonth)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (expenseError) {
      setError(expenseError.message)
      setExpenses([])
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

      setMessage('Your monthly budget has been saved!')
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

  const actualProgress =
    budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0

  const progress = Math.min(actualProgress, 100)

  const usageLabel = `${Math.round(actualProgress)}%`

  let budgetStatus = 'No budget set'
  let statusClass = 'neutral'

  if (budgetAmount > 0) {
    if (actualProgress >= 100) {
      budgetStatus = 'Budget exceeded'
      statusClass = 'danger'
    } else if (actualProgress >= 80) {
      budgetStatus = 'Almost at your limit'
      statusClass = 'warning'
    } else {
      budgetStatus = 'Looking good'
      statusClass = 'safe'
    }
  }

  const categoryTotals = expenses.reduce((totals, expense) => {
    const category = expense.category || 'Other'
    totals[category] = (totals[category] || 0) + Number(expense.amount)
    return totals
  }, {})

  const categories = Object.entries(categoryTotals)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)

  const highestCategory = categories[0]

  const recentExpenses = expenses.slice(0, 5)

  function changeMonth(direction) {
    const date = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + direction,
      1
    )

    setCurrentMonth(
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-01`
    )
  }

  return (
    <main className="budget-page">
      <div className="budget-container">
        <header className="budget-topbar">
          <Link to="/dashboard" className="budget-back">
            <span>←</span> Dashboard
          </Link>

          <div className="budget-brand">
            <span className="budget-brand-mark">बचत</span>
            <span>Buddy</span>
          </div>
        </header>

        <section className="budget-heading">
          <div>
            <span className="budget-eyebrow">
              PERSONAL FINANCE
            </span>

            <h1>
              Monthly <span>budget.</span>
            </h1>

            <p>
              Make every rupee count. Plan your spending,
              stay on track, and grow your savings.
            </p>
          </div>

          <div className="budget-month-picker">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
            >
              ‹
            </button>

            <span>{monthLabel}</span>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </section>

        {error && (
          <div className="budget-alert budget-alert-error">
            <span>!</span>
            {error}
          </div>
        )}

        {message && (
          <div className="budget-alert budget-alert-success">
            <span>✓</span>
            {message}
          </div>
        )}

        {loading ? (
          <div className="budget-loading">
            <div className="budget-loader" />
            <p>Preparing your budget...</p>
          </div>
        ) : (
          <>
            <section className="budget-hero">
              <div className="budget-hero-top">
                <div>
                  <span className="budget-label">
                    MONTHLY SPENDING LIMIT
                  </span>

                  <h2>{formatMoney(budgetAmount)}</h2>
                </div>

                <span className={`budget-status ${statusClass}`}>
                  <span className="budget-status-dot" />
                  {budgetStatus}
                </span>
              </div>

              <div className="budget-hero-progress">
                <div className="budget-progress-track">
                  <div
                    className={`budget-progress-fill ${statusClass}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="budget-progress-labels">
                  <span>{formatMoney(spent)} spent</span>
                  <span>{usageLabel} used</span>
                </div>
              </div>

              <div className="budget-hero-bottom">
                <div>
                  <span className="budget-label">
                    {remaining >= 0 ? 'YOU HAVE LEFT' : 'OVER BUDGET BY'}
                  </span>

                  <strong className={remaining < 0 ? 'negative' : ''}>
                    {formatMoney(Math.abs(remaining))}
                  </strong>
                </div>

                <div className="budget-hero-note">
                  {budgetAmount === 0
                    ? 'Set a budget to start tracking.'
                    : remaining < 0
                    ? 'Take a moment to review your spending.'
                    : 'Keep going. You are in control.'}
                </div>
              </div>
            </section>

            <section className="budget-stat-grid">
              <article className="budget-stat-card">
                <div className="budget-stat-top">
                  <span className="budget-stat-icon violet">₹</span>
                  <span className="budget-stat-caption">PLANNED</span>
                </div>

                <h3>{formatMoney(budgetAmount)}</h3>
                <p>Your monthly limit</p>
              </article>

              <article className="budget-stat-card">
                <div className="budget-stat-top">
                  <span className="budget-stat-icon lime">↗</span>
                  <span className="budget-stat-caption">SPENT</span>
                </div>

                <h3>{formatMoney(spent)}</h3>
                <p>{expenses.length} recorded expenses</p>
              </article>

              <article className="budget-stat-card">
                <div className="budget-stat-top">
                  <span className="budget-stat-icon purple">◷</span>
                  <span className="budget-stat-caption">REMAINING</span>
                </div>

                <h3 className={remaining < 0 ? 'negative' : ''}>
                  {formatMoney(Math.abs(remaining))}
                </h3>

                <p>
                  {remaining < 0
                    ? 'Above your budget'
                    : 'Available to spend'}
                </p>
              </article>
            </section>

            <section className="budget-content-grid">
              <article className="budget-panel budget-set-panel">
                <div className="budget-panel-heading">
                  <div>
                    <span className="budget-eyebrow">
                      TAKE CONTROL
                    </span>
                    <h2>Set your budget</h2>
                  </div>

                  <span className="budget-panel-symbol">↗</span>
                </div>

                <p className="budget-panel-description">
                  Choose how much you want to spend in {monthLabel}.
                  You can update it anytime.
                </p>

                <form
                  className="budget-form"
                  onSubmit={handleSubmit}
                >
                  <label htmlFor="monthly-budget">
                    Monthly limit
                  </label>

                  <div className="budget-input-wrap">
                    <span>₹</span>

                    <input
                      id="monthly-budget"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Enter amount"
                      value={budget}
                      onChange={(event) => setBudget(event.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="budget-save-button"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving your budget...'
                      : savedBudget
                      ? 'Update budget'
                      : 'Create budget'}
                    <span>↗</span>
                  </button>
                </form>

                <div className="budget-form-footnote">
                  <span>✦</span>
                  Your budget is private to your account.
                </div>
              </article>

              <article className="budget-panel budget-category-panel">
                <div className="budget-panel-heading">
                  <div>
                    <span className="budget-eyebrow">
                      SPENDING INSIGHTS
                    </span>
                    <h2>Where it goes</h2>
                  </div>

                  <span className="budget-panel-symbol">⌁</span>
                </div>

                {categories.length === 0 ? (
                  <div className="budget-empty">
                    <span>◌</span>
                    <h3>No spending yet</h3>
                    <p>
                      Your category breakdown will appear
                      when you add expenses.
                    </p>
                  </div>
                ) : (
                  <>
                    {highestCategory && (
                      <div className="budget-highest-category">
                        <span>TOP SPENDING CATEGORY</span>
                        <strong>{highestCategory.name}</strong>
                        <b>{formatMoney(highestCategory.amount)}</b>
                      </div>
                    )}

                    <div className="budget-category-list">
                      {categories.slice(0, 5).map((category) => {
                        const percentage =
                          spent > 0
                            ? (category.amount / spent) * 100
                            : 0

                        return (
                          <div
                            className="budget-category-item"
                            key={category.name}
                          >
                            <div className="budget-category-info">
                              <span>{category.name}</span>
                              <strong>
                                {formatMoney(category.amount)}
                              </strong>
                            </div>

                            <div className="budget-category-track">
                              <div
                                className="budget-category-fill"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </article>
            </section>

            <section className="budget-panel budget-expenses-panel">
              <div className="budget-panel-heading">
                <div>
                  <span className="budget-eyebrow">
                    YOUR ACTIVITY
                  </span>
                  <h2>Recent expenses</h2>
                </div>

                <Link
                  to="/expenses"
                  className="budget-view-all"
                >
                  View all <span>↗</span>
                </Link>
              </div>

              {recentExpenses.length === 0 ? (
                <div className="budget-empty budget-empty-wide">
                  <span>＋</span>
                  <h3>Nothing to show yet</h3>
                  <p>
                    Add your first expense to start
                    tracking your monthly budget.
                  </p>

                  <Link to="/expenses" className="budget-add-expense">
                    Add an expense ↗
                  </Link>
                </div>
              ) : (
                <div className="budget-expense-list">
                  {recentExpenses.map((expense) => (
                    <div
                      className="budget-expense-row"
                      key={expense.id}
                    >
                      <div className="budget-expense-icon">
                        {expense.title?.charAt(0)?.toUpperCase() || '₹'}
                      </div>

                      <div className="budget-expense-details">
                        <strong>{expense.title || 'Expense'}</strong>
                        <span>
                          {expense.category || 'Other'} ·{' '}
                          {new Date(
                            `${expense.expense_date}T00:00:00`
                          ).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      <strong className="budget-expense-amount">
                        −{formatMoney(expense.amount)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <footer className="budget-footer">
              <span>बचत Buddy</span>
              <p>Small steps today. Better savings tomorrow.</p>
            </footer>
          </>
        )}
      </div>
    </main>
  )
}

export default Budget
