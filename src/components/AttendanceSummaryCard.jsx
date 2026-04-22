import '../styles/components/AttendanceSummaryCard.css'
import { FaUsers, FaCheck, FaTimes } from 'react-icons/fa'

/**
 * AttendanceSummaryCard Component
 * Displays a summary metric for attendance (Total, Present, Absent)
 * 
 * Props:
 * - title: Card title (e.g., "Total Students")
 * - value: The count/value to display
 * - icon: React Icon component
 * - type: 'total' | 'present' | 'absent' (for styling)
 */
function AttendanceSummaryCard({ title, value, type = 'total' }) {
  const getIcon = () => {
    switch (type) {
      case 'total':
        return <FaUsers size={24} />
      case 'present':
        return <FaCheck size={24} />
      case 'absent':
        return <FaTimes size={24} />
      default:
        return <FaUsers size={24} />
    }
  }

  return (
    <div className={`summary-card summary-card-${type}`}>
      <div className="summary-icon">
        {getIcon()}
      </div>
      <div className="summary-content">
        <p className="summary-label">{title}</p>
        <p className="summary-value">{value}</p>
      </div>
    </div>
  )
}

export default AttendanceSummaryCard
