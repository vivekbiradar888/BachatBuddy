
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './supabase.js'
import './Auth.css'

function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(
    location.pathname === '/login'
  )

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setIsLogin(location.pathname === '/login')
    setMessage('')
    setError('')
  }, [location.pathname])

  async function handleSubmit(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setError('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

       if (error) throw error

       navigate('/dashboard')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        })

        if (error) throw error

        if (data.session) {
          setMessage('Your account has been created successfully!')
        } else {
          setMessage(
            'Account created! Please check your email to confirm your account.'
          )
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one"></div>
      <div className="auth-glow auth-glow-two"></div>

      <a href="/" className="auth-brand">
        <span className="brand-hindi">बचत</span>
        <span className="brand-english">Buddy</span>
      </a>

      <section className="auth-container">
        <div className="auth-intro">
          <span className="auth-kicker">YOUR MONEY, YOUR RULES</span>
          <h1>
            Make room for<span> better money habits.</span>
          </h1>
          <p>
            A little more clarity. A little less money stress.
            Start managing your money your way.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={!isLogin ? 'selected' : ''}
              onClick={() => {
                setIsLogin(false)
                setMessage('')
                setError('')
              }}
              type="button"
            >
              Sign up
            </button>

            <button
              className={isLogin ? 'selected' : ''}
              onClick={() => {
                setIsLogin(true)
                setMessage('')
                setError('')
              }}
              type="button"
            >
              Log in
            </button>
          </div>

          <h2>{isLogin ? 'Welcome back!' : 'Create your account'}</h2>

          <p className="auth-subtitle">
            {isLogin
              ? 'Pick up where you left off.'
              : 'Your smarter money journey starts here.'}
          </p>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <label>
                Your name
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>

            {isLogin && (
              <a href="#" className="forgot-password">
                Forgot password?
              </a>
            )}

            {error && (
              <p className="auth-feedback auth-error">
                {error}
              </p>
            )}

            {message && (
              <p className="auth-feedback auth-success">
                {message}
              </p>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : isLogin
                  ? 'Log in'
                  : 'Create account'}

              {!loading && <span>↗</span>}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin
              ? "Don't have an account?"
              : 'Already have an account?'}
            {' '}

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setMessage('')
                setError('')
              }}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>

          <p className="auth-terms">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </section>

      <div className="auth-footer">
        <span>बचतBuddy</span>
        <span>Plan. Track. Grow.</span>
      </div>
    </main>
  )
}

export default Auth
