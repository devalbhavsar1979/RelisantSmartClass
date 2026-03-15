import '../styles/components/ActionCard.css'

/**
 * ActionCard Component
 * Displays an action card with icon, title, description, and button
 */
function ActionCard({ icon: Icon, title, description, onClick }) {
  return (
    <div className="action-card">
      <div className="action-icon">
        <Icon size={48} />
      </div>
      <div className="action-content">
        <h3 className="action-title">{title}</h3>
        <p className="action-description">{description}</p>
      </div>
      <button className="action-button" onClick={onClick}>
        <span>Go</span>
      </button>
    </div>
  )
}

export default ActionCard
