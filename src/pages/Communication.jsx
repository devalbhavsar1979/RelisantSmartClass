import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import '../styles/pages/Communication.css'
import { FaArrowLeft, FaComments, FaPaperPlane, FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa'
import { supabase } from '../services/supabaseClient'

/**
 * Communication Component
 * Manages WhatsApp messaging to parents
 * Features:
 * - Send to All Parents, Specific Batch, or Individual Parent
 * - Multiple message types with templates
 * - Variable substitution ({student_name}, {amount}, {date}, {batch_name})
 * - Bulk sending with progress tracking
 * - Message history and templates
 */
function Communication({ onLogout }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const batchIdParam = searchParams.get('batch_id') // Get batch_id from URL
  const initialSendTo = batchIdParam ? 'specific_batch' : 'all_parents'
  const initialBatchId = batchIdParam || ''

  // Tab state
  const [activeTab, setActiveTab] = useState('compose') // 'compose', 'templates', 'history'

  // Form state
  const [formData, setFormData] = useState({
    sendTo: initialSendTo, // 'all_parents', 'specific_batch', 'individual_parent'
    messageType: 'announcement', // 'announcement', 'reminder', 'homework', 'fees'
    subject: '',
    message: '',
    batchId: initialBatchId,
    studentId: '',
  })

  // Dropdowns
  const [batches, setBatches] = useState([])
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])

  // Progress and status
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState(null) // { current: 3, total: 50 }
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [failedNumbers, setFailedNumbers] = useState([])

  // Loading
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)

  // Validation errors
  const [errors, setErrors] = useState({})

  // Message templates
  const messageTemplates = {
    announcement: 'Dear Parent, {message}',
    fees: 'Dear Parent, ₹{amount} fee is pending for {student_name}. Please arrange payment at the earliest.',
    homework: 'Homework for {student_name}: {message}',
    reminder: 'Reminder: {message}'
  }

  // Variables info
  const availableVariables = {
    announcement: ['{message}'],
    fees: ['{student_name}', '{amount}', '{batch_name}'],
    homework: ['{student_name}', '{message}'],
    reminder: ['{message}', '{date}']
  }

  /**
   * Fetch batches on component mount
   */
  useEffect(() => {
    fetchBatches()
    fetchAllStudents()
  }, [])

  /**
   * Auto-fill message template when message type changes
   */
  useEffect(() => {
    if (formData.messageType) {
      setFormData(prev => ({
        ...prev,
        message: messageTemplates[prev.messageType] || ''
      }))
    }
  }, [formData.messageType])

  /**
   * Fetch all active batches from Supabase
   */
  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batch')
        .select('batch_id, batch_name')
        .eq('status', 'Active')
        .order('batch_name', { ascending: true })

      if (error) {
        console.error('Error fetching batches:', error)
        setBatches([])
      } else {
        setBatches(data || [])
      }
    } catch (err) {
      console.error('Unexpected error fetching batches:', err)
    }
  }

  /**
   * Fetch all students with parent contact info
   */
  const fetchAllStudents = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('student')
        .select('student_id, name, parent_contact, parent_name, batch_id, enrollment(batch_id)')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching students:', error)
        setStudents([])
      } else {
        setStudents(data || [])
      }
    } catch (err) {
      console.error('Unexpected error fetching students:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Filter students by batch when batch is selected
   */
  useEffect(() => {
    if (formData.sendTo === 'specific_batch' && formData.batchId) {
      setIsLoadingStudents(true)
      const filtered = students.filter(
        student => student.batch_id === parseInt(formData.batchId) || 
                   (student.enrollment && student.enrollment[0]?.batch_id === parseInt(formData.batchId))
      )
      setFilteredStudents(filtered)
      setIsLoadingStudents(false)
    } else if (formData.sendTo === 'individual_parent') {
      setFilteredStudents(students)
    }
  }, [formData.sendTo, formData.batchId, students])

  /**
   * Handle form field changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  /**
   * Validate form before sending
   */
  const validateForm = () => {
    const newErrors = {}

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    }

    if (formData.sendTo === 'specific_batch' && !formData.batchId) {
      newErrors.batchId = 'Please select a batch'
    }

    if (formData.sendTo === 'individual_parent' && !formData.studentId) {
      newErrors.studentId = 'Please select a student/parent'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Generate message with variable substitution
   */
  const generateMessage = (template, student, additionalData = {}) => {
    let message = template
    message = message.replace(/{student_name}/g, student?.name || 'Student')
    message = message.replace(/{amount}/g, additionalData.amount || '0')
    message = message.replace(/{date}/g, additionalData.date || new Date().toLocaleDateString())
    message = message.replace(/{batch_name}/g, additionalData.batchName || '')
    return message
  }

  /**
   * Get students to send to based on sendTo selection
   */
  const getRecipientStudents = () => {
    if (formData.sendTo === 'all_parents') {
      return students.filter(s => s.parent_contact && s.parent_contact.trim())
    } else if (formData.sendTo === 'specific_batch') {
      return filteredStudents.filter(s => s.parent_contact && s.parent_contact.trim())
    } else if (formData.sendTo === 'individual_parent') {
      return students.filter(s => s.student_id === parseInt(formData.studentId) && s.parent_contact)
    }
    return []
  }

  /**
   * Handle bulk sending via backend API
   */
  const handleSendMessages = async () => {
    if (!validateForm()) {
      return
    }

    const recipientStudents = getRecipientStudents()

    if (recipientStudents.length === 0) {
      setErrorMessage('No students/parents found to send messages to.')
      setTimeout(() => setErrorMessage(null), 5000)
      return
    }

    setIsSending(true)
    setSendProgress({ current: 0, total: recipientStudents.length })
    setFailedNumbers([])
    setSuccessMessage(null)
    setErrorMessage(null)

    const failed = []
    let successCount = 0

    try {
      for (let i = 0; i < recipientStudents.length; i++) {
        const student = recipientStudents[i]
        
        // Generate personalized message
        const personalizedMessage = generateMessage(formData.message, student)

        try {
          // Call backend API to send WhatsApp message
          const response = await fetch('/api/send-whatsapp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone: student.parent_contact,
              message: personalizedMessage,
              studentId: student.student_id,
              messageType: formData.messageType,
              timestamp: new Date().toISOString()
            })
          })

          // Parse response safely
          let result = {}
          try {
            const responseText = await response.text()
            if (responseText) {
              result = JSON.parse(responseText)
            } else {
              result = { success: false, error: 'Empty response from server' }
            }
          } catch (parseErr) {
            console.error(`JSON parse error for ${student.parent_contact}:`, parseErr)
            result = { success: false, error: 'Invalid response from server' }
          }

          if (response.ok && result.success) {
            successCount++
            // Log to communication_logs table if exists
            logCommunication(student.student_id, student.parent_contact, personalizedMessage, 'sent')
          } else {
            failed.push({
              phone: student.parent_contact,
              reason: result.error || `Server error: ${response.status}`
            })
            logCommunication(student.student_id, student.parent_contact, personalizedMessage, 'failed')
          }
        } catch (err) {
          console.error(`Failed to send to ${student.parent_contact}:`, err)
          failed.push({
            phone: student.parent_contact,
            reason: err.message || 'Network error or backend not running'
          })
          logCommunication(student.student_id, student.parent_contact, personalizedMessage, 'failed')
        }

        // Update progress
        setSendProgress(prev => ({
          ...prev,
          current: i + 1
        }))

        // Delay between messages (rate limiting)
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // Show results
      if (failed.length === 0) {
        setSuccessMessage(`✓ All ${successCount} messages sent successfully!`)
      } else {
        setSuccessMessage(`✓ Sent ${successCount} of ${recipientStudents.length} messages`)
        setFailedNumbers(failed)
      }

      // Clear form
      setFormData({
        sendTo: 'all_parents',
        messageType: 'announcement',
        subject: '',
        message: messageTemplates.announcement,
        batchId: '',
        studentId: '',
      })

    } catch (err) {
       
      console.error('Error sending messages:', err)
      setErrorMessage('An error occurred while sending messages. Please try again.')
    } finally {
      setIsSending(false)
      setSendProgress(null)
    }
  }

  /**
   * Log communication to database (optional)
   */
  const logCommunication = async (studentId, phone, message, status) => {
    try {
      await supabase
        .from('communication_logs')
        .insert([{
          student_id: studentId,
          phone: phone,
          message: message,
          status: status,
          message_type: formData.messageType,
          sent_at: new Date().toISOString()
        }])
    } catch (err) {
      // Silently fail if table doesn't exist
      console.log('Communication log not available (table may not exist)')
    }
  }

  return (
    <div className="communication-container">
      <Header onLogout={onLogout} />
      <div className="communication-content">
        {/* Back Button */}
        <div className="communication-header">
          <button
            className="communication-back-button"
            onClick={() => navigate(-1)}
            title="Go back"
          >
            <FaArrowLeft />
          </button>
          <h1 className="communication-title">
            <FaComments style={{ marginRight: '8px' }} />
            Communication
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="communication-tabs">
          <button
            className={`tab-button ${activeTab === 'compose' ? 'active' : ''}`}
            onClick={() => setActiveTab('compose')}
          >
            Compose
          </button>
          <button
            className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div className="compose-section">
            <h2 className="section-title">Compose WhatsApp Message</h2>

            {/* Status Messages */}
            {successMessage && (
              <div className="message-alert success">
                <FaCheckCircle />
                <div>
                  <p>{successMessage}</p>
                  {failedNumbers.length > 0 && (
                    <div className="failed-details">
                      <p><strong>Failed to send to:</strong></p>
                      <ul>
                        {failedNumbers.map((item, idx) => (
                          <li key={idx}>
                            {item.phone}: {item.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <button
                  className="close-alert"
                  onClick={() => setSuccessMessage(null)}
                >
                  <FaTimes />
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="message-alert error">
                <FaExclamationCircle />
                <p>{errorMessage}</p>
                <button
                  className="close-alert"
                  onClick={() => setErrorMessage(null)}
                >
                  <FaTimes />
                </button>
              </div>
            )}

            {/* Progress Indicator */}
            {isSending && sendProgress && (
              <div className="progress-indicator">
                <div className="progress-info">
                  <span>Sending {sendProgress.current} of {sendProgress.total}...</span>
                  <span className="progress-percentage">
                    {Math.round((sendProgress.current / sendProgress.total) * 100)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(sendProgress.current / sendProgress.total) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Form */}
            <form className="compose-form">
              {/* Send To */}
              <div className="form-group">
                <label htmlFor="sendTo">
                  <span className="label-text">Send To</span>
                  <span className="required">*</span>
                </label>
                <select
                  id="sendTo"
                  name="sendTo"
                  value={formData.sendTo}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="all_parents">All Parents</option>
                  <option value="specific_batch">Specific Batch</option>
                  <option value="individual_parent">Individual Parent</option>
                </select>
              </div>

              {/* Batch Dropdown (conditional) */}
              {formData.sendTo === 'specific_batch' && (
                <div className="form-group">
                  <label htmlFor="batchId">
                    <span className="label-text">Select Batch</span>
                    <span className="required">*</span>
                  </label>
                  <select
                    id="batchId"
                    name="batchId"
                    value={formData.batchId}
                    onChange={handleInputChange}
                    className={`form-input ${errors.batchId ? 'error' : ''}`}
                  >
                    <option value="">-- Choose a batch --</option>
                    {batches.map(batch => (
                      <option key={batch.batch_id} value={batch.batch_id}>
                        {batch.batch_name}
                      </option>
                    ))}
                  </select>
                  {errors.batchId && <p className="error-text">{errors.batchId}</p>}
                </div>
              )}

              {/* Student Dropdown (conditional) */}
              {formData.sendTo === 'individual_parent' && (
                <div className="form-group">
                  <label htmlFor="studentId">
                    <span className="label-text">Select Student/Parent</span>
                    <span className="required">*</span>
                  </label>
                  <select
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className={`form-input ${errors.studentId ? 'error' : ''}`}
                  >
                    <option value="">-- Choose a student --</option>
                    {filteredStudents.map(student => (
                      <option key={student.student_id} value={student.student_id}>
                        {student.name} ({student.parent_name || 'Unknown'})
                      </option>
                    ))}
                  </select>
                  {errors.studentId && <p className="error-text">{errors.studentId}</p>}
                </div>
              )}

              {/* Message Type */}
              <div className="form-group">
                <label htmlFor="messageType">
                  <span className="label-text">Message Type</span>
                  <span className="required">*</span>
                </label>
                <select
                  id="messageType"
                  name="messageType"
                  value={formData.messageType}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="announcement">Announcement</option>
                  <option value="reminder">Reminder</option>
                  <option value="homework">Homework</option>
                  <option value="fees">Fees</option>
                </select>
                <div className="variables-hint">
                  <strong>Available variables:</strong> {availableVariables[formData.messageType].join(', ')}
                </div>
              </div>

              {/* Subject */}
              <div className="form-group">
                <label htmlFor="subject">
                  <span className="label-text">Subject</span>
                  <span className="required">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Enter message subject"
                  className={`form-input ${errors.subject ? 'error' : ''}`}
                />
                {errors.subject && <p className="error-text">{errors.subject}</p>}
              </div>

              {/* Message */}
              <div className="form-group">
                <label htmlFor="message">
                  <span className="label-text">Message</span>
                  <span className="required">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Type your message here..."
                  className={`form-textarea ${errors.message ? 'error' : ''}`}
                  rows="6"
                />
                <div className="char-count">{formData.message.length} / 4096 characters</div>
                {errors.message && <p className="error-text">{errors.message}</p>}
              </div>

              {/* Info Box */}
              <div className="info-box">
                <strong>ℹ This will be sent via WhatsApp to selected parents</strong>
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSendMessages}
                disabled={isSending}
                className="send-button"
              >
                <FaPaperPlane />
                {isSending ? 'Sending...' : 'Send WhatsApp Message'}
              </button>
            </form>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="templates-section">
            <h2 className="section-title">Message Templates</h2>
            <p className="tab-coming-soon">Templates feature coming soon...</p>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="history-section">
            <h2 className="section-title">Message History</h2>
            <p className="tab-coming-soon">History feature coming soon...</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

export default Communication
