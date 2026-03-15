import { useState } from 'react'
import '../styles/pages/Login.css'
import RelisantLogo from '../components/images/RelisantSmartClass.png'
import { authenticateUser, saveUserToStorage } from '../services/supabaseClient'

/**
 * Login Component
 * Authenticates users against Supabase database
 * Stores user session in localStorage on successful login
 */
function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Handle form submission
   * Authenticates with Supabase and calls onLogin if successful
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Call Supabase authentication
      const { user, error: authError } = await authenticateUser(email, password)

      if (authError) {
        setError(authError)
        setPassword('')
        setIsLoading(false)
        return
      }

      if (user) {
        // Save user to localStorage for session persistence
        saveUserToStorage(user)
        localStorage.setItem('isLoggedIn', 'true')

        // Call the onLogin callback to update app state
        onLogin()
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setPassword('')
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo Section */}
        <div className="login-logo">
          <div className="logo-circle">
             <img 
                         src={RelisantLogo} 
                         alt="Relisant Smart Class Logo" 
                         height={80} 
                         width={80}
                         className="logo-image"
                       />
                    
      </div>
          <h1 className="header-title">Relisant Smart Class</h1>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Login Button */}
          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="demo-credentials">
          <p><strong>Testing Credentials:</strong></p>
          <p>Use any email from your Supabase users table</p>
          <p>with the matching password stored in hashed_password</p>
        </div>
      </div>
    </div>
  )
}

export default Login
