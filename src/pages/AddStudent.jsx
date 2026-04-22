import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import '../styles/pages/AddStudent.css'
import { FaArrowLeft } from 'react-icons/fa'
import { supabase } from '../services/supabaseClient'

/**
 * AddStudent Component
 * Form page for adding or editing a student in a batch
 * Integrates with Supabase database (student and enrollment tables)
 * Mobile-first responsive design
 */
function AddStudent({ onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Batch preselection from navigation state
  const preselectedBatchId = location.state?.batchId
  const preselectedBatchName = location.state?.batchName
  
  // Student data for edit mode
  const studentDataForEdit = location.state?.studentData
  const isEditMode = !!studentDataForEdit

  // Form state
  const [formData, setFormData] = useState({
    name: studentDataForEdit?.name || '',
    batch_id: preselectedBatchId || studentDataForEdit?.batch_id || '',
    gender: studentDataForEdit?.gender || '',
    dob: studentDataForEdit?.dob || '',
    school_name: studentDataForEdit?.school_name || '',
    parent_name: studentDataForEdit?.parent_name || '',
    parent_contact: studentDataForEdit?.parent_contact || ''
  })

  // Batch options fetched from Supabase
  const [batches, setBatches] = useState([])

  // Validation errors
  const [errors, setErrors] = useState({})

  // Loading and submit states
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Gender options
  const genderOptions = ['Male', 'Female', 'Other']

  /**
   * Fetch batches from Supabase on component mount
   */
  useEffect(() => {
    fetchBatches()
  }, [])

  /**
   * Fetch all active batches from Supabase
   */
  const fetchBatches = async () => {
    try {
      setIsLoading(true)

      const { data, error: supabaseError } = await supabase
        .from('batch')
        .select('batch_id, batch_name')
        .eq('status', 'Active')
        .order('batch_name', { ascending: true })

      if (supabaseError) {
        console.error('Error fetching batches:', supabaseError)
        setSubmitError('Failed to load batches. Please refresh the page.')
        setIsLoading(false)
        return
      }

      setBatches(data || [])
      setIsLoading(false)
    } catch (err) {
      console.error('Unexpected error fetching batches:', err)
      setSubmitError('An unexpected error occurred. Please refresh the page.')
      setIsLoading(false)
    }
  }

  /**
   * Handle text input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  /**
   * Handle dropdown/select changes
   */
  const handleSelectChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  /**
   * Validate form before submission
   */
  const validateForm = () => {
    const newErrors = {}

    // Student Name required
    if (!formData.name.trim()) {
      newErrors.name = 'Student name is required'
    }

    // Batch required
    if (!formData.batch_id) {
      newErrors.batch_id = 'Please select a batch'
    }

    // Gender required
    if (!formData.gender) {
      newErrors.gender = 'Gender is required'
    }

    // DOB required
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required'
    }

    // Parent Contact required and must be valid
    if (!formData.parent_contact.trim()) {
      newErrors.parent_contact = 'Parent contact number is required'
    } else if (!/^\d{10}$|^\+\d{1,3}\d{9,}$|^\d{10,}$/.test(formData.parent_contact.replace(/\D/g, ''))) {
      newErrors.parent_contact = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form submission
   * If editing: Update student record
   * If adding: Step 1: Insert student into 'student' table
   *            Step 2: Insert enrollment into 'enrollment' table
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      // Prepare student data
      const studentData = {
        name: formData.name.trim(),
        gender: formData.gender,
        dob: formData.dob,
        school_name: formData.school_name.trim() || null,
        parent_name: formData.parent_name.trim() || null,
        parent_contact: formData.parent_contact.trim()
      }

      // EDIT MODE: Update existing student
      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('student')
          .update(studentData)
          .eq('student_id', studentDataForEdit.student_id)

        if (updateError) {
          console.error('Error updating student:', updateError)
          setSubmitError(updateError.message || 'Failed to update student. Please try again.')
          setIsSubmitting(false)
          return
        }

        setShowSuccess(true)
        setTimeout(() => {
          navigate(`/students?batch_id=${formData.batch_id}`)
        }, 1500)
        return
      }

      // ADD MODE: Insert new student
      // Step 1: Insert into student table
      const { data: studentResult, error: studentError } = await supabase
        .from('student')
        .insert([studentData])
        .select('student_id')

      if (studentError) {
        console.error('Error creating student:', studentError)
        setSubmitError(studentError.message || 'Failed to create student. Please try again.')
        setIsSubmitting(false)
        return
      }

      const studentId = studentResult[0].student_id

      // Step 2: Insert into enrollment table
      const enrollmentData = {
        student_id: studentId,
        batch_id: formData.batch_id,
        enrollment_date: new Date().toISOString().split('T')[0] // Today's date
      }

      const { error: enrollmentError } = await supabase
        .from('enrollment')
        .insert([enrollmentData])

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError)
        setSubmitError(enrollmentError.message || 'Failed to enroll student. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Success
      setShowSuccess(true)

      // Redirect to students list after 1.5 seconds
      setTimeout(() => {
        navigate(`/students?batch_id=${formData.batch_id}`)
      }, 1500)
    } catch (err) {
      console.error('Unexpected error:', err)
      setSubmitError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  /**
   * Handle cancel - go back to batches
   */
  const handleCancel = () => {
    navigate('/batches')
  }

  // Show loading state while fetching batches
  if (isLoading) {
    return (
      <div className="add-student-container">
        <Header onLogout={onLogout} />
        <main className="add-student-content">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading batches...</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="add-student-container">
      {/* Header */}
      <Header onLogout={onLogout} />

      {/* Main Content */}
      <main className="add-student-content">
        {/* Page Header with Back Button */}
        <div className="page-header">
          <button className="back-btn" onClick={handleCancel} title="Go back" disabled={isSubmitting}>
            <FaArrowLeft size={20} />
          </button>
          <h1 className="page-title">{isEditMode ? 'Edit Student' : 'Add New Student'}</h1>
          <div className="spacer"></div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="success-container">
            <div className="success-message">
              ✓ Student {isEditMode ? 'updated' : 'added'} successfully! Redirecting...
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            {/* Submit Error Message */}
            {submitError && (
              <div className="form-error-container">
                <p className="form-error-message">{submitError}</p>
              </div>
            )}

            {/* Student Name */}
            <div className="form-group">
              <label htmlFor="name">Student Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Aniket Kumar"
                className={errors.name ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            {/* Batch Name */}
            <div className="form-group">
              <label htmlFor="batch_id">Batch *</label>
              <select
                id="batch_id"
                name="batch_id"
                value={formData.batch_id}
                onChange={handleSelectChange}
                className={errors.batch_id ? 'error' : ''}
                disabled={isSubmitting}
              >
                <option value="">Select a batch</option>
                {batches.map((batch) => (
                  <option key={batch.batch_id} value={batch.batch_id}>
                    {batch.batch_name}
                  </option>
                ))}
              </select>
              {errors.batch_id && <span className="error-text">{errors.batch_id}</span>}
            </div>

            {/* Gender */}
            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleSelectChange}
                className={errors.gender ? 'error' : ''}
                disabled={isSubmitting}
              >
                <option value="">Select gender</option>
                {genderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.gender && <span className="error-text">{errors.gender}</span>}
            </div>

            {/* Date of Birth */}
            <div className="form-group">
              <label htmlFor="dob">Date of Birth *</label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className={errors.dob ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.dob && <span className="error-text">{errors.dob}</span>}
            </div>

            {/* School Name */}
            <div className="form-group">
              <label htmlFor="school_name">School Name</label>
              <input
                type="text"
                id="school_name"
                name="school_name"
                value={formData.school_name}
                onChange={handleInputChange}
                placeholder="e.g., Delhi Public School"
                className={errors.school_name ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.school_name && <span className="error-text">{errors.school_name}</span>}
            </div>

            {/* Parent Name */}
            <div className="form-group">
              <label htmlFor="parent_name">Parent Name</label>
              <input
                type="text"
                id="parent_name"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleInputChange}
                placeholder="e.g., Rajesh Kumar"
                className={errors.parent_name ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.parent_name && <span className="error-text">{errors.parent_name}</span>}
            </div>

            {/* Parent Contact Number */}
            <div className="form-group">
              <label htmlFor="parent_contact">Parent Contact Number *</label>
              <input
                type="tel"
                id="parent_contact"
                name="parent_contact"
                value={formData.parent_contact}
                onChange={handleInputChange}
                placeholder="e.g., 9876543210"
                className={errors.parent_contact ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.parent_contact && <span className="error-text">{errors.parent_contact}</span>}
            </div>

            {/* Form Buttons */}
            <div className="form-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Student' : 'Save Student')}
              </button>
            </div>
          </form>
        </div>

        {/* Spacer for bottom nav */}
        <div className="nav-spacer"></div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

export default AddStudent
