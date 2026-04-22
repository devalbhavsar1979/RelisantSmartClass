# Communication Module - Technical Architecture

Complete technical overview of the WhatsApp Communication Module.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RELISANT SMARTCLASS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │   FRONTEND (PWA)   │  │   MOBILE BROWSER   │                │
│  │  React + Vite      │◄─►│  http://localhost: │                │
│  │                    │  │        5173        │                │
│  │ Communication.jsx  │  └────────────────────┘                │
│  └─────────┬──────────┘                                         │
│            │                                                    │
│            │ HTTP/REST                                          │
│            │ /api/send-whatsapp                                 │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────────────┐                                    │
│  │   BACKEND (API)         │                                    │
│  │   Node.js + Express     │  http://localhost:5000             │
│  │                         │                                    │
│  │  ┌───────────────────┐  │                                    │
│  │  │ /api/send-whatsapp│  │                                    │
│  │  │ /api/health       │  │                                    │
│  │  │ /api/webhook      │  │                                    │
│  │  └───────┬───────────┘  │                                    │
│  └──────────┼──────────────┘                                    │
│             │                                                   │
│             │ HTTPS                                             │
│             │ Bearer Token Auth                                 │
│             │                                                   │
│             ▼                                                   │
│  ┌─────────────────────────────────────────┐                    │
│  │    META WHATSAPP BUSINESS API           │                    │
│  │  graph.facebook.com/v18.0/{PHONE_ID}   │                    │
│  │  /messages                              │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│  ┌────────────────────┐  ┌─────────────────┐                   │
│  │ SUPABASE DATABASE  │  │  WHATSAPP USERS │                   │
│  │                    │  │                 │                   │
│  │ batch ◄───────────►│  │ 🧑 Parent 1     │                   │
│  │ student            │  │ 🧑 Parent 2     │                   │
│  │ enrollment         │  │ 🧑 Parent 3     │                   │
│  │ communication_logs │  │ 🧑 ...          │                   │
│  └────────────────────┘  └─────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

### Send Message Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER INTERACTION                                     │
│    ├─ Fill form (recipients, message type, content)   │
│    ├─ Validate inputs                                  │
│    └─ Click "Send WhatsApp Message"                    │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 2. DATA PREPARATION (Frontend)                          │
│    ├─ Get recipients:                                  │
│    │  ├─ If "All Parents" → fetch all students        │
│    │  ├─ If "Specific Batch" → fetch batch students   │
│    │  └─ If "Individual" → fetch one student          │
│    ├─ Filter by parent_contact (not empty)            │
│    └─ Result: [student1, student2, ...]               │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 3. LOOP THROUGH RECIPIENTS                              │
│    For each student:                                    │
│    ├─ generateMessage(template, student)               │
│    │  └─ Replace:                                       │
│    │     ├─ {student_name} → "John"                    │
│    │     ├─ {amount} → "5000"                          │
│    │     ├─ {date} → "15-01-2024"                      │
│    │     └─ {batch_name} → "Class 10-A"               │
│    │                                                   │
│    └─ Result: personalized message                     │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 4. CALL BACKEND API                                     │
│    POST /api/send-whatsapp                              │
│    {                                                    │
│      "phone": "919876543210",                          │
│      "message": "Personalized message",                │
│      "studentId": 1,                                   │
│      "messageType": "announcement",                    │
│      "timestamp": "2024-01-15T10:30:00Z"              │
│    }                                                   │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 5. BACKEND PROCESSING                                   │
│    ├─ Validate phone number format                     │
│    ├─ Validate message content                         │
│    └─ Prepare WhatsApp API payload                     │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 6. CALL WHATSAPP API                                    │
│    POST https://graph.facebook.com/v18.0/              │
│        {PHONE_NUMBER_ID}/messages                       │
│    Headers:                                             │
│      Authorization: Bearer {WHATSAPP_TOKEN}           │
│      Content-Type: application/json                    │
│    Body:                                               │
│    {                                                    │
│      "messaging_product": "whatsapp",                  │
│      "to": "919876543210",                            │
│      "type": "text",                                  │
│      "text": {"body": "message"}                       │
│    }                                                   │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 7. WHATSAPP API RESPONSE                                │
│    Success: {"messages": [{"id": "wamid.xxx"}]}       │
│    Error: {"error": {"message": "..."}}                │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 8. HANDLE RESPONSE (Backend)                            │
│    ├─ Extract message ID                               │
│    ├─ Log to communication_logs table (optional)       │
│    └─ Return {success: true/false, ...}               │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 9. UPDATE FRONTEND UI                                   │
│    ├─ Update progress: "4 of 50... 8%"                │
│    ├─ Wait 300ms (rate limiting)                      │
│    └─ Continue to next recipient                      │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 10. SHOW RESULTS                                        │
│     ├─ Success: "✓ Sent 50 of 50 messages"            │
│     ├─ Or: "✓ Sent 48 of 50, Failed: [...]"           │
│     └─ Clear form for next send                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Component Architecture

