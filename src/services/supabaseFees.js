/**
 * Supabase Fees Service
 * All database operations for the Fees Collection module
 * 
 * This file handles:
 * - Fetching students with batch and fee information
 * - Creating and updating fee records
 * - Calculating fee statistics
 * - Retrieving fee history
 */

import { supabase } from './supabaseClient'

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Get current month in format 'YYYY-MM'
 * @returns {string} Current month
 */
export const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Fetch all students enrolled in a batch with their fee information
 * Joins: student -> enrollment -> batch -> fees
 * 
 * @returns {Promise<Array>} Array of students with enrollment and batch data
 */
export const fetchStudentsWithFees = async () => {
  try {
    const currentMonth = getCurrentMonth()

    // Fetch all enrollments with student and batch data
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollment')
      .select(
        `
        enrollment_id,
        student_id,
        batch_id,
        enrollment_date,
        student:student_id (
          student_id,
          name,
          
          parent_email
        ),
        batch:batch_id (
          batch_id,
          batch_name,
          grade,
          subject,
          fee_amount,
          status
        )
        `
      )
      //.eq('student.status', 'active')
      .order('student.name', { ascending: true })

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError)
      throw new Error('Failed to fetch students')
    }

    if (!enrollments || enrollments.length === 0) {
      return []
    }

    // Extract unique batch IDs
    const batchIds = [...new Set(enrollments.map((e) => e.batch_id))]

    // Fetch fees for current month for all students in these batches
    const { data: feesData, error: feesError } = await supabase
      .from('fees')
      .select('student_id, batch_id, month, amount, paid_amount, status, payment_date')
      .in('batch_id', batchIds)
      .eq('month', currentMonth)

    if (feesError && feesError.code !== 'PGRST116') {
      console.error('Error fetching fees:', feesError)
    }

    // Create a map for quick fee lookup
    const feesMap = {}
    if (feesData) {
      feesData.forEach((fee) => {
        const key = `${fee.student_id}-${fee.batch_id}`
        feesMap[key] = fee
      })
    }

    // Transform and enrich enrollment data with fee information
    const studentsWithFees = enrollments.map((enrollment) => {
      const feeKey = `${enrollment.student_id}-${enrollment.batch_id}`
      const fee = feesMap[feeKey]

      // Calculate due amount
      const feeAmount = enrollment.batch.fee_amount || 0
      let dueAmount = feeAmount

      if (fee) {
        dueAmount = feeAmount - fee.paid_amount
      }

      // Determine fee status
      let feeStatus = 'Pending'
      if (fee) {
        feeStatus = fee.status
      }

      return {
        enrollment_id: enrollment.enrollment_id,
        student_id: enrollment.student_id,
        student_name: enrollment.student.student_name,
        phone: enrollment.student.phone,
        email: enrollment.student.email,
        batch_id: enrollment.batch_id,
        batch_name: enrollment.batch.batch_name,
        grade: enrollment.batch.grade,
        subject: enrollment.batch.subject,
        fee_amount: feeAmount,
        paid_amount: fee ? fee.paid_amount : 0,
        due_amount: dueAmount,
        status: feeStatus, // 'Paid', 'Partial', 'Pending'
        payment_date: fee ? fee.payment_date : null,
        fee_id: fee ? fee.fee_id : null,
        has_fee_record: !!fee,
      }
    })

    return studentsWithFees
  } catch (error) {
    console.error('Error in fetchStudentsWithFees:', error)
    throw error
  }
}

/**
 * Get fee summary for current month
 * Returns total collected and pending amounts
 * 
 * @param {number} batchId - Optional batch ID to filter by
 * @returns {Promise<Object>} {totalCollected: number, totalPending: number, totalDue: number}
 */
