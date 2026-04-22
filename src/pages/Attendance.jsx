import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/pages/Attendance.css'
import { supabase } from '../services/supabaseClient'
import AttendanceSummaryCard from '../components/AttendanceSummaryCard'
import StudentAttendanceCard from '../components/StudentAttendanceCard'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

/**
 * Attendance Page Component
 * Main page for managing attendance for a batch
 * 
 * Features:
 * - Select batch and date
 * - View all students for the batch
 * - Mark attendance as Present/Absent
 * - Save attendance to Supabase
 * - View and edit existing attendance
 * - Real-time summary calculation
 */
function Attendance() {
  const navigate = useNavigate()

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Batches & Selection
  const [batches, setBatches] = useState([])
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  // Students & Attendance
  const [students, setStudents] = useState([])
  const [attendanceMap, setAttendanceMap] = useState({})

  // UI State
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [classId, setClassId] = useState(null)

  // ============================================
  // FETCH BATCHES (on component mount)
  // ============================================
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('batch')
          .select('batch_id, batch_name, grade')
          .eq('status', 'Active')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        setBatches(data || [])

        // Auto-select first batch if available
        if (data && data.length > 0 && !selectedBatchId) {
          setSelectedBatchId(data[0].batch_id)
        }
      } catch (err) {
        console.error('Error fetching batches:', err)
        setError(err.message || 'Failed to load batches')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBatches()
  }, [])

  // ============================================
  // FETCH STUDENTS FOR SELECTED BATCH
  // ============================================
  useEffect(() => {
    if (!selectedBatchId) {
      setStudents([])
      setAttendanceMap({})
      setClassId(null)
      return
    }

    const fetchStudentsAndAttendance = async () => {
      try {
        setIsLoading(true)
        setError(null)
        setAttendanceMap({})

        // STEP 1: Fetch students enrolled in this batch
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollment')
          .select(`
            enrollment_id,
            student:student_id (
              student_id,
              name
            )
          `)
          .eq('batch_id', selectedBatchId)
          .order('created_at', { ascending: false })

        if (enrollmentError) throw enrollmentError

        // Transform enrollment data to student list
        const studentsList = (enrollmentData || []).map((enrollment) => ({
          ...enrollment.student,
          enrollment_id: enrollment.enrollment_id
        }))

        setStudents(studentsList)

        // STEP 2: Check if class exists for this batch + date
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('class_id')
          .eq('batch_id', selectedBatchId)
          .eq('class_date', attendanceDate)
          .single()

        if (classError && classError.code !== 'PGRST116') {
          // PGRST116 = no rows found (expected if no class exists yet)
          throw classError
        }

        if (classData) {
          // Class exists, fetch existing attendance
          setClassId(classData.class_id)
          const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance')
            .select('student_id, status')
            .eq('class_id', classData.class_id)

          if (attendanceError) throw attendanceError

          // Build attendance map from existing data
          const newAttendanceMap = {}
          attendanceData?.forEach((record) => {
            newAttendanceMap[record.student_id] = record.status
          })
          setAttendanceMap(newAttendanceMap)
        } else {
          // No class exists yet
          setClassId(null)
          setAttendanceMap({})
        }
      } catch (err) {
        console.error('Error fetching students/attendance:', err)
        setError(err.message || 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudentsAndAttendance()
  }, [selectedBatchId, attendanceDate])

  // ============================================
  // MARK ATTENDANCE
  // ============================================
  const markAttendance = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status
    }))
  }

  // ============================================
  // SAVE ATTENDANCE
  // ============================================
  const handleSaveAttendance = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage('')

      if (!selectedBatchId) {
        throw new Error('Please select a batch')
      }

      if (students.length === 0) {
        throw new Error('No students found for this batch')
      }

      // STEP 1: Create or get class_id
      let currentClassId = classId

      if (!currentClassId) {
        const { data: newClass, error: createClassError } = await supabase
          .from('classes')
          .insert([{
            batch_id: selectedBatchId,
            class_date: attendanceDate
          }])
          .select('class_id')
          .single()

        if (createClassError) throw createClassError
        currentClassId = newClass.class_id
        setClassId(currentClassId)
      }

      // STEP 2: Prepare attendance records for upsert
      const attendanceRecords = students
        .filter((student) => attendanceMap[student.student_id]) // Only marked students
        .map((student) => ({
          class_id: currentClassId,
          student_id: student.student_id,
          status: attendanceMap[student.student_id]
        }))

      // STEP 3: Delete existing records and insert new ones
      // (This is safer than upsert for this scenario)
      if (attendanceRecords.length > 0) {
        // Delete existing attendance for this class
        const { error: deleteError } = await supabase
          .from('attendance')
          .delete()
          .eq('class_id', currentClassId)

        if (deleteError) throw deleteError

        // Insert new attendance records
        const { error: insertError } = await supabase
          .from('attendance')
          .insert(attendanceRecords)

        if (insertError) throw insertError
      }

      // Show success message
      setSuccessMessage('✓ Attendance saved successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Error saving attendance:', err)
      setError(err.message || 'Failed to save attendance')
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // CALCULATE SUMMARY
  // ============================================
  const getTotalStudents = () => students.length
  const getPresentCount = () =>
    students.filter((s) => attendanceMap[s.student_id] === 'Present').length
  const getAbsentCount = () =>
    students.filter((s) => attendanceMap[s.student_id] === 'Absent').length

  // ============================================
  // GET TODAY'S DATE (for min date in picker)
  // ============================================
  const getMaxDate = () => new Date().toISOString().split('T')[0]

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="page-container attendance-page">
      <Header />

      <main className="attendance-main">
        {/* ========== TOP SECTION ========== */}
        <div className="attendance-controls">
          {/* Batch Dropdown */}
          <div className="control-group">
            <label htmlFor="batch-select">Select Batch</label>
            <select
              id="batch-select"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="batch-select"
            >
              <option value="">-- Choose a Batch --</option>
              {batches.map((batch) => (
                <option key={batch.batch_id} value={batch.batch_id}>
                  {batch.batch_name} ({batch.grade})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="control-group">
            <label htmlFor="date-picker">Date</label>
            <input
              id="date-picker"
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              max={getMaxDate()}
              className="date-picker"
            />
          </div>
        </div>

        {/* ========== ERROR MESSAGE ========== */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* ========== SUCCESS MESSAGE ========== */}
        {successMessage && (
          <div className="success-message">
            <p>{successMessage}</p>
          </div>
        )}

        {/* ========== SUMMARY CARDS ========== */}
        {selectedBatchId && (
          <div className="summary-cards-container">
            <AttendanceSummaryCard
              title="Total Students"
              value={getTotalStudents()}
              type="total"
            />
            <AttendanceSummaryCard
              title="Present"
              value={getPresentCount()}
              type="present"
            />
            <AttendanceSummaryCard
              title="Absent"
              value={getAbsentCount()}
              type="absent"
            />
          </div>
        )}

        {/* ========== STUDENTS LIST ========== */}
        <div className="students-list-section">
          {isLoading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading students...</p>
            </div>
          )}

          {!isLoading && !selectedBatchId && (
            <div className="empty-state">
              <p>Select a batch to view and mark attendance</p>
            </div>
          )}

          {!isLoading && selectedBatchId && students.length === 0 && (
            <div className="empty-state">
              <p>No students found for this batch</p>
            </div>
          )}

          {!isLoading && students.length > 0 && (
            <>
              <div className="students-grid">
                {students.map((student) => (
                  <StudentAttendanceCard
                    key={student.student_id}
                    student={student}
                    status={attendanceMap[student.student_id] || null}
                    onMarkPresent={() =>
                      markAttendance(student.student_id, 'Present')
                    }
                    onMarkAbsent={() =>
                      markAttendance(student.student_id, 'Absent')
                    }
                  />
                ))}
              </div>

              {/* SAVE BUTTON */}
              <div className="attendance-footer">
                <button
                  className="save-attendance-btn"
                  onClick={handleSaveAttendance}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export default Attendance