### Communication.jsx Structure

```javascript
Communication (Main Component)
├─ State Management
│  ├─ formData (input values)
│  ├─ batches (dropdown list)
│  ├─ students (recipient list)
│  ├─ isSending (sending status)
│  ├─ sendProgress (X of Y)
│  ├─ successMessage (feedback)
│  ├─ errorMessage (feedback)
│  └─ errors (validation errors)
│
├─ Effects
│  ├─ useEffect(fetchBatches, []) - On mount
│  ├─ useEffect(fetchAllStudents, []) - On mount
│  ├─ useEffect(fillMessageTemplate, [messageType]) - On type change
│  └─ useEffect(filterStudents, [sendTo, batchId]) - On filter change
│
├─ Event Handlers
│  ├─ handleInputChange (form inputs)
│  ├─ handleSendMessages (main logic)
│  ├─ validateForm (form validation)
│  ├─ generateMessage (variable replacement)
│  └─ getRecipientStudents (filter recipients)
│
├─ Supabase Queries
│  ├─ fetchBatches()
│  └─ fetchAllStudents()
│
├─ API Calls
│  └─ fetch('/api/send-whatsapp')
│
├─ Logging
│  └─ logCommunication() [optional]
│
└─ UI Elements
   ├─ Header + Back Button
   ├─ Tab Navigation (Compose/Templates/History)
   ├─ Alert Messages (success/error)
   ├─ Progress Indicator
   ├─ Form with:
   │  ├─ Send To Dropdown
   │  ├─ Conditional: Batch/Student Dropdowns
   │  ├─ Message Type Dropdown
   │  ├─ Subject Input
   │  ├─ Message Textarea
   │  ├─ Variables Hint
   │  ├─ Info Box
   │  └─ Send Button
   └─ BottomNav
```

### Backend Server Structure

```javascript
server.js (Express Server)
├─ Configuration
│  ├─ Load environment variables (dotenv)
│  ├─ Validate credentials
│  └─ Set port and API URL
│
├─ Middleware
│  ├─ express.json()
│  ├─ CORS headers
│  └─ Express.urlencoded()
│
├─ Endpoints
│  ├─ POST /api/send-whatsapp
│  │  ├─ Validate request body
│  │  ├─ Validate phone format
│  │  ├─ Call WhatsApp API
│  │  ├─ Handle response
│  │  ├─ Log communication
│  │  └─ Return result
│  │
│  ├─ GET /api/health
│  │  └─ Return server status
│  │
│  ├─ POST /api/webhook
│  │  ├─ Receive incoming messages
│  │  └─ Update delivery status
│  │
│  └─ GET /api/webhook
│     └─ Verify webhook token
│
├─ Helper Functions
│  └─ logCommunication(data) [optional]
│
└─ Error Handling
   ├─ Request validation
   ├─ WhatsApp API errors
   ├─ Network errors
   └─ Generic error handler
```

---

## 🔄 State Management Flow

### React State Lifecycle

