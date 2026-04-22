# Communication Module Implementation Guide

Complete guide for setting up and using the WhatsApp Communication Module in Relisant SmartClass.

## Table of Contents

1. [Frontend Setup](#frontend-setup)
2. [Backend Setup](#backend-setup)
3. [WhatsApp Business Account Setup](#whatsapp-business-account-setup)
4. [Integration](#integration)
5. [Testing](#testing)
6. [Features](#features)
7. [Troubleshooting](#troubleshooting)

---

## Frontend Setup

### Files Created/Modified

**New Files:**
- `src/pages/Communication.jsx` - Main Communication page component
- `src/styles/pages/Communication.css` - Styling
- `COMMUNICATION_SCHEMA.sql` - Database schema

**Modified Files:**
- `src/App.jsx` - Added route for Communication page
- `src/components/BottomNav.jsx` - Added Communication navigation item

### Features Implemented

#### 1. **Compose Tab (Active)**
- Send WhatsApp messages to parents
- Three send options:
  - All Parents (bulk send to all active students' parents)
  - Specific Batch (send to parents in a batch)
  - Individual Parent (send to specific student's parent)

#### 2. **Message Types**
Four pre-built message templates:
- **Announcement:** "Dear Parent, {message}"
- **Fees:** "Dear Parent, ₹{amount} fee is pending for {student_name}. Please arrange payment at the earliest."
- **Homework:** "Homework for {student_name}: {message}"
- **Reminder:** "Reminder: {message}"

#### 3. **Variable Substitution**
Automatic replacement in messages:
- `{student_name}` → Student's name
- `{amount}` → Fee amount
- `{date}` → Current date
- `{batch_name}` → Batch name

#### 4. **Form Validation**
- Subject required
- Message required
- Batch required (if "Specific Batch" selected)
- Student required (if "Individual Parent" selected)

#### 5. **Progress Tracking**
- Real-time progress: "Sending 3 of 50..."
- Progress bar with percentage
- Success message with count
- Failed messages list with reasons

#### 6. **Error Handling**
- Invalid phone numbers detected
- Network errors handled
- Per-message error tracking
- Retry capability for failed messages

#### 7. **Templates & History Tabs**
- Placeholder tabs for future expansion
- Can add pre-built templates management
- Can add message history search/filter

### How It Works

```
User fills form
    ↓
Select recipients (All/Batch/Individual)
    ↓
Choose message type (Announcement/Fees/Homework/Reminder)
    ↓
Enter subject and message (with variables)
    ↓
Click "Send WhatsApp Message"
    ↓
Validate form inputs
    ↓
Fetch recipient list from Supabase
    ↓
For each recipient:
  - Generate personalized message (replace variables)
  - Call backend API (/api/send-whatsapp)
  - Log response
  - Wait 300ms (rate limiting)
    ↓
Show results (success/failures)
    ↓
Optional: Log to communication_logs table
```

---

## Backend Setup

### Prerequisites
- Node.js 14+
- npm or yarn

### Installation

1. **Navigate to backend folder:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

This installs:
- `express` - Web server
- `axios` - HTTP client for WhatsApp API
- `dotenv` - Environment variable management
- `cors` - Cross-origin resource sharing
- `nodemon` - Auto-restart during development

3. **Create .env file:**
```bash
cp .env.example .env
```

### Files Created

- `server.js` - Main Express server with WhatsApp API integration
- `package.json` - Dependencies and scripts
- `.env.example` - Template for environment variables
- `README.md` - Backend documentation

### How It Works

```
Frontend sends POST /api/send-whatsapp
    ↓
Backend receives request
    ↓
Validate phone and message
    ↓
Prepare WhatsApp API payload
    ↓
Call Meta WhatsApp Graph API
    ↓
Handle response/errors
    ↓
Return success/error to frontend
    ↓
Optional: Log to database
```

---

## WhatsApp Business Account Setup

### Step 1: Create Meta Business Account

1. Go to [https://www.whatsapp.com/business/downloads/](https://www.whatsapp.com/business/downloads/)
2. Click "Get Started"
3. Sign in with Facebook or create new account
4. Fill in business details
5. Choose your industry

### Step 2: Create WhatsApp Business Account

1. Go to [https://www.facebook.com/business/](https://www.facebook.com/business/)
2. Create a Meta Business Account (if don't have one)
3. Add WhatsApp Business Account
4. Verify your phone number:
   - You'll get a verification code on WhatsApp
   - Enter it to verify

### Step 3: Create Meta Developer App

1. Go to [https://developers.facebook.com](https://developers.facebook.com)
2. Click "My Apps" → "Create App"
3. Choose app type: **Business**
4. Fill in:
   - App Name: "Relisant SmartClass Communication"
   - App Purpose: "WhatsApp Messaging"
5. Click "Create App"

### Step 4: Add WhatsApp Product

1. In app dashboard, click "Add Product"
2. Search for "WhatsApp"
3. Click "Set Up"
4. Choose "Standalone" (or connected to Business Account)

### Step 5: Get API Credentials

1. Go to **WhatsApp > API Setup**
2. You'll see:
   - **Phone Number ID** (e.g., "123456789012345")
   - Your business phone number

3. Generate **Access Token**:
   - Click "Generate Token"
   - Select permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
   - Copy the token (starts with "EAA...")
   - **⚠️ Save it - you won't see it again!**

### Step 6: Add Test Numbers (Optional)

To test without using real numbers:

1. Go to **WhatsApp > Getting Started**
2. Scroll to "Phone number manager"
3. Add your phone number as a test recipient
4. You'll get a verification code on WhatsApp
5. Verify to activate

### Step 7: Update Environment Variables

In `backend/.env`:

```env
PHONE_NUMBER_ID=123456789012345
WHATSAPP_TOKEN=EAAexxxxxxxxxxxxxxxx
```

### Step 8: Set Up Webhook (Optional)

For receiving incoming messages:

1. Go to **App Settings > Basic**
2. Copy **App ID** and **App Secret**
3. Go to **WhatsApp > Configuration**
4. Set webhook URL: `https://your-domain.com/api/webhook`
5. Verify token: Any custom string (store in `WEBHOOK_VERIFY_TOKEN`)
6. Subscribe to events:
   - `messages`
   - `statuses` (delivery updates)

---

## Integration

### Start Backend Server

**Development (with auto-reload):**
```bash
cd backend
npm run dev
```

**Production:**
```bash
npm start
```

Server runs on `http://localhost:5000` (or `PORT` from .env)

### Configure Frontend API URL

In `Communication.jsx`, the API call:

```javascript
const response = await fetch('/api/send-whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone, message, studentId, messageType })
})
```

The `/api/send-whatsapp` path is relative, so it uses the same domain.

**For development:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Frontend must proxy API calls

In `vite.config.js`, add:

```javascript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
}
```

### Start Frontend

```bash
npm run dev
```

Navigate to: `http://localhost:5173`
→ Login → Dashboard → Click "Communication" → Use Compose tab

---

## Testing

### 1. Manual Testing with Postman/cURL

**Request:**
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

**Expected Response:**
```json
{
  "success": true,
  "messageId": "wamid.HBEUzz1UU1V5qf21vf3nYTZGLfx7bg==",
  "status": "sent",
  "phone": "919876543210",
  "timestamp": "2024-01-15T10:30:45Z"
}
```

### 2. Frontend UI Testing

1. **Navigate to Communication page**
   - Click "Communication" 💬 in bottom nav
   - Should show "Compose WhatsApp Message" form

2. **Test "All Parents" send:**
   - Keep "Send To" as "All Parents"
   - Select message type (e.g., "Announcement")
   - Enter subject and message
   - Click "Send WhatsApp Message"
   - Should show progress indicator
   - Should show success message

3. **Test "Specific Batch" send:**
   - Change "Send To" to "Specific Batch"
   - Batch dropdown should appear
   - Select a batch
   - Fill message
   - Send
   - Should only send to parents in that batch

4. **Test "Individual Parent" send:**
   - Change "Send To" to "Individual Parent"
   - Student dropdown should appear
   - Select a student
   - Fill message
   - Send
   - Should only send to that parent

3. **Test Variable Substitution:**
   - Select "Fees" message type
   - Template pre-fills with "{amount}" and "{student_name}"
   - Change message to include variables
   - Send
   - Check that variables are replaced in sent messages

4. **Test Error Handling:**
   - Try sending with empty subject (should show error)
   - Try sending with empty message (should show error)
   - Batch/Student validation errors

### 3. End-to-End Test

1. Add a test student with parent contact: `919876543210`
2. Use Communication page to send message
3. Check WhatsApp on that phone number - you should receive the message

---

## Features

### Completed Features ✅

- [x] Compose tab with form
- [x] Send To dropdown (All Parents, Specific Batch, Individual Parent)
- [x] Conditional dropdowns (batch & student)
- [x] Message Type selection with templates
- [x] Subject and Message inputs
- [x] Variable substitution ({student_name}, {amount}, etc.)
- [x] Bulk message sending
- [x] Progress indicator
- [x] Error handling & validation
- [x] Success message
- [x] Failed messages list with retry option
- [x] Rate limiting (300ms delay between messages)
- [x] Supabase integration (fetch batches/students)
- [x] Backend API integration
- [x] WhatsApp Business API integration

### Future Features 🚀

- [ ] Templates tab - Create & manage reusable templates
- [ ] History tab - View sent messages, search, filter, retry
- [ ] Message scheduling - Send at specific time
- [ ] Recipient groups - Define custom groups
- [ ] Rich media - Send images/documents
- [ ] Two-way messaging - Receive messages from parents
- [ ] Message templates library
- [ ] Delivery status tracking in UI
- [ ] Analytics dashboard
- [ ] Bulk import of templates
- [ ] Message reminders/sequences

---

## Troubleshooting

### Frontend Issues

**Problem: "Communication" link doesn't show in bottom nav**
- Check if `BottomNav.jsx` has Communication item added
- Clear browser cache
- Restart dev server

**Problem: Message sending fails with "Cannot POST /api/send-whatsapp"**
- Ensure backend server is running (port 5000)
- Check `vite.config.js` has proxy configuration
- Check frontend is trying to call correct URL

**Problem: Form shows but dropdowns are empty**
- Check browser console for errors
- Verify Supabase connection working
- Check that batches/students exist in database
- Try refreshing browser

### Backend Issues

**Problem: "Missing PHONE_NUMBER_ID or WHATSAPP_TOKEN"**
- Create `.env` file from `.env.example`
- Add actual WhatsApp credentials
- Restart server

**Problem: Server won't start - "Port 5000 already in use"**
- Change PORT in `.env`: `PORT=5001`
- Or kill process using port 5000

**Problem: "Cannot find module 'express'"**
- Run `npm install` in backend folder
- Verify `package.json` exists

**Problem: WhatsApp API returns 401 Unauthorized**
- Token may be expired
- Generate new token from Meta app
- Verify token has required permissions

**Problem: WhatsApp API returns 400 Bad Request**
- Phone number format may be wrong
- Should be: 919876543210 (no + or spaces)
- Message may contain unsupported characters

**Problem: Messages not being delivered**
- Check phone number is added in WhatsApp Business Account
- Verify phone number is verified
- Check message content isn't flagged as spam
- Try with different message content

### Supabase Issues

**Problem: Student dropdown empty/batches not loading**
- Check Supabase connection (`supabaseClient.js`)
- Verify `batch` and `student` tables exist
- Check table permissions if RLS is enabled
- Try fetching directly: 
  ```sql
  SELECT * FROM batch LIMIT 5;
  SELECT * FROM student LIMIT 5;
  ```

**Problem: Communication logs not saving**
- Table `communication_logs` may not exist
- Create it using `COMMUNICATION_SCHEMA.sql`
- Or disable logging in backend

### WhatsApp Business Issues

**Problem: "Cannot send to this number"**
- Number must be verified in Business Account
- Add as test number first
- Or ensure it's associated with WhatsApp Business Account

**Problem: "Your account has been limited"**
- Sending too many messages (rate limiting)
- Account may have violations
- Wait 24 hours
- Check Message Quality rating in Business Account

**Problem: Test messages not received**
- Add phone number as test recipient in Business Account
- Verify phone number via WhatsApp
- Wait a few minutes for system to sync

### Performance Issues

**Problem: Sending 1000+ messages is very slow**
- Increase delay between messages (currently 300ms)
- Or decrease it if WhatsApp allows
- Run multiple backend instances
- Use message queue (RabbitMQ/Bull)

**Problem: Frontend becomes unresponsive while sending**
- Progress indicator is in main thread
- Consider using Web Worker for sending
- Or implement queue system

---

## Quick Diagnostics

### Check Backend is Running

```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45Z",
  "service": "WhatsApp Communication API"
}
```

### Check WhatsApp API Credentials

Use this test request:
```bash
curl -X POST http://localhost:5000/api/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "919876543210",
    "message": "Test message"
  }'
```

If credentials wrong, you'll get error like:
```json
{
  "success": false,
  "error": "Invalid access token",
  "code": "INVALID_TOKEN"
}
```

### Check Database Connection

In browser console (on Communication page):
```javascript
// This will trigger Supabase fetch
// Open DevTools > Network tab
// Look for requests to Supabase
```

### Check Phone Number Format

Phone number should:
- ✅ Be all digits
- ✅ Be 10-15 characters
- ✅ Start with country code (91 for India)
- ❌ NOT have + symbol
- ❌ NOT have hyphens or spaces
- ❌ NOT have parentheses

---

## Support

For issues not covered here:

1. Check backend server logs for errors
2. Check browser console (DevTools F12)
3. Verify WhatsApp Business Account status
4. Check network tab in DevTools for API responses
5. Review [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)

---

## Deployment

### Deploy Backend to Vercel

1. Push backend folder to GitHub
2. Go to Vercel.com → Import Project
3. Add Environment Variables:
   - `PHONE_NUMBER_ID`
   - `WHATSAPP_TOKEN`
4. Deploy

### Deploy Frontend to Vercel

Same process, ensure it proxies to backend API

### Docker Setup

Create `backend/Dockerfile`:
```dockerfile
FROM node:18
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Build & run:
```bash
docker build -t whatsapp-api .
docker run -p 5000:5000 --env-file .env whatsapp-api
```

---

This completes the Communication Module implementation! 🎉
