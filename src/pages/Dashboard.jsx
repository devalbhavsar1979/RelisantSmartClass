import Header from '../components/Header'
import SummaryCard from '../components/SummaryCard'
import ActionCard from '../components/ActionCard'
import BottomNav from '../components/BottomNav'
import '../styles/pages/Dashboard.css'
import { useNavigate } from 'react-router-dom'

// Icons from react-icons
import { FaUsers, FaUser, FaMoneyBillWave, FaClipboard } from 'react-icons/fa'
import { FaPlus, FaCheckCircle, FaWallet, FaComments } from 'react-icons/fa'
import { GrGroup } from 'react-icons/gr'

/**
 * Dashboard Component
 * Main page after login showing class management cards
 * Mobile-first responsive design with three sections
 */
function Dashboard({ onLogout }) {
  const navigate = useNavigate()
  // Summary cards data
  const summaryCards = [
    { id: 1, icon: GrGroup, title: 'Total Batches', number: '6', color: 'card-blue' },
    { id: 2, icon: FaUser, title: 'Active Students', number: '120', color: 'card-green' },
    { id: 3, icon: FaMoneyBillWave, title: 'Pending Fees', number: '₹8,500', color: 'card-purple' },
    { id: 4, icon: FaClipboard, title: 'Assignments', number: '12', color: 'card-orange' }
  ]

  // Action cards data
  const actionCards = [
    {
      id: 1,
      icon: GrGroup,
      title: 'Batch Management',
      description: 'Bath, student, fee management',
      onClick: () => navigate('/batches')
    },
    {
      id: 2,
      icon: FaCheckCircle,
      title: 'Take Attendance',
      description: 'Mark student attendance',
      onClick: () => console.log('Take Attendance clicked')
    },
    {
      id: 3,
      icon: FaWallet,
      title: 'Collect Fees',
      description: 'Record fee payments',
      onClick: () => console.log('Collect Fees clicked')
    },
    {
      id: 4,
      icon: FaComments,
      title: 'Send Communication',
      description: 'Message to parents/students',
      onClick: () => console.log('Send Communication clicked')
    }
  ]

  return (
    <div className="dashboard-container">
      {/* Header Component */}
      <Header onLogout={onLogout} />

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Welcome Section */}
        <section className="welcome-section">
          <h2>Welcome Relisant Smart Class</h2>
          <p>Manage your classes efficiently</p>
        </section>

        {/* SECTION 1: SUMMARY CARDS */}
        <section className="summary-section">
          <h3 className="section-title">Overview</h3>
          <div className="summary-grid">
            {summaryCards.map((card) => (
              <SummaryCard
                key={card.id}
                icon={card.icon}
                title={card.title}
                number={card.number}
                color={card.color}
              />
            ))}
          </div>
        </section>

        {/* SECTION 2: QUICK ACTION CARDS */}
        <section className="action-section">
          <h3 className="section-title">Quick Actions</h3>
          <div className="action-grid">
            {actionCards.map((card) => (
              <ActionCard
                key={card.id}
                icon={card.icon}
                title={card.title}
                description={card.description}
                onClick={card.onClick}
              />
            ))}
          </div>
        </section>

        {/* Spacer for bottom navigation */}
        <div className="nav-spacer"></div>
      </main>

      {/* SECTION 3: BOTTOM NAVIGATION */}
      <BottomNav />
    </div>
  )
}

export default Dashboard