```
Initial State
    ↓
User fills form
    ├─ handleInputChange → Update formData
    └─ Show validation errors if invalid
    ↓
User clicks "Send"
    ↓
validateForm()
    ├─ Check all required fields
    ├─ Show errors if invalid
    └─ Return early if errors
    ↓
getRecipientStudents()
    ├─ Filter based on sendTo selection
    └─ Return filtered list
    ↓
setIsSending(true)
setSendProgress({current: 0, total: X})
    ↓
Loop through each recipient
    ├─ generateMessage(template, student)
    ├─ fetch(/api/send-whatsapp)
    ├─ Handle success/error
    ├─ setSendProgress(current + 1)
    └─ Wait 300ms
    ↓
After loop completes
    ├─ setIsSending(false)
    ├─ setSendProgress(null)
    ├─ setSuccessMessage(results)
    └─ Clear form
    ↓
Form ready for next send
```

---

## 🌐 API Endpoints Reference

### POST /api/send-whatsapp

**Purpose:** Send WhatsApp message via backend

**Request:**
```json
{
  "phone": "919876543210",
  "message": "Your message here",
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
  "code": "INVALID_PHONE",
  "details": {}
}
```

**Status Codes:**
- 200 - Message sent (or queued)
- 400 - Invalid request (bad phone/message)
- 401 - Unauthorized (invalid token)
- 403 - Forbidden (no permission)
- 429 - Rate limited (too many requests)
- 500 - Server error

---

### GET /api/health

**Purpose:** Check if backend is running

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45Z",
  "service": "WhatsApp Communication API"
}
```

---

## 🗄️ Database Schema

### communication_logs Table

```sql
CREATE TABLE communication_logs (
  id BIGSERIAL PRIMARY KEY,                        -- Auto-increment ID
  student_id INT NOT NULL,                         -- FK to student
  phone VARCHAR(20) NOT NULL,                      -- Recipient phone
  message TEXT NOT NULL,                           -- Full message sent
  message_type VARCHAR(50),                        -- announcement/fees/etc
  subject VARCHAR(255),                            -- Message subject
  status VARCHAR(50) DEFAULT 'pending',            -- pending/sent/delivered/failed
  message_id VARCHAR(255),                         -- WhatsApp message ID
  error_message TEXT,                              -- Error if failed
  sent_at TIMESTAMP DEFAULT NOW(),                 -- When sent
  delivered_at TIMESTAMP,                          -- When delivered
  created_at TIMESTAMP DEFAULT NOW(),              -- Record creation
  updated_at TIMESTAMP DEFAULT NOW(),              -- Last update
  FOREIGN KEY (student_id) REFERENCES student     -- Link to student
);

-- Indexes for performance
CREATE INDEX idx_communication_logs_student_id ON communication_logs(student_id);
CREATE INDEX idx_communication_logs_status ON communication_logs(status);
CREATE INDEX idx_communication_logs_sent_at ON communication_logs(sent_at DESC);
```

### Related Tables Used

**student table** (existing)
```
student_id (PK)
name
parent_name
parent_contact          ← Used for sending
batch_id
...
```

**batch table** (existing)
```
batch_id (PK)
batch_name
status = 'Active'
...
```

**enrollment table** (existing)
```
student_id (FK)
batch_id (FK)
...
```

---

## 🔐 Security Architecture

### Frontend Security
- Form validation (prevents injection)
- No secrets in code
- HTTPS in production
- CORS configured

### Backend Security
- Environment variables (.env)
- No secrets in logs
- Error messages don't leak details
- Request validation
- Rate limiting (implicit via 300ms delay)

### WhatsApp API Security
- Bearer token authentication
- HTTPS only
- Phone number validation
- Message validation

### Database Security (Supabase)
- Row-Level Security (RLS) optional
- Foreign key constraints
- Audit trail via created_at/updated_at
- Encryption at rest

---

## ⚡ Performance Considerations

### Optimization Strategies

**Frontend:**
- Lazy load dropdown data
- Debounce form inputs
- Virtual scrolling for large lists (future)
- CSS animations (GPU accelerated)

**Backend:**
- Connection pooling for WhatsApp API
- Rate limiting (prevent spam)
- Async/await for non-blocking I/O
- Error logging without blocking

**Database:**
- Indexes on frequently queried fields
- Pagination for large datasets
- Connection pooling
- Proper data types (BIGINT for IDs)

### Rate Limiting Strategy

```
Current: 300ms delay between messages
Result: ~3.33 messages per second
Safe: Complies with WhatsApp rate limits

