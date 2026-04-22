import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import '../styles/pages/Fees.css'
import {
  FaArrowLeft,
  FaMoneyBillWave,
  FaClock,
  FaTimes,
  FaCheck,
  FaCheckCircle,
  FaExclamationCircle,
  FaFilter,
} from 'react-icons/fa'
import { supabase } from '../services/supabaseClient'
import {
  fetchStudentsWithFees,
  getFeeSummary,
  getPendingFees,
  getAllPaymentHistory,
  getCurrentMonth,
  collectFee,
} from '../services/supabaseFees'

/**
 * Fees Collection Component
 * Manages fee collection for students with tabs for collection, pending, and history
 * Features:
 * - View students and their fees due
 * - Collect fees with modal input
 * - Track pending fees
 * - View payment history
 * - Real-time summary cards showing collection status
 * - Filter by batch and student
 */
function Fees({ onLogout }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const batchIdParam = searchParams.get('batch_id') // Get batch_id from URL

  // Tab state
  const [activeTab, setActiveTab] = useState('collect') // 'collect', 'pending', 'history'

  // Batch and Student Filter State
  const [batchId, setBatchId] = useState(batchIdParam ? parseInt(batchIdParam) : null)
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [batchInfo, setBatchInfo] = useState(null)
  const [allBatches, setAllBatches] = useState([])

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Data states
  const [students, setStudents] = useState([])
  const [summary, setSummary] = useState({
    thisMonthCollection: 0,
    pendingAmount: 0,
  })
  const [pendingFees, setPendingFees] = useState([])
  const [paymentHistory, setPaymentHistory] = useState([])

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [collectionForm, setCollectionForm] = useState({
    amount: '',
  })

  // Toast state
  const [toast, setToast] = useState(null)

  /**
   * Load batch info when batchId changes
   */
  useEffect(() => {
    if (batchId) {
      fetchBatchInfo()
    }
  }, [batchId])

  /**
   * Load all data on component mount or when batchId/selectedStudentId changes
   */
  useEffect(() => {
    loadAllData()
  }, [batchId, selectedStudentId])

  /**
   * Fetch batch information from Supabase
   */
  const fetchBatchInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('batch')
        .select('*')
        .eq('batch_id', batchId)
        .single()

      if (error) {
        console.error('Error fetching batch:', error)
        setBatchInfo(null)
        return
      }

      setBatchInfo(data)
    } catch (err) {
      console.error('Error in fetchBatchInfo:', err)
      setBatchInfo(null)
    }
  }

  /**
   * Fetch all batches for dropdown selector
   */
  const fetchAllBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batch')
        .select('batch_id, batch_name, grade, fee_amount')
        .order('batch_name', { ascending: true })

      if (error) {
        console.error('Error fetching batches:', error)
        return
      }

      setAllBatches(data || [])
    } catch (err) {
      console.error('Error in fetchAllBatches:', err)
    }
  }

  /**
   * Load students, summary, and other data from Supabase
   * Filters by batch if batchId is provided
   */
  const loadAllData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch all batches for selector on first load
      if (allBatches.length === 0) {
        await fetchAllBatches()
      }

      // Fetch students with fees
      let studentsData = await fetchStudentsWithFees()

      // Filter by batch if batchId is provided
      if (batchId) {
        studentsData = studentsData.filter((s) => s.batch_id === batchId)
      }

      setStudents(studentsData)

      // Fetch fee summary (pass batch_id for filtering)
      const summaryData = await getFeeSummary(batchId)
      setSummary(summaryData)

      // Fetch pending fees (pass batch_id for filtering)
      const pendingData = await getPendingFees(batchId)
      setPendingFees(pendingData)

      // Fetch payment history
      const historyData = await getAllPaymentHistory()
      setPaymentHistory(historyData)

      setIsLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load fees data')
      setIsLoading(false)
    }
  }

  /**
   * Show a toast notification
   */
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  /**
   * Open collection modal for a student
   */
  const handleOpenCollectionModal = (student) => {
    setSelectedStudent(student)
    setCollectionForm({ amount: '' })
    setShowModal(true)
  }

  /**
   * Close collection modal
   */
  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedStudent(null)
    setCollectionForm({ amount: '' })
  }

  /**
   * Handle collection form input change
   */
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setCollectionForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  /**
   * Submit fee collection
   */
  const handleSubmitCollection = async () => {
    try {
      const amount = parseFloat(collectionForm.amount)

      // Validation
      if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error')
        return
      }

      if (amount > selectedStudent.due_amount) {
        showToast(
          `Amount cannot exceed due amount (₹${selectedStudent.due_amount.toFixed(2)})`,
          'error'
        )
        return
      }

      setIsSubmitting(true)

      // Call collectFee API
      const result = await collectFee({
        student_id: selectedStudent.student_id,
        batch_id: selectedStudent.batch_id,
        amount_to_collect: amount,
        total_fee_amount: selectedStudent.fee_amount,
      })

      if (result.success) {
        showToast('✓ Fee collected successfully', 'success')
        handleCloseModal()

        // Refresh data
        await loadAllData()
      } else {
        showToast(result.message || 'Failed to collect fee', 'error')
      }
    } catch (err) {
      console.error('Error collecting fee:', err)
      showToast('Failed to collect fee', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Get student data for display based on active tab and filters
   */
  const getDisplayData = () => {
    let displayStudents = students

    // Filter by selected student if provided
    if (selectedStudentId) {
      displayStudents = displayStudents.filter((s) => s.student_id === selectedStudentId)
    }

    if (activeTab === 'collect') {
      // Filter students without full payment
      return displayStudents.filter((s) => s.status !== 'Paid')
    } else if (activeTab === 'pending') {
      // Transform pending fees to match display format
      let filteredPending = pendingFees
      if (batchId) {
        filteredPending = filteredPending.filter((fee) => fee.batch_id === batchId)
      }
      if (selectedStudentId) {
        filteredPending = filteredPending.filter((fee) => fee.student_id === selectedStudentId)
      }
      return filteredPending.map((fee) => ({
        student_name: fee.student?.student_name || 'Unknown',
        batch_name: fee.batch?.batch_name || 'Unknown',
        grade: fee.batch?.grade || '',
        amount: fee.amount,
        paid_amount: fee.paid_amount,
        due_amount: fee.amount - fee.paid_amount,
        status: fee.status,
        student_id: fee.student_id,
        batch_id: fee.batch_id,
      }))
    } else if (activeTab === 'history') {
      let filteredHistory = paymentHistory
      if (batchId) {
        filteredHistory = filteredHistory.filter((h) => h.batch_id === batchId)
      }
      if (selectedStudentId) {
        filteredHistory = filteredHistory.filter((h) => h.student_id === selectedStudentId)
      }
      return filteredHistory
    }
    return []
  }

  /**
   * Count pending fees
   */
  const getPendingCount = () => {
    return students.filter((s) => s.status !== 'Paid').length
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="fees-container">
        <Header />
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading fees data...</p>
        </div>
        <BottomNav />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="fees-container">
        <Header />
        <div className="error-screen">
          <FaExclamationCircle size={48} />
          <p>{error}</p>
          <button
            onClick={loadAllData}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            Retry
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  const displayData = getDisplayData()

  return (
    <div className="fees-container">
      <Header />

      <div className="fees-content">
        {/* BACK BUTTON & BATCH/STUDENT FILTERS */}
        <div className="fees-filters-section">
          <div className="fees-filter-header">
            {batchId && (
              <button
                className="fees-back-button"
                onClick={() => navigate('/batches')}
                title="Back to Batches"
              >
                <FaArrowLeft size={18} />
              </button>
            )}
            <h2 className="fees-page-title">
              {batchInfo ? `${batchInfo.batch_name} - Fees Collection` : 'Fees Collection'}
            </h2>
          </div>

          {/* Batch Selector Dropdown */}
          <div className="fees-selector-group">
            <label className="fees-selector-label">
              <FaFilter size={14} style={{ marginRight: '6px' }} />
              Select Batch
            </label>
            <select
              className="fees-selector-dropdown"
              value={batchId || ''}
              onChange={(e) => {
                const newBatchId = e.target.value ? parseInt(e.target.value) : null
                setBatchId(newBatchId)
                setSelectedStudentId(null) // Reset student when batch changes
              }}
            >
              <option value="">All Batches</option>
              {allBatches.map((batch) => (
                <option key={batch.batch_id} value={batch.batch_id}>
                  {batch.batch_name} (Grade {batch.grade}) - ₹{batch.fee_amount}
                </option>
              ))}
            </select>
          </div>

          {/* Student Selector Dropdown */}
          {students.length > 0 && (
            <div className="fees-selector-group">
              <label className="fees-selector-label">
                <FaFilter size={14} style={{ marginRight: '6px' }} />
                Select Student
              </label>
              <select
                className="fees-selector-dropdown"
                value={selectedStudentId || ''}
                onChange={(e) => {
                  const newStudentId = e.target.value ? parseInt(e.target.value) : null
                  setSelectedStudentId(newStudentId)
                }}
              >
                <option value="">All Students ({students.length})</option>
                {students.map((student) => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.student_name} - ₹{student.due_amount.toLocaleString('en-IN')} due
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* SUMMARY CARDS */}
        <div className="fees-summary-section">
          <div className="fees-summary-grid">
            {/* This Month Collection Card */}
            <div className="fees-summary-card collected">
              <div className="fees-summary-label">
                <FaCheckCircle size={14} style={{ marginRight: '6px' }} />
                This Month Collection
              </div>
              <div className="fees-summary-amount">
                ₹{summary.thisMonthCollection.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* Pending Amount Card */}
            <div className="fees-summary-card pending">
              <div className="fees-summary-label">
                <FaClock size={14} style={{ marginRight: '6px' }} />
                Pending Amount
              </div>
              <div className="fees-summary-amount">
                ₹{summary.pendingAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="fees-tabs">
          <button
            className={`fees-tab-button ${activeTab === 'collect' ? 'active' : ''}`}
            onClick={() => setActiveTab('collect')}
          >
            Collect Fee
            {getPendingCount() > 0 && (
              <span className="fees-tab-badge">{getPendingCount()}</span>
            )}
          </button>
          <button
            className={`fees-tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
            {pendingFees.length > 0 && (
              <span className="fees-tab-badge">{pendingFees.length}</span>
            )}
          </button>
          <button
            className={`fees-tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {/* COLLECT FEE TAB */}
        {activeTab === 'collect' && (
          <div className="fees-list">
            {displayData.length === 0 ? (
              <div className="fees-empty-state">
                <div className="fees-empty-icon">✓</div>
                <p className="fees-empty-text">All fees collected for this month!</p>
              </div>
            ) : (
              displayData.map((student) => (
                <div key={`${student.student_id}-${student.batch_id}`} className="fees-student-card">
                  <div className="fees-student-info">
                    <p className="fees-student-name">{student.student_name}</p>
                    <p className="fees-student-batch">
                      {student.batch_name}
                      {student.grade && ` • Grade ${student.grade}`}
                    </p>
                  </div>

                  <div className="fees-fee-info">
                    <p className="fees-monthly-fee">₹{student.fee_amount.toLocaleString('en-IN')}</p>
                    <span
                      className={`fees-due-badge ${
                        student.status === 'Paid'
                          ? 'paid'
                          : student.status === 'Partial'
                            ? 'partial'
                            : ''
                      }`}
                    >
                      {student.status === 'Paid'
                        ? '✓ Paid'
                        : `₹${student.due_amount.toLocaleString('en-IN')} due`}
                    </span>
                  </div>

                  {student.status !== 'Paid' && (
                    <button
                      className="fees-collect-button"
                      onClick={() => handleOpenCollectionModal(student)}
                    >
                      Collect
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* PENDING TAB */}
        {activeTab === 'pending' && (
          <div className="fees-list">
            {displayData.length === 0 ? (
              <div className="fees-empty-state">
                <div className="fees-empty-icon">✓</div>
                <p className="fees-empty-text">No pending fees</p>
              </div>
            ) : (
              displayData.map((fee) => (
                <div key={`${fee.student_id}-pending`} className="fees-student-card">
                  <div className="fees-student-info">
                    <p className="fees-student-name">{fee.student_name}</p>
                    <p className="fees-student-batch">
                      {fee.batch_name}
                      {fee.grade && ` • Grade ${fee.grade}`}
                    </p>
                  </div>

                  <div className="fees-fee-info">
                    <p className="fees-monthly-fee">₹{fee.amount.toLocaleString('en-IN')}</p>
                    <span className={`fees-due-badge ${fee.status === 'Paid' ? 'paid' : 'partial'}`}>
                      {fee.status === 'Paid'
                        ? '✓ Paid'
                        : `₹${fee.due_amount.toLocaleString('en-IN')} due`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="fees-history-list">
            {displayData.length === 0 ? (
              <div className="fees-empty-state">
                <div className="fees-empty-icon">📋</div>
                <p className="fees-empty-text">No payment history</p>
              </div>
            ) : (
              displayData.map((entry, index) => {
                const date = entry.payment_date
                  ? new Date(entry.payment_date).toLocaleDateString('en-IN')
                  : '-'

                return (
                  <div key={index} className="fees-history-card">
                    <div className="fees-history-header">
                      <p className="fees-history-student">{entry.student?.student_name}</p>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          background: '#f1f5f9',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {entry.status}
                      </span>
                    </div>

                    <p className="fees-history-month">
                      Month: <strong>{entry.month}</strong> • Batch: <strong>{entry.batch?.batch_name}</strong>
                    </p>

                    <div className="fees-history-details">
                      <div className="fees-history-detail-item">
                        <span className="fees-history-detail-label">Total Fee:</span>
                        <span className="fees-history-detail-value">₹{entry.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="fees-history-detail-item">
                        <span className="fees-history-detail-label">Paid:</span>
                        <span className="fees-history-detail-value">₹{entry.paid_amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="fees-history-detail-item">
                        <span className="fees-history-detail-label">Due:</span>
                        <span className="fees-history-detail-value">
                          ₹{(entry.amount - entry.paid_amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="fees-history-detail-item">
                        <span className="fees-history-detail-label">Date:</span>
                        <span className="fees-history-detail-value">{date}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* COLLECTION MODAL */}
      <div className={`fees-modal-overlay ${showModal ? 'active' : ''}`}>
        <div className="fees-modal">
          <div className="fees-modal-header">
            <h2 className="fees-modal-title">Collect Fee</h2>
            <button className="fees-modal-close" onClick={handleCloseModal}>
              <FaTimes />
            </button>
          </div>

          {selectedStudent && (
            <>
              {/* Student Info Box */}
              <div className="fees-info-box">
                <strong>{selectedStudent.student_name}</strong>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                  {selectedStudent.batch_name} • Grade {selectedStudent.grade}
                </div>
              </div>

              {/* Fee Breakdown */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <span>Total Monthly Fee:</span>
                  <strong>₹{selectedStudent.fee_amount.toLocaleString('en-IN')}</strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <span>Already Paid:</span>
                  <strong>₹{selectedStudent.paid_amount.toLocaleString('en-IN')}</strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '6px',
                    color: '#dc2626',
                  }}
                >
                  <span>Due Amount:</span>
                  <strong>₹{selectedStudent.due_amount.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Input Form */}
              <div className="fees-form-group">
                <label className="fees-form-label">Enter Amount to Collect (₹)</label>
                <input
                  type="number"
                  className="fees-form-input"
                  name="amount"
                  value={collectionForm.amount}
                  onChange={handleFormChange}
                  placeholder={`Max: ₹${selectedStudent.due_amount.toLocaleString('en-IN')}`}
                  max={selectedStudent.due_amount}
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                />
              </div>

              {/* Action Buttons */}
              <div className="fees-button-group">
                <button
                  className="fees-btn fees-btn-secondary"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="fees-btn fees-btn-primary"
                  onClick={handleSubmitCollection}
                  disabled={isSubmitting || !collectionForm.amount}
                >
                  {isSubmitting ? 'Processing...' : 'Collect Fee'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fees-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <BottomNav />
    </div>
  )
}

export default Fees
