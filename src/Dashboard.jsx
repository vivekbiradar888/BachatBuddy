
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './supabase.js'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser()

      if (data.user) {
        setEmail(data.user.email)
      }
    }

    getUser()
  }, [])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
      return
    }

    navigate('/login')
  }

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

        <p>
          Your smarter money journey starts here.
        </p>

        <div className="dashboard-user">
          Logged in as <strong>{email}</strong>
        </div>
      </section>

      <section className="dashboard-placeholder">
        <div className="dashboard-placeholder-symbol">✦</div>
        <h2>Your money dashboard is coming together.</h2>
        <p>
          Soon you'll be able to track expenses, manage budgets,
          and split bills with friends from here.
        </p>
      </section>
    </main>
  )
}

export default Dashboard