If needed to speed up:
- Reduce to 100ms (10/sec) - careful testing needed
- Use message queue (Bull/RabbitMQ)
- Batch messages (1 per person per day)
```

---

## 🚀 Deployment Architecture

### Development
```
Frontend:   localhost:5173 (Vite dev server)
Backend:    localhost:5000 (Node dev server)
Database:   Your Supabase account
WhatsApp:   Test credentials
```

### Production
```
Frontend:   Vercel / Netlify / GitHub Pages
Backend:    Vercel / Heroku / DigitalOcean / AWS
Database:   Supabase (same as dev)
WhatsApp:   Production credentials
```

### Environment Variables

**Frontend (.env)**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
```

**Backend (.env)**
```
NODE_ENV=development
PORT=5000
PHONE_NUMBER_ID=123456789012345
WHATSAPP_TOKEN=EAAe...
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
```

---

## 🔄 Integration Points

### With Existing Modules

**Batches Module:**
- Communication fetches batch data
- Filters students by batch

**Students Module:**
- Communication fetches student data
- Uses parent_contact field

**Attendance Module:**
- Future: Could send attendance notifications

**Fees Module:**
- Future: Could send payment reminders

**Dashboard:**
- Future: Could show communication stats

### API Integration Points

**Your Backend API:**
```
Frontend
  ↓
Your Backend (optional proxy)
  ↓
Our /api/send-whatsapp endpoint
  ↓
WhatsApp API
```

Or direct connection (currently used):
```
Frontend
  ↓
Our /api/send-whatsapp endpoint
  ↓
WhatsApp API
```

---

## 📊 Error Handling Flow

```
User sends message
    ↓
Try/Catch block
    ├─ Request validation fails
    │  └─ Return 400 (invalid input)
    │
    ├─ WhatsApp API fails
    │  ├─ Extract error details
    │  └─ Return status code + error
    │
    └─ Network error
       └─ Return 500 (server error)
    ↓
Frontend receives response
    ├─ If success
    │  └─ Show success message
    │     ├─ Count sent
    │     └─ List failed (if any)
    │
    └─ If error
       └─ Show error message with reason
    ↓
Log to database (if enabled)
    └─ Include success/failure status
```

---

## 📈 Monitoring & Logging

### Frontend Logging
- Browser console (development)
- Error boundaries (React)
- Network request logging
- Form validation errors

### Backend Logging
```javascript
console.log('📱 Sending WhatsApp message to X...')
console.log('✅ Message sent successfully')
console.error('❌ WhatsApp API Error')
```

### Database Logging (Optional)
- Automatic timestamp on insert
- Status tracking
- Message ID for troubleshooting
- Error message storage

### Monitoring Dashboard
Future feature to show:
- Messages sent (count)
- Delivery rate %
- Failed messages
- API response time
- Rate limit status

---

## 🔗 Dependencies Map

```
Frontend
├─ react (hooks)
├─ react-router-dom (navigation)
├─ react-icons (UI icons)
├─ @supabase/supabase-js (database)
└─ CSS (styling)

Backend
├─ express (server)
├─ axios (HTTP client)
├─ dotenv (env vars)
└─ cors (cross-origin)

External Services
├─ Supabase (database)
├─ Meta WhatsApp API (messaging)
└─ Browser APIs (fetch)
```

---

## 🎯 Key Design Principles

1. **Separation of Concerns**
   - Communication.jsx handles UI
   - server.js handles WhatsApp API
   - Supabase handles data

2. **Single Responsibility**
   - Each function does one thing
   - Clear naming conventions
   - Proper error handling

3. **Maintainability**
   - Well-commented code
   - Consistent naming
   - DRY principles

4. **Performance**
   - Efficient queries
   - Rate limiting
   - Progress tracking

5. **Security**
   - Environment variables
   - Input validation
   - Error messages safe

---

This architecture scales to thousands of messages while maintaining performance and reliability.
