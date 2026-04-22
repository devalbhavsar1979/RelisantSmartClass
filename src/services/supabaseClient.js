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

/**
 * Register a new group tuition and create primary login user
 * 
 * Steps:
 * 1. Insert group tuition details into group_tuition table
 * 2. Create auth user in Supabase Auth
 * 3. Insert user record into users table with admin role
 * 
 * @param {object} groupData - Group tuition registration data
 * @param {string} groupData.groupName - Name of the group tuition
 * @param {string} groupData.address - Address of the group tuition
 * @param {string} groupData.contactNumber - Contact number of group tuition
 * @param {string} groupData.contactPersonName - Name of contact person
 * @param {string} groupData.contactPersonNumber - Phone of contact person
 * @param {string} groupData.primaryEmail - Email for primary login user
 * @param {string} groupData.password - Password for primary login user (min 6 chars)
 * 
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function registerGroupTuition(groupData) {
  try {
    const {
      groupName,
      address,
      contactNumber,
      contactPersonName,
      contactPersonNumber,
      primaryEmail,
      password
    } = groupData

    // Step 1: Insert into group_tuition table
    const { data: groupData_result, error: groupError } = await supabase
      .from('group_tuition')
      .insert([{
        group_name: groupName,
        address: address,
        contact_number: contactNumber,
        contact_person_name: contactPersonName,
        contact_person_number: contactPersonNumber,
        primary_email: primaryEmail
      }])
      .select()

    if (groupError) {
      console.error('Group tuition insert error:', groupError)
      return {
        success: false,
        data: null,
        error: `Failed to register group tuition: ${groupError.message}`
      }
    }

    if (!groupData_result || groupData_result.length === 0) {
      return {
        success: false,
        data: null,
        error: 'Failed to retrieve inserted group tuition data'
      }
    }

    const groupTuitionId = groupData_result[0].group_tuition_id

    // Step 2: Create Supabase Auth user
    // Note: Using supabase.auth.signUp() if you want email verification
    // or a backend endpoint if you want to bypass verification
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: primaryEmail,
      password: password
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      // If auth user creation fails, we should ideally delete the group tuition
      // But for now, we'll just return the error
      return {
        success: false,
        data: null,
        error: `Failed to create login account: ${authError.message}`
      }
    }

    // Step 3: Insert into users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        email: primaryEmail,
        full_name: contactPersonName,
        role: 'admin',
        group_tuition_id: groupTuitionId,
        is_active: true,
        hashed_password: password // For development - in production use bcrypt
      }])
      .select()

    if (userError) {
      console.error('User insert error:', userError)
      return {
        success: false,
        data: null,
        error: `Failed to create user record: ${userError.message}`
      }
    }

    // Success - return group tuition data
    return {
      success: true,
      data: {
        groupTuitionId: groupTuitionId,
        groupName: groupName,
        primaryEmail: primaryEmail
      },
      error: null
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      data: null,
      error: error.message || 'An unexpected error occurred during registration'
    }
  }
}

/**
 * Fetch user data including user record and group tuition data
 * Used in UserContext to load complete user information
 * 
 * @param {string} email - User email address
 * @returns {Promise<{user: object|null, groupData: object|null, error: string|null}>}
 */
export async function fetchUserDataByEmail(email) {
  try {
    // Fetch user record from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError) {
      console.error('Error fetching user record:', userError)
      return {
        user: null,
        groupData: null,
        error: `Failed to load user data: ${userError.message}`
      }
    }

    if (!userData) {
      return {
        user: null,
        groupData: null,
        error: 'User record not found'
      }
    }

    // Fetch group tuition data if user has group_tuition_id
    let groupData = null
    if (userData.group_tuition_id) {
      const { data: groupRecord, error: groupError } = await supabase
        .from('group_tuition')
        .select('*')
        .eq('group_tuition_id', userData.group_tuition_id)
        .single()

      if (groupError) {
        console.error('Error fetching group data:', groupError)
        // Don't fail if group data fetch fails, it's optional
      } else {
        groupData = groupRecord
      }
    }

    return {
      user: userData,
      groupData: groupData,
      error: null
    }
  } catch (error) {
    console.error('Unexpected error fetching user data:', error)
    return {
      user: null,
      groupData: null,
      error: error.message || 'An unexpected error occurred'
    }
  }
}

