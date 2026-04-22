# Communication Module - Quick Reference

Fast setup guide for WhatsApp Communication Module.

##🚀 Quick Start (5 Minutes)

### 1. Frontend Already Integrated ✅
- `Communication.jsx` created
- Routes added to `App.jsx`
- Navigation added to `BottomNav`

### 2. Start Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with WhatsApp credentials
npm run dev
```

### 3. Start Frontend
```bash
npm run dev
# http://localhost:5173
```

### 4. Use Communication Module
- Dashboard → Click "Communication" 💬
- Fill form
- Click "Send WhatsApp Message"
- Monitor progress

---

## 📋 Form Fields

| Field | Type | Required | Options/Notes |
|-------|------|----------|---------------|
| Send To | Dropdown | Yes | All Parents, Specific Batch, Individual Parent |
| Batch | Dropdown | If "Specific Batch" | Auto-loaded from Supabase |
| Student | Dropdown | If "Individual Parent" | Auto-loaded from Supabase |
| Message Type | Dropdown | Yes | Announcement, Reminder, Homework, Fees |
| Subject | Text | Yes | Any text |
| Message | Textarea | Yes | Can include variables |

---

## 🔤 Available Variables

Insert these in message to auto-replace:

```
{student_name}    → John Doe
{amount}          → 5000
{date}            → 15-01-2024
{batch_name}      → Class 10-A
```

Example message:
```
Dear Parent, ₹{amount} fee is pending for {student_name}.
Please pay within {date}.
```

Becomes:
```
Dear Parent, ₹5000 fee is pending for John Doe.
Please pay within 15-01-2024.
```

---

## 📱 Message Types & Templates

| Type | Template | Variables |
|------|----------|-----------|
| Announcement | Dear Parent, {message} | {message} |
| Fees | Dear Parent, ₹{amount} fee is pending for {student_name}. Please arrange payment at the earliest. | {amount}, {student_name}, {batch_name} |
| Homework | Homework for {student_name}: {message} | {student_name}, {message} |
| Reminder | Reminder: {message} | {message}, {date} |

---

## 🔑 WhatsApp Setup (3 Steps)

1. **Get credentials:**
   - Go to [https://developers.facebook.com](https://developers.facebook.com)
   - Create app → Add WhatsApp product
   - Copy: Phone Number ID, Access Token

2. **Add to .env:**
   ```env
   PHONE_NUMBER_ID=123456789012345
   WHATSAPP_TOKEN=EAAexxxxxxxxxx
   PORT=5000
   ```

3. **Verify phone number:**
   - In WhatsApp Business Account
   - Add your number as test recipient
   - Verify via WhatsApp code

---

## 🔍 Phone Number Format

✅ Correct: `919876543210` (country code + number)
❌ Wrong: `+919876543210` (has +)
❌ Wrong: `+91-9876543210` (has special chars)

Format: `[Country Code][Area][Number]`
Examples:
- India: 919876543210
- USA: 14155552671
- UK: 447911123456

---

## 🛠️ File Structure

```
src/
  pages/
    Communication.jsx         ← Main component
  styles/
    pages/
      Communication.css       ← Styling

backend/
  server.js                   ← Express server
  .env                        ← Credentials
  .env.example                ← Template
  package.json                ← Dependencies

COMMUNICATION_SCHEMA.sql      ← Database schema
COMMUNICATION_IMPLEMENTATION_GUIDE.md
COMMUNICATION_QUICK_REFERENCE.md (this file)
```

---

## 🔌 API Endpoint

**POST `/api/send-whatsapp`**

Request:
```json
{
  "phone": "919876543210",
  "message": "Hello!",
  "studentId": 1,
  "messageType": "announcement"
}
```

Response (Success):
```json
{
  "success": true,
  "messageId": "wamid.xxx",
  "status": "sent"
}
```

Response (Error):
```json
{
  "success": false,
  "error": "Invalid phone format"
}
```

---

## ⚙️ Configuration

### Message Rate Limiting
In `Communication.jsx`, line ~280:
```javascript
await new Promise(resolve => setTimeout(resolve, 300)) // ms between messages
```

Change `300` to:
- `100` - Faster (may hit WhatsApp limit)
- `500` - Slower (safer)
- `2500` - Very safe (WhatsApp official rate)

### Backend Port
In `backend/.env`:
```env
PORT=5000
```

Change to any available port

---

## 🧪 Testing

### Test Backend Directly
```bash
curl -X POST http://localhost:5000/api/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "919876543210",
    "message": "Test"
  }'
```

### Test in Frontend
1. Go to Communication page
2. Fill form with your test number
3. Send 1 message
4. Check phone

---

## ✅ Checklist

Before going live:

- [ ] Backend running (`npm run dev` in `/backend`)
- [ ] Frontend running (`npm run dev` in root)
- [ ] `.env` file created with credentials
- [ ] Test number added in WhatsApp Business
- [ ] Test message sent successfully
- [ ] Phone number format correct
- [ ] Message template looks good
- [ ] Batch/Student data loaded in dropdowns
- [ ] Progress indicator works
- [ ] Success message shows

---

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Cannot POST /api/send-whatsapp" | Backend not running. Run `npm run dev` in `/backend` |
| Empty dropdowns | Batches/students not in Supabase. Check database |
| Message not received | Phone number format wrong. Check format above |
| "Invalid Token" | Token expired. Generate new from Meta app |
| "Rate limit exceeded" | Decrease number of messages or increase delay |
| Form validates but won't send | Check browser console for errors. Backend logs too |

---

## 📊 Bulk Sending Example

**Scenario:** Send announcement to all parents

```
1. Form: Send To = "All Parents"
2. Message Type = "Announcement"
3. Subject = "Class Resumes Tomorrow"
4. Message = "Dear Parent, classes will resume tomorrow. Please ensure your ward attends on time."
5. Click "Send WhatsApp Message"

Progress:
→ Sending 1 of 250...
→ Sending 2 of 250...
→ Sending 3 of 250...
...
→ Sending 250 of 250... 100%

Result:
✓ All 250 messages sent successfully!
```

---

## 📈 Future Features

- Templates library (reusable templates)
- Message history (search, filter, view old messages)
- Delivery tracking (see which messages delivered)
- Scheduled messages (send at specific time)
- Message sequences (automated followups)
- Two-way chat (receive replies)
- Analytics dashboard

---

## 📞 Support

### Debug Steps

1. Check backend logs:
   ```
   npm run dev (in /backend)
   Look for error messages
   ```

2. Check browser console:
   - F12 → Console tab
   - Look for red errors

3. Check network tab:
   - F12 → Network tab
   - Filter by "send-whatsapp"
   - Check response status

4. Verify credentials:
   ```bash
   # Test WhatsApp API directly
   curl -X GET "https://graph.facebook.com/v18.0/me" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## 📚 Related Documentation

- [Full Implementation Guide](COMMUNICATION_IMPLEMENTATION_GUIDE.md)
- [Database Schema](COMMUNICATION_SCHEMA.sql)
- [Backend README](backend/README.md)
- [WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp)

---

**Last Updated:** January 2024
**Module Version:** 1.0
**Status:** ✅ Production Ready (Compose Tab)
