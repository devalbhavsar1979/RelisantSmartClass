import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/pages/RegisterGroupTuition.css'
import { registerGroupTuition } from '../services/supabaseClient'

/**
 * RegisterGroupTuition Component
 * Handles registration of new group tuitions and primary login user
 * Inserts data into group_tuition and users tables, creates Supabase Auth user
 */
function RegisterGroupTuition() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    groupName: '',
    address: '',
    contactNumber: '',
    contactPersonName: '',
    contactPersonNumber: '',
    primaryEmail: '',
    password: '',
    confirmPassword: ''
  })

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({})

  /**
   * Handle input change for all form fields
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  /**
   * Validate form fields
   */
  const validateForm = () => {
    const errors = {}

    // Check required fields
    if (!formData.groupName.trim()) {
      errors.groupName = 'Group Tuition Name is required'
    }
    if (!formData.address.trim()) {
      errors.address = 'Address is required'
    }
    if (!formData.contactNumber.trim()) {
      errors.contactNumber = 'Contact Number is required'
    }
    if (!formData.contactPersonName.trim()) {
      errors.contactPersonName = 'Contact Person Name is required'
    }
    if (!formData.contactPersonNumber.trim()) {
      errors.contactPersonNumber = 'Contact Person Contact Number is required'
    }
    if (!formData.primaryEmail.trim()) {
      errors.primaryEmail = 'Email is required'
    }
    if (!formData.password) {
      errors.password = 'Password is required'
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm Password is required'
    }

    // Validate email format
    if (formData.primaryEmail && !isValidEmail(formData.primaryEmail)) {
      errors.primaryEmail = 'Please enter a valid email address'
    }

    // Validate phone numbers are numeric
    if (formData.contactNumber && !isNumeric(formData.contactNumber)) {
      errors.contactNumber = 'Contact Number must contain only digits'
    }
    if (formData.contactPersonNumber && !isNumeric(formData.contactPersonNumber)) {
      errors.contactPersonNumber = 'Contact Person Number must contain only digits'
    }

    // Validate password minimum length
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    // Validate passwords match
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  /**
   * Validate email format
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Check if string contains only digits
   */
  const isNumeric = (str) => {
    return /^\d+$/.test(str)
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Call the registration function
      const result = await registerGroupTuition({
        groupName: formData.groupName.trim(),
        address: formData.address.trim(),
        contactNumber: formData.contactNumber.trim(),
        contactPersonName: formData.contactPersonName.trim(),
        contactPersonNumber: formData.contactPersonNumber.trim(),
        primaryEmail: formData.primaryEmail.trim(),
        password: formData.password
      })

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      // Show success message
      setSuccess(true)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message || 'An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  /**
   * Handle back button click
   */
  const handleBack = () => {
    navigate('/')
  }

  // Show success message
  if (success) {
    return (
      <div className="register-container">
        <div className="register-card">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Group Tuition Registered Successfully</h2>
            <p>Redirecting to login page...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="register-container">
      <div className="register-card">
        {/* Header Section */}
        <div className="register-header">
          <button 
            type="button" 
            className="back-button"
            onClick={handleBack}
            disabled={isLoading}
          >
            ← Back
          </button>
          <h1 className="register-title">Register New Group Tuition</h1>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="register-form">
          {/* Group Tuition Information */}
          <div className="form-section">
            <h3 className="section-title">Group Information</h3>

            <div className="form-group">
              <label htmlFor="groupName">Group Tuition Name *</label>
              <input
                type="text"
                id="groupName"
                name="groupName"
                value={formData.groupName}
                onChange={handleInputChange}
                placeholder="e.g., ABC Coaching Classes"
                disabled={isLoading}
                className={validationErrors.groupName ? 'input-error' : ''}
              />
              {validationErrors.groupName && (
                <span className="error-text">{validationErrors.groupName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter full address"
                disabled={isLoading}
                rows="3"
                className={validationErrors.address ? 'input-error' : ''}
              />
              {validationErrors.address && (
                <span className="error-text">{validationErrors.address}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactNumber">Contact Number *</label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., 9876543210"
                  disabled={isLoading}
                  className={validationErrors.contactNumber ? 'input-error' : ''}
                />
                {validationErrors.contactNumber && (
                  <span className="error-text">{validationErrors.contactNumber}</span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Person Information */}
          <div className="form-section">
            <h3 className="section-title">Contact Person</h3>

            <div className="form-group">
              <label htmlFor="contactPersonName">Contact Person Name *</label>
              <input
                type="text"
                id="contactPersonName"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleInputChange}
                placeholder="e.g., John Doe"
                disabled={isLoading}
                className={validationErrors.contactPersonName ? 'input-error' : ''}
              />
              {validationErrors.contactPersonName && (
                <span className="error-text">{validationErrors.contactPersonName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="contactPersonNumber">Contact Person Phone *</label>
              <input
                type="tel"
                id="contactPersonNumber"
                name="contactPersonNumber"
                value={formData.contactPersonNumber}
                onChange={handleInputChange}
                placeholder="e.g., 9876543210"
                disabled={isLoading}
                className={validationErrors.contactPersonNumber ? 'input-error' : ''}
              />
              {validationErrors.contactPersonNumber && (
                <span className="error-text">{validationErrors.contactPersonNumber}</span>
              )}
            </div>
          </div>

          {/* Login Credentials */}
          <div className="form-section">
            <h3 className="section-title">Primary Login Credentials</h3>

            <div className="form-group">
              <label htmlFor="primaryEmail">Email Address *</label>
              <input
                type="email"
                id="primaryEmail"
                name="primaryEmail"
                value={formData.primaryEmail}
                onChange={handleInputChange}
                placeholder="e.g., admin@example.com"
                disabled={isLoading}
                className={validationErrors.primaryEmail ? 'input-error' : ''}
              />
              {validationErrors.primaryEmail && (
                <span className="error-text">{validationErrors.primaryEmail}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimum 6 characters"
                  disabled={isLoading}
                  className={validationErrors.password ? 'input-error' : ''}
                />
                {validationErrors.password && (
                  <span className="error-text">{validationErrors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter password"
                  disabled={isLoading}
                  className={validationErrors.confirmPassword ? 'input-error' : ''}
                />
                {validationErrors.confirmPassword && (
                  <span className="error-text">{validationErrors.confirmPassword}</span>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            className="register-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Registering...
              </>
            ) : (
              'Register Group Tuition'
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="register-footer">
          <p>* All fields are required</p>
        </div>
      </div>
    </div>
  )
}

export default RegisterGroupTuition