/**
 * Fetch batches for a specific group tuition
 * Used for multi-tenant batch filtering
 * 
 * @param {number} groupTuitionId - ID of the group tuition
 * @returns {Promise<{data: array|null, error: string|null}>}
 */
export async function fetchBatchesByGroup(groupTuitionId) {
  try {
    const { data, error } = await supabase
      .from('batch')
      .select('*')
      .eq('group_tuition_id', groupTuitionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching batches:', error)
      return {
        data: null,
        error: `Failed to load batches: ${error.message}`
      }
    }

    return {
      data: data || [],
      error: null
    }
  } catch (error) {
    console.error('Unexpected error fetching batches:', error)
    return {
      data: null,
      error: error.message || 'An unexpected error occurred'
    }
  }
}

/**
 * Insert a new batch with group_tuition_id
 * Ensures batch is associated with the correct group
 * 
 * @param {object} batchData - Batch data to insert
 * @param {number} groupTuitionId - ID of the group tuition
 * @returns {Promise<{data: object|null, error: string|null}>}
 */
export async function insertBatchWithGroup(batchData, groupTuitionId) {
  try {
    const { data, error } = await supabase
      .from('batch')
      .insert([{
        ...batchData,
        group_tuition_id: groupTuitionId
      }])
      .select()

    if (error) {
      console.error('Error inserting batch:', error)
      return {
        data: null,
        error: `Failed to create batch: ${error.message}`
      }
    }

    return {
      data: data ? data[0] : null,
      error: null
    }
  } catch (error) {
    console.error('Unexpected error inserting batch:', error)
    return {
      data: null,
      error: error.message || 'An unexpected error occurred'
    }
  }
}

/**
 * Update a batch with group_tuition_id verification
 * Ensures batch can only be updated by the correct group
 * 
 * @param {number} batchId - ID of the batch to update
 * @param {object} batchData - Data to update
 * @param {number} groupTuitionId - ID of the group tuition (for verification)
 * @returns {Promise<{data: object|null, error: string|null}>}
 */
export async function updateBatchWithGroup(batchId, batchData, groupTuitionId) {
  try {
    const { data, error } = await supabase
      .from('batch')
      .update(batchData)
      .eq('batch_id', batchId)
      .eq('group_tuition_id', groupTuitionId)
      .select()

    if (error) {
      console.error('Error updating batch:', error)
      return {
        data: null,
        error: `Failed to update batch: ${error.message}`
      }
    }

    if (!data || data.length === 0) {
      return {
        data: null,
        error: 'Batch not found or you do not have permission to update it'
      }
    }

    return {
      data: data[0],
      error: null
    }
  } catch (error) {
    console.error('Unexpected error updating batch:', error)
    return {
      data: null,
      error: error.message || 'An unexpected error occurred'
    }
  }
}

/**
 * Delete a batch with group_tuition_id verification
 * Ensures batch can only be deleted by the correct group
 * 
 * @param {number} batchId - ID of the batch to delete
 * @param {number} groupTuitionId - ID of the group tuition (for verification)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteBatchWithGroup(batchId, groupTuitionId) {
  try {
    const { error } = await supabase
      .from('batch')
      .delete()
      .eq('batch_id', batchId)
      .eq('group_tuition_id', groupTuitionId)

    if (error) {
      console.error('Error deleting batch:', error)
      return {
        success: false,
        error: `Failed to delete batch: ${error.message}`
      }
    }

    return {
      success: true,
      error: null
    }
  } catch (error) {
    console.error('Unexpected error deleting batch:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    }
  }
}

