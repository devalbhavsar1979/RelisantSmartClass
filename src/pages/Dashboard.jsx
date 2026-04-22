import Header from '../components/Header'
import SummaryCard from '../components/SummaryCard'
import ActionCard from '../components/ActionCard'
import BottomNav from '../components/BottomNav'
import '../styles/pages/Dashboard.css'
import '../styles/components/UserInfoSection.css'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useContext } from 'react'
import { supabase } from '../services/supabaseClient'
import { getGroupActiveStudentCount, getGroupPendingFeesSummary } from '../services/supabaseFees'
import { UserContext } from '../contexts/UserContext'

// Icons from react-icons
import { FaUsers, FaUser, FaMoneyBillWave, FaClipboard } from 'react-icons/fa'
import { FaPlus, FaCheckCircle, FaWallet, FaComments } from 'react-icons/fa'
import { GrGroup } from 'react-icons/gr'

/**
 * Dashboard Component
 * Main page after login showing class management cards
 * Mobile-first responsive design with three sections
 * Fetches real data from Supabase for batches and active students counts
 * Displays user info and group tuition from UserContext (multi-tenant)
 */
function Dashboard({ onLogout }) {
  const navigate = useNavigate()
  const { userData, groupData, isLoading: userDataLoading, error: userDataError } = useContext(UserContext)
  
  // State management for dashboard data
  const [totalBatches, setTotalBatches] = useState(0)
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalPendingFees, setTotalPendingFees] = useState(0)
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingPendingFees, setLoadingPendingFees] = useState(true)

  /**
   * Fetch total number of batches from Supabase
   * Filtered by user's group_tuition_id for multi-tenant support
   * Uses efficient count query (head: true) to avoid fetching full data
   */
  const fetchTotalBatches = async () => {
    try {
      setLoadingBatches(true)
      
      // If user data not loaded yet, wait
      if (userDataLoading) {
        setLoadingBatches(false)
        return
      }

      // Check if user data is available with group_tuition_id
      if (!userData || !userData.group_tuition_id) {
        setTotalBatches(0)
        setLoadingBatches(false)
        return
      }

      const { count, error } = await supabase
        .from('batch')
        .select('*', { count: 'exact', head: true })
        .eq('group_tuition_id', userData.group_tuition_id)

      if (error) {
        console.error('Error fetching batches:', error)
        setTotalBatches(0)
      } else {
        setTotalBatches(count || 0)
      }
    } catch (err) {
      console.error('Unexpected error fetching batches:', err)
      setTotalBatches(0)
    } finally {
      setLoadingBatches(false)
    }
  }

  /**
   * Fetch total number of active students from Supabase
   * Checks for status field and counts only active students if it exists
   * Otherwise counts all students
   */
  const fetchTotalStudents = async () => {
    try {
      setLoadingStudents(true)

      if (!userData || !userData.group_tuition_id) {
        setTotalStudents(0)
        return
      }

      const activeStudentCount = await getGroupActiveStudentCount(userData.group_tuition_id)
      setTotalStudents(activeStudentCount)
    } catch (err) {
      console.error('Unexpected error fetching students:', err)
      setTotalStudents(0)
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchPendingFees = async () => {
    try {
      setLoadingPendingFees(true)

      if (!userData || !userData.group_tuition_id) {
        setTotalPendingFees(0)
        return
      }

      const { totalPendingAmount } = await getGroupPendingFeesSummary(userData.group_tuition_id)
      setTotalPendingFees(totalPendingAmount)
    } catch (err) {
      console.error('Unexpected error fetching pending fees:', err)
      setTotalPendingFees(0)
    } finally {
      setLoadingPendingFees(false)
    }
  }

  /**
   * Fetch data on component mount or when userData changes
   * Runs both queries in parallel for better performance
   */
  useEffect(() => {
    if (!userDataLoading && userData && userData.group_tuition_id) {
      fetchTotalBatches()
      fetchTotalStudents()
      fetchPendingFees()
    } else {
      setTotalStudents(0)
      setTotalPendingFees(0)
    }
  }, [userData, userDataLoading])

  // Build summary cards data with real counts
  const summaryCards = [
    { 
      id: 1, 
      icon: GrGroup, 
      title: 'Total Batches', 
      number: loadingBatches ? '...' : totalBatches.toString(), 
      color: 'card-blue' 
    },
    { 
      id: 2, 
      icon: FaUser, 
      title: 'Active Students', 
      number: loadingStudents ? '...' : totalStudents.toString(), 
      color: 'card-green' 
    },
    { 
      id: 3, 
      icon: FaMoneyBillWave, 
      title: 'Pending Fees', 
      number: loadingPendingFees ? '...' : `₹${totalPendingFees.toLocaleString('en-IN')}`, 
      color: 'card-purple' 
    },
    { 
      id: 4, 
      icon: FaClipboard, 
      title: 'Assignments', 
      number: '12', 
      color: 'card-orange' 
    }
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
      onClick: () => navigate('/attendance')
    },
    {
      id: 3,
      icon: FaWallet,
      title: 'Collect Fees',
      description: 'Record fee payments',
      onClick: () => navigate('/fees')
    },
    {
      id: 4,
      icon: FaComments,
      title: 'Send Communication',
      description: 'Message to parents/students',
      onClick: () => navigate('/communication')
    }
  ]

  return (
    <div className="dashboard-container">
      {/* Header Component */}
      <Header onLogout={onLogout} />

      {/* Main Content */}
      <main className="dashboard-content">
        {/* User Info Section - Display logged-in user and group info */}
        {userDataError && (
          <div className="user-info-error">
            ⚠️ {userDataError}
          </div>
        )}

        {/* Show user info if userData is available (groupData is optional) */}
        {userData && (
          <section className={`user-info-section ${userDataLoading ? 'loading' : ''}`}>
            <div className="user-greeting">
              <span className="greeting-text">Welcome,</span>
              <span className="greeting-name">{userData.full_name || 'User'}</span>
            </div>
            {groupData && (
              <div className="group-info">
                <span className="group-label">Group</span>
                <span className="group-name">{groupData.group_name || 'Organization'}</span>
              </div>
            )}
          </section>
        )}

        {/* Loading state while user data is being fetched */}
        {userDataLoading && !userData && (
          <section className="user-info-section loading">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="spinner"></div>
              <span>Loading your information...</span>
            </div>
          </section>
        )}

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
