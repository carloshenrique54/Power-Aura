import "../styles/header.css"

function Header({ totalAvistamentos, animesUnicos }) {
  return (
    <header className="app-header">
      <div className="logo">
        <div>
          <div className="logo-text">POWER AURA</div>
          <div className="header-subtitle">Portal de Caçapava</div>
        </div>
      </div>
      <div className="header-stats">
        <div className="header-stat">
          <span className="header-stat-value">{totalAvistamentos}</span>
          <span className="header-stat-label">avistamentos</span>
        </div>
        <div className="header-stat">
          <span className="header-stat-value">{animesUnicos}</span>
          <span className="header-stat-label">animes</span>
        </div>
      </div>
    </header>
  )
}

export default Header