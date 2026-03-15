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
 * For production use, implement:
 * 1. A backend endpoint that validates credentials using bcrypt
 * 2. Return a session token instead of storing passwords
 * 3. Use Supabase Auth instead of custom user table (recommended)
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

    // TODO: IMPORTANT - Password Validation
    // CURRENT IMPLEMENTATION: Simple string comparison (FOR TESTING ONLY)
    // PRODUCTION IMPLEMENTATION: Use bcrypt for secure comparison
    // 
    // Production code should look like:
    // const isPasswordValid = await bcrypt.compare(password, user.hashed_password)
    // 
    // For now, this assumes passwords can be compared directly for development.
    // In production, implement a backend endpoint using bcrypt:
    // 
    // Backend example (Node.js):
    // const bcrypt = require('bcrypt')
    // const isValid = await bcrypt.compare(plainPassword, hashedPassword)

    // Simple comparison (DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION)
    const isPasswordValid = password === user.hashed_password

    if (!isPasswordValid) {
      return {
        user: null,
        error: 'Invalid email or password'
      }
    }

    // Remove sensitive data from the user object before returning
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
      // Note: hashed_password is intentionally excluded
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

/**
 * Helper function to get the currently logged-in user from localStorage
 * @returns {object|null} The stored user object or null
 */
export function getCurrentUser() {
  try {
    const userJson = localStorage.getItem('user')
    return userJson ? JSON.parse(userJson) : null
  } catch (error) {
    console.error('Error retrieving current user:', error)
    return null
  }
}

/**
 * Helper function to save user to localStorage
 * @param {object} user - The user object to store
 */
export function saveUserToStorage(user) {
  try {
    localStorage.setItem('user', JSON.stringify(user))
  } catch (error) {
    console.error('Error saving user to storage:', error)
  }
}

/**
 * Helper function to clear user from localStorage (logout)
 */
export function clearUserFromStorage() {
  try {
    localStorage.removeItem('user')
    localStorage.removeItem('isLoggedIn')
  } catch (error) {
    console.error('Error clearing user from storage:', error)
  }
}
