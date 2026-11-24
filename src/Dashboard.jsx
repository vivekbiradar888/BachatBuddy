
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './supabase.js'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [budget, setBudget] = useState(0)
  const [weeklyExpenses, setWeeklyExpenses] = useState([
    0, 0, 0, 0, 0,
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)

      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user

      if (!user) {
        setLoading(false)
        return
      }

      setEmail(user.email)

      const now = new Date()

      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')

      const firstDay = `${year}-${month}-01`

      const lastDay = new Date(year, now.getMonth() + 1, 0)
        .getDate()

      const lastDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

      const [
        incomeResult,
        expensesResult,
        budgetResult,
      ] = await Promise.all([
        supabase
          .from('personal_income')
          .select('amount')
          .eq('user_id', user.id)
          .gte('income_date', firstDay)
          .lte('income_date', lastDate),

        supabase
          .from('personal_expenses')
          .select('amount, expense_date')
          .eq('user_id', user.id)
          .gte('expense_date', firstDay)
          .lte('expense_date', lastDate),

        supabase
          .from('personal_budgets')
          .select('amount')
          .eq('user_id', user.id)
          .eq('month', firstDay)
          .maybeSingle(),
      ])

      if (incomeResult.error) {
        console.error(incomeResult.error)
      } else {
        const totalIncome = (incomeResult.data || []).reduce(
          (total, item) => total + Number(item.amount),
          0
        )

        setIncome(totalIncome)
      }

      if (expensesResult.error) {
        console.error(expensesResult.error)
      } else {
        const expenseRecords = expensesResult.data || []

        const totalExpenses = expenseRecords.reduce(
          (total, item) => total + Number(item.amount),
          0
        )

        setExpenses(totalExpenses)

        // Calculate expenses for each week of the month
        const weeklyTotals = [0, 0, 0, 0, 0]

        expenseRecords.forEach((item) => {
          if (!item.expense_date) return

          const day = Number(item.expense_date.split('-')[2])
          const weekIndex = Math.min(
            Math.floor((day - 1) / 7),
            4
          )

          weeklyTotals[weekIndex] += Number(item.amount)
        })

        setWeeklyExpenses(weeklyTotals)
      }

      if (budgetResult.error) {
        console.error(budgetResult.error)
      } else {
        setBudget(Number(budgetResult.data?.amount || 0))
      }

      setLoading(false)
    }

    loadDashboard()
  }, [])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
      return
    }

    navigate('/login')
  }

  const savings = income - expenses
  const remainingBudget = budget - expenses

  function formatMoney(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const maximumWeeklyExpense = Math.max(
    ...weeklyExpenses,
    1
  )

  const currentMonth = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <main className="dashboard-page">
      <nav className="dashboard-navbar">
        <Link to="/" className="dashboard-brand">
          <span className="brand-hindi">बचत</span>
          <span className="brand-english">Buddy</span>
        </Link>

        <button
          className="dashboard-logout"
          onClick={handleLogout}
        >
          Log out ↗
        </button>
      </nav>

      <section className="dashboard-welcome">
        <span className="dashboard-kicker">
          YOUR MONEY, YOUR RULES
        </span>

        <h1>
          Welcome to
          <span> BachatBuddy.</span>
        </h1>

        <p>
          Your smarter money journey starts here.
        </p>

        <div className="dashboard-user">
          Logged in as <strong>{email}</strong>
        </div>

        <div className="dashboard-actions">
          <Link to="/expenses" className="dashboard-action">
            My Expenses <span>↗</span>
          </Link>

          <Link to="/income" className="dashboard-action">
            My Income <span>↗</span>
          </Link>

          <Link to="/budget" className="dashboard-action">
            My Budget <span>↗</span>
          </Link>
        </div>
      </section>

      <section className="dashboard-summary">
        <div className="dashboard-summary-heading">
          <div>
            <span className="dashboard-kicker">
              MONTHLY OVERVIEW
            </span>
            <h2>Your money at a glance</h2>
          </div>
        </div>

        {loading ? (
          <p className="dashboard-loading">
            Loading your financial summary...
          </p>
        ) : (
          <>
            <div className="dashboard-summary-grid">
              <article className="dashboard-summary-card">
                <span className="summary-card-label">
                  Monthly income
                </span>
                <strong className="summary-card-value income-value">
                  {formatMoney(income)}
                </strong>
                <span className="summary-card-note">
                  Income recorded this month
                </span>
              </article>

              <article className="dashboard-summary-card">
                <span className="summary-card-label">
                  Monthly expenses
                </span>
                <strong className="summary-card-value">
                  {formatMoney(expenses)}
                </strong>
                <span className="summary-card-note">
                  Expenses recorded this month
                </span>
              </article>

              <article className="dashboard-summary-card">
                <span className="summary-card-label">
                  Budget remaining
                </span>
                <strong
                  className={`summary-card-value ${
                    remainingBudget < 0
                      ? 'expense-value'
                      : 'income-value'
                  }`}
                >
                  {formatMoney(remainingBudget)}
                </strong>
                <span className="summary-card-note">
                  {budget > 0
                    ? 'From your monthly budget'
                    : 'Set a budget to start tracking'}
                </span>
              </article>

              <article className="dashboard-summary-card">
                <span className="summary-card-label">
                  Income minus expenses
                </span>
                <strong
                  className={`summary-card-value ${
                    savings < 0
                      ? 'expense-value'
                      : 'income-value'
                  }`}
                >
                  {formatMoney(savings)}
                </strong>
                <span className="summary-card-note">
                  Your monthly difference
                </span>
              </article>
            </div>

            <section className="dashboard-chart-card">
              <div className="dashboard-chart-heading">
                <div>
                  <span className="dashboard-kicker">
                    SPENDING ACTIVITY
                  </span>
                  <h2>Monthly expense chart</h2>
                  <p>{currentMonth}</p>
                </div>

                <div className="chart-total">
                  <span>Total spent</span>
                  <strong>{formatMoney(expenses)}</strong>
                </div>
              </div>

              <div className="weekly-chart">
                {weeklyExpenses.map((amount, index) => {
                  const barHeight =
                    amount > 0
                      ? Math.max(
                          (amount / maximumWeeklyExpense) * 100,
                          6
                        )
                      : 0

                  return (
                    <div
                      className="weekly-chart-column"
                      key={index}
                    >
                      <span className="weekly-chart-amount">
                        {amount > 0
                          ? formatMoney(amount)
                          : '₹0'}
                      </span>

                      <div className="weekly-chart-bar-area">
                        <div
                          className={`weekly-chart-bar ${
                            amount > 0 ? 'has-expenses' : ''
                          }`}
                          style={{
                            height: `${barHeight}%`,
                          }}
                        />
                      </div>

                      <span className="weekly-chart-label">
                        Week {index + 1}
                      </span>
                    </div>
                  )
                })}
              </div>

              {expenses === 0 && (
                <p className="chart-empty-message">
                  No expenses recorded this month yet.
                  Add an expense to see your spending chart.
                </p>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  )
}

export default Dashboard
