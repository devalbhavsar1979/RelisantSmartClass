import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { UserProvider, UserContext } from './contexts/UserContext'
import Login from './pages/Login'
import RegisterGroupTuition from './pages/RegisterGroupTuition'
import Dashboard from './pages/Dashboard'
import Batches from './pages/Batches'
import AddBatch from './pages/AddBatch'
import AddStudent from './pages/AddStudent'
import Students from './pages/Students'
import Attendance from './pages/Attendance'
import Fees from './pages/Fees'
import Communication from './pages/Communication'
import { clearUserFromStorage } from './services/supabaseClient'

/**
 * Main App Component
 * Handles routing and authentication logic
 * Provides UserContext to all child components for multi-tenant data
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
   * Handle logout by clearing auth status and user data
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
    <UserProvider>
      <Router>
        <Routes>
          {/* If user is logged in, show Dashboard; otherwise show Login */}
          {isLoggedIn ? (
            <>
              <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
              <Route path="/batches" element={<Batches onLogout={handleLogout} />} />
              <Route path="/batches/add" element={<AddBatch onLogout={handleLogout} />} />
              <Route path="/batches/edit" element={<AddBatch onLogout={handleLogout} />} />
              <Route path="/students" element={<Students onLogout={handleLogout} />} />
              <Route path="/students/add" element={<AddStudent onLogout={handleLogout} />} />
              <Route path="/attendance" element={<Attendance onLogout={handleLogout} />} />
              <Route path="/fees" element={<Fees onLogout={handleLogout} />} />
              <Route path="/communication" element={<Communication onLogout={handleLogout} />} />
              {/* Redirect any other route to dashboard if logged in */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Login onLogin={handleLogin} />} />
              <Route path="/register-group-tuition" element={<RegisterGroupTuition />} />
              {/* Redirect any other route to login if not logged in */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App
