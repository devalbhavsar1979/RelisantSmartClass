import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import '../styles/pages/Students.css'
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import { supabase } from '../services/supabaseClient'

/**
 * Students Component
 * Displays students for a selected batch with Edit and Delete functionality
 * Fetches data from student + enrollment + batch tables
 * Mobile-first responsive design
 */
function Students({ onLogout }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const batchId = searchParams.get('batch_id')

  // State management
  const [students, setStudents] = useState([])
  const [batchData, setBatchData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  /**
   * Fetch students and batch data on component mount
   */
  useEffect(() => {
    if (batchId) {
      fetchStudentsAndBatchData()
    } else {
      setError('No batch selected. Please select a batch from the Batches page.')
      setIsLoading(false)
    }
  }, [batchId])

  /**
   * Fetch students for the batch from Supabase
   * Join student + enrollment + batch tables
   */
  const fetchStudentsAndBatchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('Fetching batch data for batch_id:', batchId)

      // Fetch batch data
      const { data: batchInfo, error: batchError } = await supabase
        .from('batch')
        .select('batch_id, batch_name, grade, fee_amount')
        .eq('batch_id', batchId)
        .single()

      if (batchError) {
        console.error('Error fetching batch:', batchError)
        console.error('Error details:', JSON.stringify(batchError, null, 2))
        setError(`Failed to load batch: ${batchError.message || JSON.stringify(batchError)}`)
        setIsLoading(false)
        return
      }

      if (!batchInfo) {
        console.error('Batch not found:', batchId)
        setError('Batch not found. Please go back and select a batch.')
        setIsLoading(false)
        return
      }

      console.log('Batch loaded:', batchInfo)
      setBatchData(batchInfo)

      console.log('Fetching enrollments for batch_id:', batchId)

      // Fetch enrollments for this batch
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollment')
        .select('enrollment_id, student_id, enrollment_date')
        .eq('batch_id', batchId)
        .order('enrollment_date', { ascending: false })

      if (enrollmentError) {
        console.error('Error fetching enrollments:', enrollmentError)
        console.error('Enrollment error details:', JSON.stringify(enrollmentError, null, 2))
        setError(`Failed to load enrollments: ${enrollmentError.message || JSON.stringify(enrollmentError)}`)
        setIsLoading(false)
        return
      }

      console.log('Enrollments loaded:', enrollmentData?.length || 0)

      // If no enrollments, show empty state
      if (!enrollmentData || enrollmentData.length === 0) {
        console.log('No enrollments found for this batch')
        setStudents([])
        setIsLoading(false)
        return
      }

      // Get all student IDs from enrollments
      const studentIds = enrollmentData.map(e => e.student_id)
      console.log('Fetching student details for IDs:', studentIds)

      // Fetch student details for these IDs
      const { data: studentsData, error: studentsError } = await supabase
        .from('student')
        .select('student_id, name, gender, dob, school_name, parent_name, parent_contact')
        .in('student_id', studentIds)

      if (studentsError) {
        console.error('Error fetching student details:', studentsError)
        console.error('Student error details:', JSON.stringify(studentsError, null, 2))
        setError(`Failed to load student details: ${studentsError.message || JSON.stringify(studentsError)}`)
        setIsLoading(false)
        return
      }

      console.log('Students loaded:', studentsData?.length || 0)

      // Create a map of students by ID for easy lookup
      const studentMap = {}
      if (studentsData && Array.isArray(studentsData)) {
        studentsData.forEach(student => {
          studentMap[student.student_id] = student
        })
      }

      // Transform the data by combining enrollment and student info
      const transformedStudents = enrollmentData.map((enrollment) => {
        const studentInfo = studentMap[enrollment.student_id]
        return {
          enrollment_id: enrollment.enrollment_id,
          student_id: enrollment.student_id,
          name: studentInfo?.name || 'Unknown',
          gender: studentInfo?.gender || '',
          dob: studentInfo?.dob || '',
          school_name: studentInfo?.school_name || '',
          parent_name: studentInfo?.parent_name || '',
          parent_contact: studentInfo?.parent_contact || '',
          enrollment_date: enrollment.enrollment_date,
          batch_id: batchId,
          batch_name: batchInfo.batch_name,
          grade: batchInfo.grade
        }
      })

      console.log('Transformed students:', transformedStudents.length)
      setStudents(transformedStudents)
      setIsLoading(false)
    } catch (err) {
      console.error('Unexpected error fetching students:', err)
      console.error('Error stack:', err.stack)
      setError(`Unexpected error: ${err.message || String(err)}`)
      setIsLoading(false)
    }
  }

  /**
   * Navigate to AddStudent page to add a new student
   */
  const handleAddStudent = () => {
    navigate('/students/add', {
      state: {
        batchId: batchId,
        batchName: batchData?.batch_name
      }
    })
  }

  /**
   * Navigate to AddStudent page in edit mode
   */
  const handleEditStudent = (student) => {
    navigate('/students/add', {
      state: {
        batchId: batchId,
        batchName: batchData?.batch_name,
        studentData: {
          student_id: student.student_id,
          name: student.name,
          gender: student.gender,
          dob: student.dob,
          school_name: student.school_name,
          parent_name: student.parent_name,
          parent_contact: student.parent_contact,
          batch_id: student.batch_id
        }
      }
    })
  }

  /**
   * Show delete confirmation dialog
   */
  const handleDeleteClick = (student) => {
    setShowDeleteConfirm(student)
  }

  /**
   * Cancel delete operation
   */
  const handleCancelDelete = () => {
    setShowDeleteConfirm(null)
  }

  /**
   * Confirm and delete student
   * Step 1: Delete from enrollment table
   * Step 2: Delete from student table
   */
  const handleConfirmDelete = async () => {
    if (!showDeleteConfirm) return

    try {
      setIsDeleting(true)

      // Step 1: Delete from enrollment table
      const { error: enrollmentError } = await supabase
        .from('enrollment')
        .delete()
        .eq('enrollment_id', showDeleteConfirm.enrollment_id)

      if (enrollmentError) {
        console.error('Error deleting enrollment:', enrollmentError)
        setError('Failed to delete student enrollment.')
        setIsDeleting(false)
        setShowDeleteConfirm(null)
        return
      }

      // Step 2: Delete from student table
      const { error: studentError } = await supabase
        .from('student')
        .delete()
        .eq('student_id', showDeleteConfirm.student_id)

      if (studentError) {
        console.error('Error deleting student:', studentError)
        setError('Failed to delete student record.')
        setIsDeleting(false)
        setShowDeleteConfirm(null)
        return
      }

      // Refresh the students list
      setShowDeleteConfirm(null)
      await fetchStudentsAndBatchData()
      setIsDeleting(false)
    } catch (err) {
      console.error('Unexpected error deleting student:', err)
      setError('An unexpected error occurred while deleting student.')
      setIsDeleting(false)
      setShowDeleteConfirm(null)
    }
  }

  /**
   * Navigate back to Batches page
   */
  const handleBackToBatches = () => {
    navigate('/batches')
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="students-container">
        <Header onLogout={onLogout} />
        <main className="students-content">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading students...</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // Show error state
  if (error && !batchData) {
    return (
      <div className="students-container">
        <Header onLogout={onLogout} />
        <main className="students-content">
          <div className="page-header">
            <button className="back-btn" onClick={handleBackToBatches} title="Go back">
              <FaArrowLeft size={20} />
            </button>
            <h1 className="page-title">Students</h1>
            <div className="spacer"></div>
          </div>
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="retry-btn" onClick={() => navigate('/batches')}>
              Back to Batches
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="students-container">
      {/* Header */}
      <Header onLogout={onLogout} />

      {/* Main Content */}
      <main className="students-content">
        {/* Page Header */}
        <div className="page-header">
          <button className="back-btn" onClick={handleBackToBatches} title="Go back">
            <FaArrowLeft size={20} />
          </button>
          <h1 className="page-title">Students</h1>
          <button className="add-student-header-btn" onClick={handleAddStudent} title="Add Student">
            <FaPlus size={18} />
          </button>
        </div>

        {/* Batch Info */}
        {batchData && (
          <div className="batch-info-card">
            <h2 className="batch-name">{batchData.batch_name}</h2>
            <p className="batch-grade">Grade: {batchData.grade}</p>
            <p className="batch-fee">Monthly Fee: ₹{batchData.fee_amount}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-container">
            <p className="error-message">⚠️ {error}</p>
            <details className="error-details">
              <summary>Show Details</summary>
              <p className="error-tech">Check browser console (F12) for more information</p>
            </details>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && students.length === 0 && !error && (
          <div className="empty-state">
            <p className="empty-message">No students found for this batch</p>
            <button className="add-student-btn" onClick={handleAddStudent}>
              <FaPlus size={18} />
              <span>Add First Student</span>
            </button>
          </div>
        )}

        {/* Students Grid */}
        {!isLoading && students.length > 0 && (
          <div className="students_view-grid">
            {students.map((student) => (
              <div key={student.student_id} className="student-card">
                <div className="student-card-header">
                  <div>
                    <h3 className="student_view-name">{student.name}</h3>
                    <p className="student_view-subtitle">School: {student.school_name || 'Student details'}</p>
                    
                  </div>
                  <div className="student-header-meta">
                    {student.gender && <span className="badge">{student.gender}</span>}
                    {student.dob && <span className="badge">{student.dob}</span>}
                  </div>
                </div>

                <div className="student-card-details">
                  {student.parent_name && (
                    <div className="detail-item">
                      <span className="detail-label">Parent: {student.parent_name} </span>

                    <span className="detail-label">Contact: {student.parent_contact} </span>
                    <span className="detail-value">Grade: {student.grade}</span>  
                    </div>
                  )}
                  
                </div>

                <div className="student-card-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleEditStudent(student)}
                    title="Edit Student"
                  >
                    <FaEdit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteClick(student)}
                    title="Delete Student"
                  >
                    <FaTrash size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Spacer for bottom nav */}
        <div className="nav-spacer"></div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h2 className="modal-title">Delete Student</h2>
            <p className="modal-message">
              Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>?
            </p>
            <p className="modal-warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="modal-btn cancel-btn"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="modal-btn delete-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

export default Students
