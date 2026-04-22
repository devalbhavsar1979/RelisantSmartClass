import '../styles/components/BatchCard.css'
import { FaCheckCircle, FaWallet, FaComments, FaUsers, FaMoneyBill, FaCalendar, FaMapMarkerAlt, FaClock, FaUserPlus, FaEdit, FaTrash } from 'react-icons/fa'

/**
 * BatchCard Component
 * Displays individual batch information with action buttons
 * Includes Edit and Delete buttons in the header
 */
function BatchCard({
  batch,
  onTakeAttendance,
  onCollectFees,
  onSendCommunication,
  onAddStudent,
  onEdit,
  onDelete
}) {
  // Debug: Log batch object to see what properties it has
  console.log('BatchCard received batch:', batch)
  
  return (
    <div className="batch-card">
      {/* Batch Header with Edit/Delete */}
      <div className="batch-header">
        <h3 className="batch-name">
          {batch.batch_name || 'Untitled Batch'}
        </h3>
        <div className="batch-header-actions">
          <button 
            className="header-action-btn edit-btn" 
            onClick={onEdit}
            title="Edit Batch"
            aria-label="Edit Batch"
          >
            <FaEdit size={55} />
          </button>
          <button 
            className="header-action-btn delete-btn" 
            onClick={onDelete}
            title="Delete Batch"
            aria-label="Delete Batch"
          >
            <FaTrash size={22} />
          </button>
        </div>
      </div>

      {/* Grade Display */}
      <div className="batch-grade-section">
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
          className="action-btn add-student-btn"
          onClick={onAddStudent}
          title="View Students"
        >
          <FaUserPlus size={18} />
          <span>View Students</span>
        </button>
        
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
      </div>
    </div>
  )
}

export default BatchCard
