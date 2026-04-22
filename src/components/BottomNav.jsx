import '../styles/components/BottomNav.css'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * BottomNav Component
 * Mobile-style bottom navigation bar for the app
 */
function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠', path: '/' },
    { id: 'batches', label: 'Batches', icon: '📚', path: '/batches' },
    { id: 'attendance', label: 'Attendance', icon: '✓', path: '/attendance' },
    { id: 'fees', label: 'Fees', icon: '💰', path: '/fees' },
    { id: 'communication', label: 'Communication', icon: '💬', path: '/communication' }
  ]

  const currentPath = location.pathname
  const getActiveTab = (path) => {
    return currentPath === path
  }

  const handleNavigate = (path) => {
    if (path.startsWith('/')) {
      navigate(path)
    } else {
      console.log('Navigation to:', path)
    }
  }

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <a
          key={item.id}
          onClick={() => handleNavigate(item.path)}
          className={`nav-item ${getActiveTab(item.path) ? 'active' : ''}`}
          title={item.label}
          style={{ cursor: 'pointer' }}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </a>
      ))}
    </nav>
  )
}

export default BottomNav
