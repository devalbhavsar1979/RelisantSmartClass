# Fees Collection Module - Quick Reference

## 🚀 QUICK START

### 1. Database Setup
```sql
-- Run in Supabase SQL Editor
-- File: FEES_SCHEMA.sql
-- Creates fees table with indexes
```

### 2. Components Added
- ✅ `src/pages/Fees.jsx` - Main fee collection page
- ✅ `src/services/supabaseFees.js` - All database queries
- ✅ `src/styles/pages/Fees.css` - Complete styling
- ✅ Route added to `src/App.jsx`
- ✅ Navigation added to `src/components/BottomNav.jsx`

### 3. Start Using
```bash
npm run dev
# Navigate to http://localhost:5173/fees
# Click 💰 in bottom navigation
```

---

## 📊 DATABASE SCHEMA

### Fees Table
```sql
CREATE TABLE fees (
  fee_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES student(student_id),
  batch_id BIGINT REFERENCES batch(batch_id),
  month VARCHAR(7),              -- '2026-03'
  amount NUMERIC(10,2),          -- Total monthly fee
  paid_amount NUMERIC(10,2),     -- Amount paid
  status VARCHAR(20),            -- 'Paid','Partial','Pending'
  payment_date TIMESTAMP,        -- Last payment date
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, batch_id, month)
);
```

---

## 🎨 UI COMPONENTS

### Tabs
| Tab | Shows | Badge |
|-----|-------|-------|
| Collect Fee | Unpaid students | Count of pending |
| Pending | Partial + Pending | Count |
| History | All transactions | None |

### Cards
- **Green Card**: This Month Collection (₹X)
- **Red Card**: Pending Amount (₹X)

### Status Badge
- 🟢 **Paid**: Green, shows "✓ Paid"
- 🟡 **Partial**: Yellow, shows "₹X due"
- 🔴 **Pending**: Red, shows "₹X due"

---

## 🔧 API FUNCTIONS

### Fetch Data

```javascript
// Get students with fee info
const students = await fetchStudentsWithFees()
// Returns: [{student_name, due_amount, status, ...}]

// Get summary
const summary = await getFeeSummary()
// Returns: {thisMonthCollection, pendingAmount}

// Get pending fees
const pending = await getPendingFees()
// Returns: [{student, batch, amount, paid_amount, ...}]

// Get history
const history = await getAllPaymentHistory()
// Returns: [{month, student, amount, status, ...}]

// Get student history
const studentHist = await getFeeHistory(studentId)
// Returns: [{month, amount, status, ...}]
```

### Collect Fee

```javascript
const result = await collectFee({
  student_id: 123,
  batch_id: 45,
  amount_to_collect: 1500,
  total_fee_amount: 2500
})

// Returns:
// {
//   success: true,
//   message: "Fee collected successfully",
//   status: "Partial",
//   paid_amount: 1500,
//   due_amount: 1000
// }
```

---

## 💡 KEY LOGIC

### Status Calculation
```javascript
if (paid_amount == amount) {
  status = "Paid"
} else if (paid_amount > 0) {
  status = "Partial"
} else {
  status = "Pending"
}
```

### Fee Record Creation Logic
```javascript
// Check if record exists for (student_id, batch_id, current_month)
if (record EXISTS) {
  // UPDATE: add to paid_amount, recalculate status
  paid_amount += collected_amount
} else {
  // INSERT: create new record
  INSERT with paid_amount = collected_amount
}
```

### Summary Calculations
```javascript
// This Month Collection
SUM(paid_amount) 
  WHERE month = current_month

// Pending Amount
SUM(amount - paid_amount) 
  WHERE month = current_month AND status != 'Paid'
```

---

## 🎯 USAGE EXAMPLE

```javascript
import { collectFee, fetchStudentsWithFees, getFeeSummary } from '../services/supabaseFees'

// 1. Fetch students
const students = await fetchStudentsWithFees()
// students[0] = {
//   student_name: "John",
//   batch_name: "Maths A",
//   fee_amount: 2500,
//   paid_amount: 1000,
//   due_amount: 1500,
//   status: "Partial"
// }

// 2. Get summary
const summary = await getFeeSummary()
// summary = {
//   thisMonthCollection: 85000,
//   pendingAmount: 34500
// }

// 3. Collect fee
const result = await collectFee({
  student_id: students[0].student_id,
  batch_id: students[0].batch_id,
  amount_to_collect: 500,
  total_fee_amount: students[0].fee_amount
})
// result.success = true
// result.status = "Partial" (1500 paid)
```

