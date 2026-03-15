import { useState, useEffect } from 'react'
import Header from '../components/Header'
import BatchCard from '../components/BatchCard'
import BottomNav from '../components/BottomNav'
import '../styles/pages/Batches.css'
import { FaPlus } from 'react-icons/fa'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

/**
 * Batches Component
 * Displays and manages tuition batches from Supabase
 * Mobile-first responsive design
 */
function Batches({ onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  // State management
  const [batches, setBatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Fetch batches from Supabase on component mount or when returning from AddBatch
   */
  useEffect(() => {
    fetchBatches()
  }, [location])

  /**
   * Fetch batches from Supabase database
   */
  const fetchBatches = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('batch')
        .select('*')
        .order('created_at', { ascending: false })

      if (supabaseError) {
        console.error('Error fetching batches:', supabaseError)
        setError('Failed to load batches. Please try again.')
        setIsLoading(false)
        return
      }

      // Transform Supabase data to match BatchCard component structure
      const transformedBatches = data.map((batch) => ({
        id: batch.batch_id,
        name: batch.batch_name,
        grade: batch.grade,
        subject: batch.subject,
        students: batch.max_capacity || 0, // Using max_capacity as students count
        fees: `₹${batch.fee_amount}`,
        days: batch.schedule || 'To be scheduled',
        location: 'Center', // Default location - can be extended to Supabase
        time: batch.start_time && batch.end_time 
          ? `${batch.start_time} – ${batch.end_time}` 
          : 'To be scheduled',
        status: batch.status,
        description: batch.description,
        created_at: batch.created_at,
        updated_at: batch.updated_at
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

  const handleTakeAttendance = (batchId, batchName) => {
    console.log(`Take Attendance for Batch ${batchId}: ${batchName}`)
  }

  const handleCollectFees = (batchId, batchName) => {
    console.log(`Collect Fees for Batch ${batchId}: ${batchName}`)
  }

  const handleSendCommunication = (batchId, batchName) => {
    console.log(`Send Communication for Batch ${batchId}: ${batchName}`)
  }

  const handleAddStudent = (batchId, batchName) => {
    console.log(`Add Student to Batch ${batchId}: ${batchName}`)
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
                  onAddStudent={() => handleAddStudent(batch.id, batch.name)}
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
