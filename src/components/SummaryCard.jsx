import '../styles/components/SummaryCard.css'

/**
 * SummaryCard Component
 * Displays a summary statistic with icon, title, and number
 */
function SummaryCard({ icon: Icon, title, number, color }) {
  return (
    <div className={`summary-card ${color}`}>
      <div className="summary-icon">
        <Icon size={32} />
      </div>
      <div className="summary-info">
        <p className="summary-title">{title}</p>
        <p className="summary-number">{number}</p>
      </div>
    </div>
  )
}

export default SummaryCard
