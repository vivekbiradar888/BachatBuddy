
import './PageLoader.css'

function PageLoader({ message = 'Getting things ready...' }) {
  return (
    <div className="bb-loader" role="status" aria-live="polite">
      <div className="bb-loader-visual">
        <div className="bb-loader-ring bb-loader-ring-one"></div>
        <div className="bb-loader-ring bb-loader-ring-two"></div>

        <div className="bb-loader-sparkle">✦</div>
      </div>

      <div className="bb-loader-content">
     <a href="/" className="brand bb-loader-brand">
    <span className="brand-hindi">बचत</span>
    <span className="brand-english">Buddy</span>
  </a>

        <p>{message}</p>

        <div className="bb-loader-dots" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className="bb-loader-progress">
          <span></span>
        </div>
      </div>
    </div>
  )
}

export default PageLoader
