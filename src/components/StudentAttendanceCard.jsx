import '../styles/components/StudentAttendanceCard.css'
import { FaCheck, FaTimes } from 'react-icons/fa'

/**
 * StudentAttendanceCard Component
 * Displays a student's attendance card with status toggle buttons
 * 
 * Props:
 * - student: Student object with name, student_id, roll_number
 * - status: Current attendance status ('Present', 'Absent', or null)
 * - onMarkPresent: Callback function to mark as present
 * - onMarkAbsent: Callback function to mark as absent
 */
function StudentAttendanceCard({
  student,
  status,
  onMarkPresent,
  onMarkAbsent
}) {
  // Extract student data
  const studentName = student?.name || 'Unknown'
  const studentId = student?.student_id || student?.id || ''
  
  // Generate initials for avatar
  const initials = studentName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="student-attendance-card">
      {/* Student Avatar & Info */}
      <div className="student-info">
        <div className="student-avatar">
          {initials}
        </div>
        <div className="student-details">
          <h4 className="student-name">{studentName}</h4>
          <p className="student-id">ID: {studentId.toString().slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="attendance-status">
        {status ? (
          <span className={`status-badge status-${status.toLowerCase()}`}>
            {status}
          </span>
        ) : (
          <span className="status-badge status-pending">Not Marked</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="attendance-actions">
        <button
          className={`attendance-btn present-btn ${status === 'Present' ? 'active' : ''}`}
          onClick={onMarkPresent}
          title="Mark Present"
          aria-label={`Mark ${studentName} as present`}
        >
          <FaCheck size={18} />
          <span>Present</span>
        </button>

        <button
          className={`attendance-btn absent-btn ${status === 'Absent' ? 'active' : ''}`}
          onClick={onMarkAbsent}
          title="Mark Absent"
          aria-label={`Mark ${studentName} as absent`}
        >
          <FaTimes size={18} />
          <span>Absent</span>
        </button>
      </div>
    </div>
  )
}

export default StudentAttendanceCard
