import '../styles/components/Header.css'
import RelisantLogo from '../components/images/RelisantSmartClass.png'

/**
 * Header Component
 * Displays app title and logout button
 */
function Header({ onLogout }) {
  return (
    <header className="header">
      <div className="header-content">
        {/* App Title and Logo */}
        <div className="header-left">
           <img 
             src={RelisantLogo} 
             alt="Relisant Smart Class Logo" 
             height={80} 
             width={80}
             className="logo-image"
           />
                     
          <h1 className="header-title">Relisant Smart Class</h1>
        </div>

        {/* Logout Button */}
        <button
          className="logout-btn"
          onClick={onLogout}
          title="Logout from the application"
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default Header
