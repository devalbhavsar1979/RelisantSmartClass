# Supabase Authentication - Code Reference

This document shows the complete code for all files related to Supabase authentication.

---

## 1. supabaseClient.js

**Location:** `src/services/supabaseClient.js`

```javascript
import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Client Configuration
 * Initializes the Supabase client for database and authentication operations
 * 
 * Environment Variables Required:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous public key
 * 
 * To get these values:
 * 1. Go to https://supabase.com/dashboard
 * 2. Select your project
 * 3. Click "Settings" > "API"
 * 4. Copy the Project URL
 * 5. Copy the anon/public key under "Project API keys"
 * 6. Add them to your .env file
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate that required environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file')
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Helper function to authenticate a user
 * 
 * @param {string} email - User email
 * @param {string} password - User password (plain text)
 * @returns {Promise<{user: object|null, error: string|null}>}
 * 
 * SECURITY NOTE:
 * In production, password comparison should be done on the backend using bcrypt.
 * This implementation queries the user and compares passwords client-side for demonstration.
 */
export async function authenticateUser(email, password) {
  try {
    // Query the users table for the user with matching email and is_active = true
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)

    if (queryError) {
      console.error('Database query error:', queryError)
      return {
        user: null,
        error: 'Unable to connect to database. Please try again.'
      }
    }

    // Check if user exists
    if (!users || users.length === 0) {
      return {
        user: null,
        error: 'Invalid email or password'
      }
    }

    const user = users[0]

    // TODO: PRODUCTION PASSWORD VALIDATION
    // Simple comparison (DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION)
    const isPasswordValid = password === user.hashed_password

    if (!isPasswordValid) {
      return {
        user: null,
        error: 'Invalid email or password'
      }
    }

    // Remove sensitive data from the user object
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    }

    return {
      user: safeUser,
      error: null
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      user: null,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export function getCurrentUser() {
  try {
    const userJson = localStorage.getItem('user')
    return userJson ? JSON.parse(userJson) : null
  } catch (error) {
    console.error('Error retrieving current user:', error)
    return null
  }
}

export function saveUserToStorage(user) {
  try {
    localStorage.setItem('user', JSON.stringify(user))
  } catch (error) {
    console.error('Error saving user to storage:', error)
  }
}

export function clearUserFromStorage() {
  try {
    localStorage.removeItem('user')
    localStorage.removeItem('isLoggedIn')
  } catch (error) {
    console.error('Error clearing user from storage:', error)
  }
}
```

---

## 2. Updated Login.jsx

**Location:** `src/pages/Login.jsx`

Key changes:
- Changed from `username` to `email` field
- Integrated `authenticateUser()` function
- Real API calls to Supabase
- User session storage
- Proper error handling

```javascript
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
```

---

## 3. Updated App.jsx

**Location:** `src/App.jsx`

Key changes:
- Added import for `clearUserFromStorage`
- Updated logout handler to clear all user data

```javascript
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
```

---

## 4. .env File Template

**Location:** `.env`

```env
# Supabase Configuration
# Get these values from https://supabase.com/dashboard

VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 5. Database Schema (SQL)

Run this in Supabase SQL Editor to create the users table:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Insert test users (for development)
INSERT INTO users (email, hashed_password, name, is_active)
VALUES 
  ('test@example.com', 'password123', 'Test User', true),
  ('admin@relisantsmartclass.com', 'admin123', 'Admin User', true);
```

---

## Summary of Changes

| Component | What Changed |
|-----------|--------------|
| Login Form | Username → Email input field |
| Authentication | Mock login → Real Supabase queries |
| Password Validation | Hardcoded → Database lookup |
| Session Storage | Simple flag → User object + flag |
| Logout | Clear flag → Clear all user data |
| Error Messages | Generic → Specific database errors |

---

## Testing the Implementation

1. **Setup:**
   ```bash
   npm install  # Install dependencies
   ```

2. **Configure:**
   - Copy `.env.example` to `.env`
   - Add Supabase credentials

3. **Create Database:**
   - Run SQL schema in Supabase

4. **Test:**
   ```bash
   npm run dev
   ```
   - Login with `test@example.com` / `password123`
   - Check localStorage for user data

5. **Production:**
   - Implement bcrypt password validation
   - Add environment variables to Vercel
   - Deploy: `vercel --prod`

---

## Notes

- ✅ All environment variables are properly consumed from `.env`
- ✅ User data persists across page refreshes
- ✅ Logout clears all session data
- ✅ Errors are user-friendly
- ⚠️ Password validation needs bcrypt in production
- ⚠️ Never commit `.env` file (it's in `.gitignore`)

For complete setup instructions, see `SUPABASE_SETUP.md`
