import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Batches from './pages/Batches'
import AddBatch from './pages/AddBatch'
import { clearUserFromStorage } from './services/supabaseClient'

/**
 * Main App Component
 * Handles routing and authentication logic
 */
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('isLoggedIn')
    if (storedAuth === 'true') {
      setIsLoggedIn(true)
    }
    setIsLoading(false)
  }, [])

  /**
   * Handle login by storing auth status in localStorage
   */
  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true')
    setIsLoggedIn(true)
  }

  /**
   * Handle logout by clearing auth status and user data from localStorage
   */
  const handleLogout = () => {
    clearUserFromStorage()
    setIsLoggedIn(false)
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* If user is logged in, show Dashboard; otherwise show Login */}
        {isLoggedIn ? (
          <>
            <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
            <Route path="/batches" element={<Batches onLogout={handleLogout} />} />
            <Route path="/batches/add" element={<AddBatch onLogout={handleLogout} />} />
            {/* Redirect any other route to dashboard if logged in */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Login onLogin={handleLogin} />} />
            {/* Redirect any other route to login if not logged in */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Router>
  )
}

export default App
