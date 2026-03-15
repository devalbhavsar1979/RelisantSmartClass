import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import '../styles/pages/AddBatch.css'
import { FaArrowLeft } from 'react-icons/fa'
import { supabase } from '../services/supabaseClient'

/**
 * AddBatch Component
 * Form page for creating a new tuition batch
 * Integrates with Supabase database
 * Mobile-first responsive design
 */
function AddBatch({ onLogout }) {
  const navigate = useNavigate()

  // Form state - mapped to Supabase batch table schema
  const [formData, setFormData] = useState({
    batch_name: '',
    subject: '',
    grade: '',
    schedule: '',
    start_time: '',
    end_time: '',
    fee_amount: '',
    max_capacity: '',
    description: ''
  })

  // Validation errors
  const [errors, setErrors] = useState({})

  // Loading and success states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Subject options
  const subjectOptions = ['Maths', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Studies']

  // Grade options
  const gradeOptions = ['8th', '9th', '10th', '11th Science', '11th Commerce', '12th Science', '12th Commerce']

  // Schedule days options (will be stored as comma-separated string)
  const daysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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
   * Handle dropdown changes
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
   * Handle days selection (stored as comma-separated string)
   */
  const handleDaysChange = (day) => {
    const currentDays = formData.schedule.split(',').map(d => d.trim()).filter(d => d)
    if (currentDays.includes(day)) {
      setFormData({
        ...formData,
        schedule: currentDays.filter(d => d !== day).join(', ')
      })
    } else {
      setFormData({
        ...formData,
        schedule: [...currentDays, day].join(', ')
      })
    }
  }

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {}

    // Batch Name required
    if (!formData.batch_name.trim()) {
      newErrors.batch_name = 'Batch name is required'
    }

    // Subject required
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }

    // Grade required
    if (!formData.grade) {
      newErrors.grade = 'Grade is required'
    }

    // Start Time required
    if (!formData.start_time.trim()) {
      newErrors.start_time = 'Start time is required'
    }

    // End Time required
    if (!formData.end_time.trim()) {
      newErrors.end_time = 'End time is required'
    }

    // Fee Amount required and must be numeric
    if (!formData.fee_amount.trim()) {
      newErrors.fee_amount = 'Fee amount is required'
    } else if (isNaN(formData.fee_amount)) {
      newErrors.fee_amount = 'Fee amount must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form submission - Insert into Supabase
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      // Prepare data for Supabase insert
      const batchData = {
        batch_name: formData.batch_name.trim(),
        subject: formData.subject.trim(),
        grade: formData.grade,
        schedule: formData.schedule || null,
        start_time: formData.start_time.trim(),
        end_time: formData.end_time.trim(),
        fee_amount: parseFloat(formData.fee_amount),
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
        description: formData.description.trim() || null,
        status: 'Active' // Default status
      }

      // Insert into Supabase
      const { data, error: insertError } = await supabase
        .from('batch')
        .insert([batchData])
        .select()

      if (insertError) {
        console.error('Error creating batch:', insertError)
        setSubmitError(insertError.message || 'Failed to create batch. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Show success message
      setShowSuccess(true)

      // Redirect to batches page after 1.5 seconds
      setTimeout(() => {
        navigate('/batches')
      }, 1500)
    } catch (err) {
      console.error('Unexpected error:', err)
      setSubmitError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    navigate('/batches')
  }


  return (
    <div className="add-batch-container">
      {/* Header */}
      <Header onLogout={onLogout} />

      {/* Main Content */}
      <main className="add-batch-content">
        {/* Page Header with Back Button */}
        <div className="page-header">
          <button className="back-btn" onClick={handleCancel} title="Go back" disabled={isSubmitting}>
            <FaArrowLeft size={20} />
          </button>
          <h1 className="page-title">Add New Batch</h1>
          <div className="spacer"></div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="success-container">
            <div className="success-message">
              ✓ Batch created successfully! Redirecting...
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

            {/* Batch Name */}
            <div className="form-group">
              <label htmlFor="batch_name">Batch Name *</label>
              <input
                type="text"
                id="batch_name"
                name="batch_name"
                value={formData.batch_name}
                onChange={handleInputChange}
                placeholder="e.g., 10th Morning Batch"
                className={errors.batch_name ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.batch_name && <span className="error-text">{errors.batch_name}</span>}
            </div>

            {/* Subject */}
            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleSelectChange}
                className={errors.subject ? 'error' : ''}
                disabled={isSubmitting}
              >
                <option value="">Select a subject</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              {errors.subject && <span className="error-text">{errors.subject}</span>}
            </div>

            {/* Grade */}
            <div className="form-group">
              <label htmlFor="grade">Grade / Class *</label>
              <select
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleSelectChange}
                className={errors.grade ? 'error' : ''}
                disabled={isSubmitting}
              >
                <option value="">Select a grade</option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              {errors.grade && <span className="error-text">{errors.grade}</span>}
            </div>

            {/* Schedule Days Multi-Select */}
            <div className="form-group">
              <label>Schedule Days</label>
              <div className="checkbox-group">
                {daysOptions.map((day) => (
                  <div key={day} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={`day-${day}`}
                      checked={formData.schedule.includes(day)}
                      onChange={() => handleDaysChange(day)}
                      disabled={isSubmitting}
                    />
                    <label htmlFor={`day-${day}`}>{day}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Time */}
            <div className="form-group">
              <label htmlFor="start_time">Start Time (HH:MM) *</label>
              <input
                type="text"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                placeholder="e.g., 07:00 or 7:00 AM"
                className={errors.start_time ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.start_time && <span className="error-text">{errors.start_time}</span>}
            </div>

            {/* End Time */}
            <div className="form-group">
              <label htmlFor="end_time">End Time (HH:MM) *</label>
              <input
                type="text"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                placeholder="e.g., 08:00 or 8:00 AM"
                className={errors.end_time ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.end_time && <span className="error-text">{errors.end_time}</span>}
            </div>

            {/* Monthly Fees */}
            <div className="form-group">
              <label htmlFor="fee_amount">Monthly Fees *</label>
              <div className="input-wrapper">
                <span className="currency-symbol">₹</span>
                <input
                  type="number"
                  id="fee_amount"
                  name="fee_amount"
                  value={formData.fee_amount}
                  onChange={handleInputChange}
                  placeholder="e.g., 1500"
                  className={`currency-input ${errors.fee_amount ? 'error' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.fee_amount && <span className="error-text">{errors.fee_amount}</span>}
            </div>

            {/* Max Capacity */}
            <div className="form-group">
              <label htmlFor="max_capacity">Max Capacity (Students)</label>
              <input
                type="number"
                id="max_capacity"
                name="max_capacity"
                value={formData.max_capacity}
                onChange={handleInputChange}
                placeholder="e.g., 25"
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add any additional details about the batch..."
                rows="4"
                disabled={isSubmitting}
              />
            </div>

            {/* Form Buttons */}
            <div className="form-buttons">
              <button 
                type="button" 
                className="btn btn-cancel" 
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-save"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Batch'}
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

export default AddBatch