---

## 📱 MOBILE UI FLOW

```
┌─────────────────────┐
│   Header            │
├─────────────────────┤
│ ┌───────────────┐   │
│ │ 💚 Collection │   │
│ │    ₹85,000    │   │
│ └───────────────┘   │
│ ┌───────────────┐   │
│ │ ❤️ Pending    │   │
│ │    ₹34,500    │   │
│ └───────────────┘   │
├─────────────────────┤
│ Collect | Pending | │
│  Fee    | (3)   │   │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ Student Name    │ │
│ │ [Batch • Grade] │ │
│ │ ₹2500 | ₹500 due│ │
│ │ ‟Collect"       │ │
│ └─────────────────┘ │
├─────────────────────┤
│   Bottom Nav (💰)   │
└─────────────────────┘
```

---

## ⚙️ FORM VALIDATION

### Collect Fee Modal
```javascript
Rules:
✓ Amount required
✓ Amount > 0
✓ Amount <= due_amount
✓ Amount must be numeric
✓ Cannot exceed total fee

Error Messages:
"Please enter a valid amount"
"Amount cannot exceed due amount (₹X)"
"Total payment would exceed fee amount"
```

---

## 🎨 CSS CLASSES

```css
/* Main Container */
.fees-container
.fees-content

/* Summary Cards */
.fees-summary-card.collected   /* Green */
.fees-summary-card.pending     /* Red */

/* Tabs */
.fees-tab-button
.fees-tab-button.active

/* Student List */
.fees-student-card
.fees-due-badge
.fees-collect-button

/* Modal */
.fees-modal-overlay
.fees-modal
.fees-form-input
.fees-btn-primary

/* Notifications */
.fees-toast.success
.fees-toast.error
```

---

## 🔍 DEBUGGING

### Check Data Loading
```javascript
// In browser console:
localStorage.isLoggedIn  // Should be "true"
// Network tab: Check supabase requests
// Console: Look for error messages
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| No students showing | Check enrollment table has data |
| Fees not updating | Verify month format 'YYYY-MM' |
| Modal won't close | Check collectFee() completing |
| Summary wrong | Verify fees table has current month data |

---

## 📞 KEY FILES

| File | Purpose |
|------|---------|
| `Fees.jsx` | Main component, UI & state |
| `supabaseFees.js` | All database operations |
| `Fees.css` | All styling |
| `FEES_SCHEMA.sql` | Database table creation |
| `BottomNav.jsx` | Navigation link |
| `App.jsx` | Route definition |

---

## 🎓 LEARNING PATH

1. **Understand Schema** - Read FEES_SCHEMA.sql
2. **Review API** - Check supabaseFees.js functions
3. **Study Component** - Read Fees.jsx structure
4. **Test UI** - Try collecting a fee
5. **Customize** - Modify as needed

---

## 🚀 DEPLOYMENT STEPS

```bash
# 1. Apply SQL schema to production DB
# 2. Ensure env vars configured
# 3. Build for production
npm run build

# 4. Deploy to Vercel
vercel --prod

# 5. Test on production
# Visit /fees and verify functionality
```

---

## 💾 BACKUP & RECOVERY

### Backup Fees Data
```sql
-- Export to CSV
SELECT * FROM fees 
  ORDER BY payment_date DESC;
```

### Recovery
```sql
-- Restore from backup
-- Contact Supabase support for point-in-time recovery
```

---

**Quick Links:**
- 📖 Full Guide: [FEES_IMPLEMENTATION_GUIDE.md](FEES_IMPLEMENTATION_GUIDE.md)
- 🗄️ Schema: [FEES_SCHEMA.sql](FEES_SCHEMA.sql)
- 💻 Component: [src/pages/Fees.jsx](src/pages/Fees.jsx)
- 🔧 Services: [src/services/supabaseFees.js](src/services/supabaseFees.js)

**Status:** ✅ Production Ready
**Last Updated:** March 2026