export const getFeeSummary = async (batchId = null) => {
  try {
    const currentMonth = getCurrentMonth()

    // Get all fee records for current month
    let query = supabase
      .from('fees')
      .select('amount, paid_amount, status, batch_id')
      .eq('month', currentMonth)

    // Filter by batch if provided
    if (batchId) {
      query = query.eq('batch_id', batchId)
    }

    const { data: fees, error } = await query

    if (error) {
      console.error('Error fetching fee summary:', error)
      throw error
    }

    // Calculate totals
    let totalCollected = 0
    let totalDue = 0

    if (fees) {
      fees.forEach((fee) => {
        totalCollected += fee.paid_amount || 0
        totalDue += fee.amount - (fee.paid_amount || 0)
      })
    }

    // Get total expected amount
    let totalQuery = supabase
      .from('fees')
      .select('amount')
      .eq('month', currentMonth)

    if (batchId) {
      totalQuery = totalQuery.eq('batch_id', batchId)
    }

    const { data: allFees, error: totalError } = await totalQuery

    if (totalError) {
      console.error('Error fetching total fees:', totalError)
    }

    let totalExpected = 0
    if (allFees) {
      totalExpected = allFees.reduce((sum, fee) => sum + (fee.amount || 0), 0)
    }

    return {
      thisMonthCollection: totalCollected,
      pendingAmount: totalDue,
      totalExpected,
    }
  } catch (error) {
    console.error('Error in getFeeSummary:', error)
    throw error
  }
}

/**
 * Get pending fees (where status != 'Paid')
 * 
 * @returns {Promise<Array>} Array of students with pending fees
 */
export const getPendingFees = async (batchId = null) => {
  try {
    const currentMonth = getCurrentMonth()

    let query = supabase
      .from('fees')
      .select(
        `
        fee_id,
        student_id,
        batch_id,
        amount,
        paid_amount,
        status,
        student:student_id (
          student_name,
          phone
        ),
        batch:batch_id (
          batch_name,
          grade
        )
        `
      )
      .eq('month', currentMonth)
      .neq('status', 'Paid')

    // Filter by batch if provided
    if (batchId) {
      query = query.eq('batch_id', batchId)
    }

    const { data, error } = await query.order('student.student_name', { ascending: true })

    if (error) {
      console.error('Error fetching pending fees:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getPendingFees:', error)
    throw error
  }
}

/**
 * Get fee history for a specific student
 * 
 * @param {number} studentId - Student ID
 * @returns {Promise<Array>} Array of historical fee records
 */
export const getFeeHistory = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('fees')
      .select(
        `
        fee_id,
        month,
        amount,
        paid_amount,
        status,
        payment_date,
        batch:batch_id (
          batch_name
        )
        `
      )
      .eq('student_id', studentId)
      .order('month', { ascending: false })

    if (error) {
      console.error('Error fetching fee history:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getFeeHistory:', error)
    throw error
  }
}

/**
 * Get all payment history (across all students and months)
 * 
 * @returns {Promise<Array>} Array of all fee records with student and batch info
 */
