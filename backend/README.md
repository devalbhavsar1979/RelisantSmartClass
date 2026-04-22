# WhatsApp Communication API Backend

Backend service for sending WhatsApp messages to parents in the Relisant SmartClass Tuition Management System.

## Overview

This Node.js/Express backend:
- Sends WhatsApp messages via Meta's WhatsApp Business API (Graph API v18.0)
- Handles bulk message sending with rate limiting
- Logs communication history (optional)
- Supports message delivery status tracking
- Validates phone numbers and message content

## Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **WhatsApp Business Account** (with API credentials)
- **Meta Developer Account**

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

Or with yarn:
```bash
yarn install
```

### Step 2: Get WhatsApp API Credentials

1. **Create a Meta Business Account**
   - Go to [https://www.whatsapp.com/business/downloads/](https://www.whatsapp.com/business/downloads/)
   - Sign in/Create account
   - Set up WhatsApp Business Account

2. **Create a Meta Developer App**
   - Go to [https://developers.facebook.com](https://developers.facebook.com)
   - Click "My Apps" → "Create App"
   - Choose "Business" app type
   - Fill in app details

3. **Add WhatsApp Product**
   - In your app dashboard, click "Add Product"
   - Find "WhatsApp" and click "Set Up"
   - Follow the setup wizard

4. **Get Your Credentials**
   - Navigate to WhatsApp > API Setup
   - Copy your **Phone Number ID**
   - Generate a temporary **Access Token** (or create a permanent one)
   - Your **Business Phone Number** (the WhatsApp number)

### Step 3: Create .env File

```bash
cp .env.example .env
```

Edit `.env` and add your WhatsApp credentials:

```env
NODE_ENV=development
PORT=5000

# WhatsApp API Credentials
PHONE_NUMBER_ID=123456789012345
WHATSAPP_TOKEN=EAAexxxxxxxxxxxxxxxx
WHATSAPP_API_URL=https://graph.facebook.com/v18.0

WEBHOOK_VERIFY_TOKEN=your_custom_webhook_token
FRONTEND_URL=http://localhost:5173
```

### Step 4: Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will start on `http://localhost:5000`

## API Endpoints

### 1. Send WhatsApp Message

**Endpoint:** `POST /api/send-whatsapp`

**Request Body:**
```json
{
  "phone": "919876543210",
  "message": "Hello! This is a test message",
  "studentId": 1,
  "messageType": "announcement",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response (Success):**
```json
{
  "success": true,
  "messageId": "wamid.HBEUzz1UU1V5qf21vf3nYTZGLfx7bg==",
  "status": "sent",
  "phone": "919876543210",
  "timestamp": "2024-01-15T10:30:45Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid phone format",
  "code": "INVALID_PHONE"
}
```

### 2. Health Check

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45Z",
  "service": "WhatsApp Communication API"
}
```

### 3. Webhook (Optional)

For receiving incoming messages and delivery updates:

**Endpoint:** `GET|POST /api/webhook`

## Frontend Integration

### How the Frontend Calls the API

```javascript
// In Communication.jsx
const response = await fetch('/api/send-whatsapp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: student.parent_contact,
    message: personalizedMessage,
    studentId: student.student_id,
    messageType: formData.messageType,
    timestamp: new Date().toISOString()
  })
})

const result = await response.json()
if (result.success) {
  console.log('Message sent:', result.messageId)
}
```

## Phone Number Format

WhatsApp requires phone numbers in international format **without** country code prefix symbols:

✅ **Correct formats:**
- 919876543210 (India)
- 14155552671 (USA)
- 447911123456 (UK)

❌ **Incorrect formats:**
- +919876543210 (has +)
- +91-9876543210 (has special chars)
- (98) 7654-3210 (has special chars)

## Message Template

The frontend supports variable substitution:

```
{student_name}    - Student's name
{amount}          - Fee amount
{date}            - Current or specified date
{batch_name}      - Batch name
```

Example:
```
"Dear Parent, ₹{amount} fee is pending for {student_name} in {batch_name}. Please pay at the earliest."
```

## Rate Limiting

- **Per-request delay:** 300ms (prevents WhatsApp rate limiting)
- **Max bulk send:** Configurable (default: no limit, but recommended ~1000/sec per account)

To change delay in frontend, edit `Communication.jsx`:
```javascript
await new Promise(resolve => setTimeout(resolve, 300)) // Change delay here
```

## Error Handling

Common error codes and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `INVALID_PHONE` | Phone number format incorrect | Use international format only |
| `INVALID_TOKEN` | Access token expired/invalid | Generate new token from Meta app |
| `RESOURCE_EXHAUSTED` | Rate limit exceeded | Increase delay between messages |
| `MISSING_PERMISSION` | Token lacks required permission | Add permissions in Meta app |
| `ERROR_100` | Invalid request body | Check message length/format |

## Optional: Database Logging

To enable communication history logging:

### 1. Create Supabase Table

```sql
CREATE TABLE communication_logs (
  id BIGSERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(50),
  status VARCHAR(50),
  message_id VARCHAR(255),
  sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES student(student_id)
);

CREATE INDEX idx_communication_logs_student_id ON communication_logs(student_id);
CREATE INDEX idx_communication_logs_sent_at ON communication_logs(sent_at);
```

### 2. Enable Logging in Backend

Uncomment and configure the `logCommunication()` function in `server.js`:

```javascript
async function logCommunication(data) {
  const { supabase } = require('./path-to-supabase-client')
  await supabase.from('communication_logs').insert([{
    student_id: data.studentId,
    phone: data.phone,
    status: data.status,
    message_type: data.messageType,
    message_id: data.messageId,
    sent_at: data.timestamp
  }])
}
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Connect Vercel to GitHub repo
3. Add environment variables in Vercel dashboard
4. Set build command: `npm install`
5. Set start command: `npm start`

### Deploy to Heroku

```bash
heroku login
heroku create your-app-name
git push heroku main
heroku config:set PHONE_NUMBER_ID=xxx WHATSAPP_TOKEN=xxx
```

### Deploy to DigitalOcean/AWS/GCP

Follow their Node.js deployment guides and set environment variables.

## Testing

### Test with cURL

```bash
curl -X POST http://localhost:5000/api/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "919876543210",
    "message": "Hello from Relisant SmartClass!",
    "studentId": 1,
    "messageType": "announcement"
  }'
```

### Test with Postman

1. Create new POST request
2. URL: `http://localhost:5000/api/send-whatsapp`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
```json
{
  "phone": "919876543210",
  "message": "Test message",
  "studentId": 1,
  "messageType": "announcement"
}
```

## Troubleshooting

### "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### "ECONNREFUSED: Connection refused"
- Check if server is running
- Verify PORT in .env file

### "Missing PHONE_NUMBER_ID or WHATSAPP_TOKEN"
- Copy `.env.example` to `.env`
- Fill in your actual credentials
- Restart server

### "Invalid access token"
- Token may have expired
- Generate new token from Meta app dashboard
- Update `.env` and restart

### "Message not delivered"
- Verify phone number format (no + signs)
- Check WhatsApp account is in good standing
- Verify phone number is validated in WhatsApp Business Account
- Add test numbers in messaging template

## Support

For issues:
1. Check the error logs in server output
2. Verify WhatsApp credentials
3. Test with `GET /api/health` endpoint
4. Check WhatsApp Business Account dashboard for any warnings

## License

ISC
