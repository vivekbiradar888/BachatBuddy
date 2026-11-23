
import './App.css'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <main className="site" id="top">
      <nav className="navbar">
        <a href="#top" className="brand">
          <span className="brand-hindi">बचत</span>
          <span className="brand-english">Buddy</span>
        </a>

        <div className="nav-links">
          <a className="active" href="#top">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-actions">
          <Link className="login-link" to="/login">Log in</Link>
          <Link className="nav-button" to="/signup">
          Get started <span>↗</span>
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot"></span>
            YOUR MONEY, YOUR RULES
          </div>

          <h1>
            Make your money
            <br />
            <span className="heading-highlight">work smarter.</span>
          </h1>

          <p className="hero-description">
            Track your expenses, plan your budget, and split bills
            with friends—all in one place.
          </p>

          <div className="hero-buttons">
            <Link to="/signup" className="primary-button">
            Start saving <span>↗</span>
            </Link>
            <a href="#features" className="secondary-button">
              Explore features <span>→</span>
            </a>
          </div>

          <div className="hero-note">
            <span className="note-check">✓</span>
            Made for everyday money decisions
          </div>
        </div>

        {/* DASHBOARD PREVIEW */}
        <div className="dashboard-preview">
          <div className="preview-top">
            <div>
              <span className="preview-label">YOUR OVERVIEW</span>
              <h3>Money snapshot</h3>
            </div>
            <span className="month-pill">This month⌄</span>
          </div>

          <div className="balance-card">
            <div className="balance-top">
              <span>Total balance</span>
              <span className="balance-icon">₹</span>
            </div>

            <h2>
              ₹24,850<span>.00</span>
            </h2>

            <div className="balance-bottom">
              <span className="balance-growth">↗ 8.4%</span>
              <span>vs. last month</span>
            </div>

            <div className="balance-decoration"></div>
          </div>

          <div className="preview-stats">
            <div className="stat-card">
              <div className="stat-heading">
                <span className="stat-icon purple-icon">↘</span>
                <span>Spent</span>
              </div>

              <h3>₹8,420</h3>

              <div className="stat-bar">
                <span className="bar-purple"></span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-heading">
                <span className="stat-icon lime-icon">◎</span>
                <span>Budget left</span>
              </div>

              <h3>₹6,580</h3>

              <div className="stat-bar">
                <span className="bar-lime"></span>
              </div>
            </div>
          </div>

          <div className="preview-bottom">
            <div className="mini-chart">
              <div className="chart-heading">
                <span>Spending trend</span>
                <span className="chart-period">WEEKLY</span>
              </div>

              <div className="chart-bars">
                <span style={{ height: '35%' }}></span>
                <span style={{ height: '58%' }}></span>
                <span style={{ height: '43%' }}></span>
                <span style={{ height: '76%' }}></span>
                <span style={{ height: '52%' }}></span>
                <span style={{ height: '90%' }}></span>
                <span
                  className="chart-bar-active"
                  style={{ height: '64%' }}
                ></span>
              </div>

              <div className="chart-days">
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
                <span>S</span>
              </div>
            </div>

            <div className="goal-card">
              <div className="goal-icon">✦</div>
              <span className="goal-label">Savings goal</span>
              <h4>New laptop</h4>
              <strong>65%</strong>

              <div className="goal-progress">
                <span></span>
              </div>

              <span className="goal-caption">
                ₹32,500 of ₹50,000
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features" id="features">
        <div className="section-heading">
          <span className="section-kicker">
            THE GOOD MONEY HABITS
          </span>

          <h2>
            Your money.
            <span> Better managed.</span>
          </h2>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <div className="feature-number">01</div>
            <div className="feature-symbol violet-symbol">↗</div>
            <h3>Track expenses</h3>
            <p>
              Know where your money goes, one transaction at a time.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-number">02</div>
            <div className="feature-symbol lime-symbol">◎</div>
            <h3>Plan your budget</h3>
            <p>
              Set spending limits and stay on top of your monthly goals.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-number">03</div>
            <div className="feature-symbol violet-symbol">⇄</div>
            <h3>Split with friends</h3>
            <p>
              Share bills fairly and keep track of who owes what.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-number">04</div>
            <div className="feature-symbol lime-symbol">✦</div>
            <h3>Build your savings</h3>
            <p>
              Make progress toward the things you really want.
            </p>
          </article>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-heading">
          <span className="section-kicker">SIMPLE BY DESIGN</span>

          <h2>
            A better way to
            <span> manage money.</span>
          </h2>
        </div>

        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <h3>Track it</h3>
            <p>
              Add your income and expenses to understand where your
              money goes.
            </p>
          </article>

          <article className="step-card">
            <span className="step-number">02</span>
            <h3>Plan it</h3>
            <p>
              Set your monthly budget and keep your spending on track.
            </p>
          </article>

          <article className="step-card">
            <span className="step-number">03</span>
            <h3>Share it</h3>
            <p>
              Split group expenses and keep track of shared payments.
            </p>
          </article>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="about-section" id="about">
        <span className="section-kicker">ABOUT BACHATBUDDY</span>

        <h2>
          Your money.
          <span> Your choices.</span>
        </h2>

        <p>
          BachatBuddy helps you manage your personal expenses,
          plan your budget, and share costs with friends
          without losing track of your money.
        </p>
      </section>

      {/* FOOTER — OUTSIDE THE OTHER SECTIONS */}
      <footer className="footer">
        <span>बचतBuddy</span>
        <p>Plan. Track. Grow.</p>
      </footer>
    </main>
  )
}

export default Home
