import { useState, useEffect, useContext } from 'react'
import Header from '../components/Header'
import BatchCard from '../components/BatchCard'
import BottomNav from '../components/BottomNav'
import '../styles/pages/Batches.css'
import { FaPlus } from 'react-icons/fa'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { UserContext } from '../contexts/UserContext'

/**
 * Batches Component
 * Displays and manages tuition batches from Supabase
 * Filtered by user's group_tuition_id for multi-tenant support
 * Mobile-first responsive design
 */
function Batches({ onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { userData, isLoading: userDataLoading } = useContext(UserContext)
  
  // State management
  const [batches, setBatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [deleteError, setDeleteError] = useState(null)

  /**
   * Fetch batches from Supabase on component mount or when returning from AddBatch
   */
  useEffect(() => {
    // Wait for user data to load before fetching batches
    if (!userDataLoading && userData && userData.group_tuition_id) {
      fetchBatches()
    } else if (!userDataLoading && (!userData || !userData.group_tuition_id)) {
      setError('Unable to load your group information')
      setIsLoading(false)
    }
  }, [location, userData, userDataLoading])

  /**
   * Fetch batches from Supabase database filtered by user's group_tuition_id
   * Also fetches enrollment data to calculate student count per batch
   * Multi-tenant: Only shows batches belonging to the user's group
   */
  const fetchBatches = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Only fetch if user has group_tuition_id
      if (!userData || !userData.group_tuition_id) {
        setError('Unable to load your group information')
        setIsLoading(false)
        return
      }

      // Fetch batches filtered by group_tuition_id
      const { data: batchData, error: batchError } = await supabase
        .from('batch')
        .select('*')
        .eq('group_tuition_id', userData.group_tuition_id)
        .order('created_at', { ascending: false })

      if (batchError) {
        console.error('Error fetching batches:', batchError)
        setError('Failed to load batches. Please try again.')
        setIsLoading(false)
        return
      }

      // Fetch all enrollment records to count students per batch
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollment')
        .select('batch_id')

      if (enrollmentError) {
        console.error('Error fetching enrollment data:', enrollmentError)
        // Continue with zero student count if enrollment fetch fails
        console.warn('Proceeding with zero student counts')
      }

      // Create a mapping of batch_id -> student count
      const studentCountMap = {}
      if (enrollmentData) {
        enrollmentData.forEach((enrollment) => {
          if (enrollment.batch_id) {
            studentCountMap[enrollment.batch_id] = 
              (studentCountMap[enrollment.batch_id] || 0) + 1
          }
        })
      }

      // Transform Supabase data to match BatchCard component structure
      const transformedBatches = batchData.map((batch) => ({
        id: batch.batch_id,
        batch_id: batch.batch_id, // Keep for editing
        name: batch.batch_name,
        grade: batch.grade,
        subject: batch.subject,
        students: studentCountMap[batch.batch_id] || 0, // Real student count from enrollment
        fees: `₹${batch.fee_amount}`,
        days: batch.schedule || 'To be scheduled',
        location: 'Center', // Default location - can be extended to Supabase
        time: batch.start_time && batch.end_time 
          ? `${batch.start_time} – ${batch.end_time}` 
          : 'To be scheduled',
        status: batch.status,
        description: batch.description,
        created_at: batch.created_at,
        updated_at: batch.updated_at,
        // Store original values for editing
        batch_name: batch.batch_name,
        schedule: batch.schedule,
        start_time: batch.start_time,
        end_time: batch.end_time,
        fee_amount: batch.fee_amount,
        max_capacity: batch.max_capacity
      }))

      setBatches(transformedBatches)
      setIsLoading(false)
    } catch (err) {
      console.error('Unexpected error fetching batches:', err)
      setError('An unexpected error occurred. Please refresh the page.')
      setIsLoading(false)
    }
  }

  const handleAddNewBatch = () => {
    navigate('/batches/add')
  }

  /**
   * Handle edit batch - Navigate to AddBatch page with batch data
   */
  const handleEditBatch = (batch) => {
    // Pass batch data through navigation state for prefilling the form
    navigate('/batches/edit', { state: { batch } })
  }

  /**
   * Handle delete batch - Show confirmation and delete from Supabase
   * Includes group_tuition_id filter for secure multi-tenant deletion
   */
  const handleDeleteBatch = async (batchId, batchName) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${batchName}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)
      setDeleteError(null)
      setSuccessMessage('')

      // Delete the batch from Supabase with group_tuition_id filter
      const { error: deleteError } = await supabase
        .from('batch')
        .delete()
        .eq('batch_id', batchId)
        .eq('group_tuition_id', userData.group_tuition_id)

      if (deleteError) {
        console.error('Error deleting batch:', deleteError)
        
        // Check if error is due to foreign key constraint (enrollments exist)
        if (deleteError.message && deleteError.message.includes('foreign key')) {
          setDeleteError(
            `Cannot delete batch "${batchName}" because it has enrolled students. Please remove all students first.`
          )
        } else {
          setDeleteError(deleteError.message || 'Failed to delete batch. Please try again.')
        }
        setIsDeleting(false)
        return
      }

      // Show success message
      setSuccessMessage(`Batch "${batchName}" deleted successfully!`)

      // Refresh the batches list after 1 second
      setTimeout(() => {
        setSuccessMessage('')
        fetchBatches()
      }, 1500)
    } catch (err) {
      console.error('Unexpected error deleting batch:', err)
      setDeleteError('An unexpected error occurred. Please try again.')
      setIsDeleting(false)
    }
  }

  const handleTakeAttendance = (batchId, batchName) => {
    navigate(`/attendance?batch_id=${batchId}`)
  }

  const handleCollectFees = (batchId, batchName) => {
    navigate(`/fees?batch_id=${batchId}`)
  }

  const handleSendCommunication = (batchId, batchName) => {
    navigate(`/communication?batch_id=${batchId}`)
  }

  const handleViewStudents = (batchId, batchName) => {
    navigate(`/students?batch_id=${batchId}`)
  }

  return (
    <div className="batches-container">
      {/* Header Component */}
      <Header onLogout={onLogout} />

      {/* Main Content */}
      <main className="batches-content">
        {/* Page Header */}
        <section className="batches-header">
          <h2>Manage Batches</h2>
          <p>View and manage all your tuition batches</p>
        </section>

        {/* Add New Batch Button */}
        <section className="add-batch-section">
          <button className="add-batch-btn" onClick={handleAddNewBatch}>
            <FaPlus size={20} />
            <span>Add New Batch</span>
          </button>
        </section>

        {/* Success Message */}
        {successMessage && (
          <section className="batches-section">
            <div className="success-container">
              <div className="success-message">✓ {successMessage}</div>
            </div>
          </section>
        )}

        {/* Delete Error Message */}
        {deleteError && (
          <section className="batches-section">
            <div className="error-container">
              <p className="error-message">✗ {deleteError}</p>
              <button 
                className="dismiss-btn" 
                onClick={() => setDeleteError(null)}
              >
                Dismiss
              </button>
            </div>
          </section>
        )}

        {/* Loading State */}
        {isLoading && (
          <section className="batches-section">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading batches...</p>
            </div>
          </section>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <section className="batches-section">
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button className="retry-btn" onClick={fetchBatches}>
                Try Again
              </button>
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && !error && batches.length === 0 && (
          <section className="batches-section">
            <div className="empty-container">
              <p className="empty-message">No batches created yet.</p>
              <p className="empty-subtext">Click "Add New Batch" to create your first batch.</p>
            </div>
          </section>
        )}

        {/* Batches Grid */}
        {!isLoading && !error && batches.length > 0 && (
          <section className="batches-section">
            <div className="batches-grid">
              {batches.map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  onTakeAttendance={() => handleTakeAttendance(batch.id, batch.name)}
                  onCollectFees={() => handleCollectFees(batch.id, batch.name)}
                  onSendCommunication={() => handleSendCommunication(batch.id, batch.name)}
                  onAddStudent={() => handleViewStudents(batch.id, batch.name)}
                  onEdit={() => handleEditBatch(batch)}
                  onDelete={() => handleDeleteBatch(batch.id, batch.name)}
                  disabled={isDeleting}
                />
              ))}
            </div>
          </section>
        )}

        {/* Spacer for bottom nav */}
        <div className="nav-spacer"></div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

export default Batches
