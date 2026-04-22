import Header from '../components/Header'
import SummaryCard from '../components/SummaryCard'
import ActionCard from '../components/ActionCard'
import BottomNav from '../components/BottomNav'
import '../styles/pages/Dashboard.css'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

// Icons from react-icons
import { FaUsers, FaUser, FaMoneyBillWave, FaClipboard } from 'react-icons/fa'
import { FaPlus, FaCheckCircle, FaWallet, FaComments } from 'react-icons/fa'
import { GrGroup } from 'react-icons/gr'

/**
 * Dashboard Component
 * Main page after login showing class management cards
 * Mobile-first responsive design with three sections
 * Fetches real data from Supabase for batches and active students counts
 */
function Dashboard({ onLogout }) {
  const navigate = useNavigate()
  
  // State management for dashboard data
  const [totalBatches, setTotalBatches] = useState(0)
  const [totalStudents, setTotalStudents] = useState(0)
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(true)

  /**
   * Fetch total number of batches from Supabase
   * Uses efficient count query (head: true) to avoid fetching full data
   */
  const fetchTotalBatches = async () => {
    try {
      setLoadingBatches(true)
      const { count, error } = await supabase
        .from('batch')
        .select('*', { count: 'exact', head: true })

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
      
      // First, try to fetch with status filter for active students
      const { count, error } = await supabase
        .from('student')
        .select('*', { count: 'exact', head: true })
        //.eq('status', 'active')
        // we do not need the folooing status column check 
        
      if (error && error.code === 'PGRST116') {
        // Status column doesn't exist, fetch all students instead
        console.log('Status field not found, counting all students')
        const { count: allCount, error: allError } = await supabase
          .from('student')
          .select('*', { count: 'exact', head: true })

        if (allError) {
          console.error('Error fetching students:', allError)
          setTotalStudents(0)
        } else {
          setTotalStudents(allCount || 0)
        }
      } else if (error) {
        console.error('Error fetching active students:', error)
        setTotalStudents(0)
      } else {
        setTotalStudents(count || 0)
      }
    } catch (err) {
      console.error('Unexpected error fetching students:', err)
      setTotalStudents(0)
    } finally {
      setLoadingStudents(false)
    }
  }

  /**
   * Fetch data on component mount
   * Runs both queries in parallel for better performance
   */
  useEffect(() => {
    // Run both fetch functions in parallel
    Promise.all([fetchTotalBatches(), fetchTotalStudents()])
  }, [])

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
      number: '₹8,500', 
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