export const getAllPaymentHistory = async () => {
  try {
    const { data, error } = await supabase
      .from('fees')
      .select(
        `
        fee_id,
        month,
        amount,
        paid_amount,
        status,
        payment_date,
        student:student_id (
          student_name,
          phone
        ),
        batch:batch_id (
          batch_name,
          grade
        )
        `
      )
      .order('payment_date', { ascending: false })
      .limit(100) // Get last 100 transactions

    if (error) {
      console.error('Error fetching payment history:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllPaymentHistory:', error)
    throw error
  }
}

// ============================================================================
// CREATE/UPDATE FUNCTIONS
// ============================================================================

/**
 * Create a new fee record
 * 
 * @param {object} feeData - Fee data {student_id, batch_id, month, amount}
 * @returns {Promise<object>} Created fee record
 */
export const createFeeRecord = async (feeData) => {
  try {
    const { student_id, batch_id, month, amount } = feeData

    const { data, error } = await supabase.from('fees').insert({
      student_id,
      batch_id,
      month,
      amount,
      paid_amount: 0,
      status: 'Pending',
      created_at: new Date(),
      updated_at: new Date(),
    })

    if (error) {
      console.error('Error creating fee record:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createFeeRecord:', error)
    throw error
  }
}

/**
 * Collect fee for a student (Create or Update fee record)
 * Handles the complete fee collection workflow
 * 
 * @param {object} feeData - {student_id, batch_id, amount_to_collect, total_fee_amount}
 * @returns {Promise<object>} {success, message, fee_id, status}
 */
export const collectFee = async (feeData) => {
  try {
    const { student_id, batch_id, amount_to_collect, total_fee_amount } = feeData
    const currentMonth = getCurrentMonth()

    // Validate input
    if (!student_id || !batch_id || !amount_to_collect) {
      throw new Error('Missing required fields')
    }

    if (amount_to_collect <= 0) {
      throw new Error('Amount must be greater than 0')
    }

    if (amount_to_collect > total_fee_amount) {
      throw new Error('Amount cannot exceed total fee')
    }

    // Check if fee record exists for this student, batch, and month
    const { data: existingFee, error: fetchError } = await supabase
      .from('fees')
      .select('fee_id, paid_amount')
      .eq('student_id', student_id)
      .eq('batch_id', batch_id)
      .eq('month', currentMonth)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected for new fees)
      console.error('Error checking existing fee:', fetchError)
      throw new Error('Failed to check existing fee record')
    }

    let newPaidAmount = amount_to_collect
    let feeId = null

    if (existingFee) {
      // Update existing fee record
      newPaidAmount = (existingFee.paid_amount || 0) + amount_to_collect

      // Prevent overpayment (paid amount should not exceed total fee)
      if (newPaidAmount > total_fee_amount) {
        throw new Error('Total payment would exceed fee amount')
      }

      // Determine new status
      let newStatus = 'Partial'
      if (newPaidAmount >= total_fee_amount) {
        newStatus = 'Paid'
      }

      const { data, error } = await supabase
        .from('fees')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          payment_date: new Date(),
          updated_at: new Date(),
        })
        .eq('fee_id', existingFee.fee_id)
        .select()

      if (error) {
        console.error('Error updating fee record:', error)
        throw error
      }

      feeId = existingFee.fee_id
    } else {
      // Create new fee record
      const newStatus = amount_to_collect >= total_fee_amount ? 'Paid' : 'Partial'

      const { data, error } = await supabase
        .from('fees')
        .insert({
          student_id,
          batch_id,
          month: currentMonth,
          amount: total_fee_amount,
          paid_amount: amount_to_collect,
          status: newStatus,
          payment_date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        })
        .select()

      if (error) {
        console.error('Error creating fee record:', error)
        throw error
      }

      if (data && data.length > 0) {
        feeId = data[0].fee_id
      }
    }

    // Determine final status
    const finalStatus =
      newPaidAmount >= total_fee_amount
        ? 'Paid'
        : newPaidAmount > 0
          ? 'Partial'
          : 'Pending'

    return {
      success: true,
      message: 'Fee collected successfully',
      fee_id: feeId,
      status: finalStatus,
      paid_amount: newPaidAmount,
      due_amount: Math.max(0, total_fee_amount - newPaidAmount),
    }
  } catch (error) {
    console.error('Error in collectFee:', error)
    return {
      success: false,
      message: error.message || 'Failed to collect fee',
      error: error,
    }
  }
}

/**
 * Update fee record
 * 
 * @param {number} feeId - Fee ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated fee record
 */
export const updateFeeRecord = async (feeId, updates) => {
  try {
    const { data, error } = await supabase
      .from('fees')
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .eq('fee_id', feeId)
      .select()

    if (error) {
      console.error('Error updating fee record:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in updateFeeRecord:', error)
    throw error
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a fee record exists for a specific student, batch, and month
 * 
 * @param {number} studentId - Student ID
 * @param {number} batchId - Batch ID
 * @param {string} month - Month in format 'YYYY-MM'
 * @returns {Promise<object|null>} Fee record or null
 */
export const checkFeeExists = async (studentId, batchId, month) => {
  try {
    const { data, error } = await supabase
      .from('fees')
      .select('fee_id, paid_amount, status')
      .eq('student_id', studentId)
      .eq('batch_id', batchId)
      .eq('month', month)
      .single()

    if (error && error.code === 'PGRST116') {
      // No rows found
      return null
    }

    if (error) {
      console.error('Error checking fee:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in checkFeeExists:', error)
    throw error
  }
}
