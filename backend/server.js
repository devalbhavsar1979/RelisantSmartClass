/**
 * WhatsApp Communication API Backend
 * Handles sending WhatsApp messages via Meta WhatsApp Business API (Graph API)
 * 
 * Setup Instructions:
 * 1. Install dependencies: npm install express dotenv axios cors
 * 2. Create .env file with WhatsApp credentials (see .env.example)
 * 3. Run with: node server.js
 * 
 * API Endpoint:
 * POST /api/send-whatsapp
 */

const express = require('express')
const axios = require('axios')
require('dotenv').config()

const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Enable CORS for frontend access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// WhatsApp API Configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0'
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN

// Validate environment variables on startup
if (!PHONE_NUMBER_ID || !WHATSAPP_TOKEN) {
  console.error('❌ Missing required environment variables:')
  console.error('   - PHONE_NUMBER_ID')
  console.error('   - WHATSAPP_TOKEN')
  console.error('\nPlease add these to your .env file')
  process.exit(1)
}

/**
 * Main endpoint: Send WhatsApp message
 * POST /api/send-whatsapp
 * 
 * Request body:
 * {
 *   "phone": "919876543210",
 *   "message": "Hello! This is a test message",
 *   "studentId": 1,                    // Optional: for logging
 *   "messageType": "announcement",      // Optional: for logging
 *   "timestamp": "2024-01-15T10:30:00Z" // Optional: for logging
 * }
 * 
 * Response:
 * Success: { success: true, messageId: "wamid.xxxxx", status: "delivered" }
 * Error: { success: false, error: "Error message" }
 */
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { phone, message, studentId, messageType, timestamp } = req.body

    // Validate request
    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phone, message'
      })
    }

    // Validate phone format (international format with country code)
    if (!/^\d{10,15}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone format. Use international format without + or spaces (e.g., 919876543210)'
      })
    }

    // Prepare WhatsApp API request
    const whatsappPayload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: {
        body: message
      }
    }

    // Call WhatsApp API
    console.log(`📱 Sending WhatsApp message to ${phone}...`)

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      whatsappPayload,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // Extract message ID and status
    const messageId = response.data?.messages?.[0]?.id
    const status = response.data?.messages?.[0]?.message_status || 'sent'

    console.log(`✅ Message sent successfully to ${phone}`)
    console.log(`   Message ID: ${messageId}`)
    console.log(`   Status: ${status}`)

    // Log to database (optional - implement as needed)
    if (studentId) {
      logCommunication({
        studentId,
        phone,
        messageType,
        status: 'sent',
        messageId,
        timestamp: timestamp || new Date().toISOString()
      })
    }

    // Return success response
    res.json({
      success: true,
      messageId: messageId,
      status: status,
      phone: phone,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    // Handle WhatsApp API errors
    if (error.response?.data) {
      const errorData = error.response.data
      const errorMessage = errorData?.error?.message || 'WhatsApp API error'
      const errorCode = errorData?.error?.code || 'UNKNOWN'

      console.error(`❌ WhatsApp API Error (${errorCode}): ${errorMessage}`)

      return res.status(error.response.status).json({
        success: false,
        error: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? errorData : undefined
      })
    }

    // Handle network/other errors
    console.error('❌ Error sending WhatsApp message:', error.message)

    res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp message. Please try again later.'
    })
  }
})

/**
 * Optional: Log communication to database
 * Implement this function if you have a communication_logs table
 */
async function logCommunication(data) {
  try {
    // Implement logging to your database
    // Example with Supabase:
    // const { supabase } = require('./path-to-supabase-client')
    // await supabase.from('communication_logs').insert([{
    //   student_id: data.studentId,
    //   phone: data.phone,
    //   status: data.status,
    //   message_type: data.messageType,
    //   message_id: data.messageId,
    //   sent_at: data.timestamp
    // }])

    console.log(`📝 Logged communication for student ${data.studentId}`)
  } catch (error) {
    console.error('Failed to log communication:', error.message)
    // Don't throw - just log silently
  }
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Communication API'
  })
})

/**
 * Webhook for receiving WhatsApp messages (optional - for two-way communication)
 */
app.post('/api/webhook', (req, res) => {
  const { object, entry } = req.body

  // Verify webhook token
  const token = req.query.hub_verify_token
  if (token !== process.env.WEBHOOK_VERIFY_TOKEN) {
    return res.status(403).json({ success: false, error: 'Invalid token' })
  }

  // Process incoming messages
  if (object === 'whatsapp_business_account') {
    entry.forEach(({ changes }) => {
      changes.forEach(({ value }) => {
        if (value.messages) {
          value.messages.forEach(message => {
            console.log('Incoming message:', message)
            // Handle incoming message as needed
          })
        }

        if (value.statuses) {
          value.statuses.forEach(status => {
            console.log('Message status update:', status)
            // Update message status in database
          })
        }
      })
    })
  }

  res.sendStatus(200)
})

/**
 * Webhook verification endpoint
 */
app.get('/api/webhook', (req, res) => {
  const token = req.query.hub_verify_token
  const challenge = req.query.hub_challenge

  if (token === process.env.WEBHOOK_VERIFY_TOKEN) {
    res.send(challenge)
  } else {
    res.sendStatus(403)
  }
})

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  })
})

/**
 * Start server
 */
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  WhatsApp Communication API Server     ║
║  🚀 Server running on port ${PORT}       ║
║  📱 Ready to send WhatsApp messages    ║
║  ✅ WhatsApp Account ID: ${PHONE_NUMBER_ID}  ║
╚════════════════════════════════════════╝
  `)
})

module.exports = app
