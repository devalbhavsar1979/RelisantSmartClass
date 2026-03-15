import '../styles/components/BatchCard.css'
import { FaCheckCircle, FaWallet, FaComments, FaUsers, FaMoneyBill, FaCalendar, FaMapMarkerAlt, FaClock, FaUserPlus } from 'react-icons/fa'

/**
 * BatchCard Component
 * Displays individual batch information with action buttons
 */
function BatchCard({
  batch,
  onTakeAttendance,
  onCollectFees,
  onSendCommunication,
  onAddStudent
}) {
  return (
    <div className="batch-card">
      {/* Batch Header */}
      <div className="batch-header">
        <h3 className="batch-name">{batch.name}</h3>
        <span className="batch-grade">{batch.grade}</span>
      </div>

      {/* Batch Details Grid */}
      <div className="batch-details">
        <div className="detail-item">
          <div className="detail-icon students-icon">
            <FaUsers size={16} />
          </div>
          <span className="detail-label">Students</span>
          <span className="detail-value">{batch.students}</span>
        </div>

        <div className="detail-item">
          <div className="detail-icon fees-icon">
            <FaMoneyBill size={16} />
          </div>
          <span className="detail-label">Monthly Fees</span>
          <span className="detail-value">{batch.fees}</span>
        </div>

        <div className="detail-item">
          <div className="detail-icon days-icon">
            <FaCalendar size={16} />
          </div>
          <span className="detail-label">Days</span>
          <span className="detail-value">{batch.days}</span>
        </div>

        <div className="detail-item">
          <div className="detail-icon location-icon">
            <FaMapMarkerAlt size={16} />
          </div>
          <span className="detail-label">Location</span>
          <span className="detail-value">{batch.location}</span>
        </div>

        <div className="detail-item">
          <div className="detail-icon time-icon">
            <FaClock size={16} />
          </div>
          <span className="detail-label">Time</span>
          <span className="detail-value">{batch.time}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="batch-actions">
        <button
          className="action-btn attendance-btn"
          onClick={onTakeAttendance}
          title="Take Attendance"
        >
          <FaCheckCircle size={18} />
          <span>Take Attendance</span>
        </button>

        <button
          className="action-btn fees-btn"
          onClick={onCollectFees}
          title="Collect Fees"
        >
          <FaWallet size={18} />
          <span>Collect Fees</span>
        </button>

        <button
          className="action-btn communication-btn"
          onClick={onSendCommunication}
          title="Send Communication"
        >
          <FaComments size={18} />
          <span>Send Communication</span>
        </button>

        <button
          className="action-btn add-student-btn"
          onClick={onAddStudent}
          title="Add Student"
        >
          <FaUserPlus size={18} />
          <span>Add Student</span>
        </button>
      </div>
    </div>
  )
}

export default BatchCard
