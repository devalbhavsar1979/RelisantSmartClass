import axios from 'axios'

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0'
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN

const validatePhone = (phone) => /^\d{10,15}$/.test(phone)

async function sendWhatsAppMessage({ phone, message }) {
  const whatsappPayload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: {
      body: message
    }
  }

  const response = await axios.post(
    `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
    whatsappPayload,
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  )

  return response.data
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  if (!PHONE_NUMBER_ID || !WHATSAPP_TOKEN) {
    return res.status(500).json({
      success: false,
      error: 'WhatsApp credentials are not configured. Please set PHONE_NUMBER_ID and WHATSAPP_TOKEN.'
    })
  }

  const { phone, message } = req.body || {}

  if (!phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: phone, message'
    })
  }

  if (!validatePhone(phone)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone format. Use international digits only (e.g. 919876543210)'
    })
  }

  try {
    const data = await sendWhatsAppMessage({ phone, message })

    const messageId = data?.messages?.[0]?.id
    const status = data?.messages?.[0]?.message_status || 'sent'

    return res.status(200).json({
      success: true,
      messageId,
      status,
      phone,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const errorData = error.response?.data
    const errorMessage = errorData?.error?.message || error.message || 'WhatsApp API error'
    const errorCode = errorData?.error?.code || 'UNKNOWN'
    const statusCode = error.response?.status || 500

    console.error('current auth code',WHATSAPP_TOKEN)
    console.error('WhatsApp API error:', errorMessage, errorCode)

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? errorData : undefined
    })
  }
}
