import { createContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

/**
 * UserContext
 * Global context for storing authenticated user information
 * Provides user details, group tuition data, and authentication state
 * 
 * Context values:
 * - user: Current authenticated user object
 * - userData: User record from users table (email, full_name, group_tuition_id, role, is_active)
 * - groupData: Group tuition information (group_tuition_id, group_name, address, etc.)
 * - isLoading: Boolean indicating if user data is still loading
 * - error: Error message if any occurred during fetch
 * - fetchUserData: Function to fetch/refresh user data
 * - logout: Function to clear user data
 */
export const UserContext = createContext()

/**
 * UserProvider Component
 * Wraps the app and provides user context to all child components
 * Manages authentication state and multi-tenant user data
 * Automatically fetches user data on mount
 */
export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [groupData, setGroupData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Fetch user data from Supabase tables
   * Works with custom authentication (email stored in localStorage)
   * 
   * Steps:
   * 1. Get email from localStorage (from login)
   * 2. Fetch user record from users table by email
   * 3. Fetch group tuition data using group_tuition_id
   * 4. Store all data in context
   */
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Step 1: Get email from localStorage (custom auth, not Supabase Auth)
      const storedUser = localStorage.getItem('user')
      if (!storedUser) {
        console.log('No user stored in localStorage')
        setUser(null)
        setUserData(null)
        setGroupData(null)
        setIsLoading(false)
        return
      }

      const parsedUser = JSON.parse(storedUser)
      const userEmail = parsedUser.email

      if (!userEmail) {
        console.log('No email found in stored user')
        setUser(null)
        setUserData(null)
        setGroupData(null)
        setIsLoading(false)
        return
      }

      console.log('Fetching user data for email:', userEmail)
      setUser(parsedUser)

      // Step 2: Fetch user record from users table using email
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single()

      if (userError) {
        console.error('Error fetching user record:', userError)
        setError(`Failed to load user data: ${userError.message}`)
        setIsLoading(false)
        return
      }

      if (!userRecord) {
        console.warn('User record not found in users table')
        setError('User record not found. Please contact support.')
        setIsLoading(false)
        return
      }

      console.log('User record fetched:', userRecord)
      setUserData(userRecord)

      // Step 3: Fetch group tuition data using group_tuition_id
      if (userRecord.group_tuition_id) {
        console.log('Fetching group data for group_tuition_id:', userRecord.group_tuition_id)
        const { data: groupRecord, error: groupError } = await supabase
          .from('group_tuition')
          .select('*')
          .eq('group_tuition_id', userRecord.group_tuition_id)
          .single()

        if (groupError) {
          console.error('Error fetching group data:', groupError)
          // Don't set error here, group data is optional
        } else if (groupRecord) {
          console.log('Group data fetched:', groupRecord)
          setGroupData(groupRecord)
        } else {
          console.warn('No group data returned')
        }
      } else {
        console.warn('User has no group_tuition_id')
      }

      setIsLoading(false)
      console.log('User data fetch complete')
    } catch (err) {
      console.error('Unexpected error fetching user data:', err)
      setError(err.message || 'An unexpected error occurred')
      setIsLoading(false)
    }
  }, [])

  /**
   * Fetch user data automatically on component mount
   * This ensures user data is available as soon as the app loads
   */
  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  /**
   * Logout function
   * Clears all user data from context
   */
  const logout = useCallback(() => {
    setUser(null)
    setUserData(null)
    setGroupData(null)
    setError(null)
  }, [])

  const value = {
    user,
    userData,
    groupData,
    isLoading,
    error,
    fetchUserData,
    logout
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
