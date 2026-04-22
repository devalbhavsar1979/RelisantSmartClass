# Fees Collection Module - Supabase Code Reference

## 📚 TABLE OF CONTENTS

1. [Database Queries](#database-queries)
2. [JavaScript API Functions](#javascript-api-functions)
3. [Direct SQL Examples](#direct-sql-examples)
4. [RLS Policies](#rls-policies)
5. [Performance Tips](#performance-tips)

---

## 🗄️ DATABASE QUERIES

### Query 1: Get Total Collection for Current Month

**Purpose:** Get total amount collected in current month

**SQL:**
```sql
SELECT 
  SUM(paid_amount) AS total_collected,
  COUNT(*) AS total_records
FROM fees
WHERE month = TO_CHAR(NOW(), 'YYYY-MM')
  AND status IN ('Paid', 'Partial');
```

**JavaScript:**
```javascript
const { data, error } = await supabase
  .from('fees')
  .select('paid_amount', { count: 'exact' })
  .eq('month', getCurrentMonth())
  .in('status', ['Paid', 'Partial'])

const total = data?.reduce((sum, f) => sum + (f.paid_amount || 0), 0) || 0
```

---

### Query 2: Get Pending Amount for Current Month

**Purpose:** Calculate total unpaid/partial fees

**SQL:**
```sql
SELECT 
  SUM(amount - paid_amount) AS pending_amount,
  COUNT(*) AS pending_count
FROM fees
WHERE month = TO_CHAR(NOW(), 'YYYY-MM')
  AND status IN ('Pending', 'Partial');
```

**JavaScript:**
```javascript
const { data, error } = await supabase
  .from('fees')
  .select('amount, paid_amount')
  .eq('month', getCurrentMonth())
  .in('status', ['Pending', 'Partial'])

const pending = data?.reduce((sum, f) => sum + (f.amount - f.paid_amount), 0) || 0
```

---

### Query 3: Get Fees for Specific Batch (Current Month)

**Purpose:** List all students in a batch with their fee status

**SQL:**
```sql
SELECT 
  f.fee_id,
  s.student_id,
  s.student_name,
  f.amount,
  f.paid_amount,
  (f.amount - f.paid_amount) AS due_amount,
  f.status,
  f.payment_date
FROM fees f
JOIN student s ON f.student_id = s.student_id
WHERE f.batch_id = $1 
  AND f.month = TO_CHAR(NOW(), 'YYYY-MM')
  AND s.status = 'active'
ORDER BY s.student_name ASC;
```

**JavaScript:**
```javascript
const { data, error } = await supabase
  .from('fees')
  .select(`
    fee_id,
    amount,
    paid_amount,
    status,
    payment_date,
    student:student_id (
      student_id,
      student_name
    )
  `)
  .eq('batch_id', batchId)
  .eq('month', getCurrentMonth())
  .order('student.student_name')
```

---

### Query 4: Get Payment History for Student

**Purpose:** Show all past payments for a student

**SQL:**
```sql
SELECT 
  f.month,
  f.amount,
  f.paid_amount,
  f.status,
  f.payment_date,
  b.batch_name
FROM fees f
JOIN batch b ON f.batch_id = b.batch_id
WHERE f.student_id = $1
ORDER BY f.month DESC
LIMIT 12;
```

**JavaScript:**
```javascript
const { data, error } = await supabase
  .from('fees')
  .select(`
    month,
    amount,
    paid_amount,
    status,
    payment_date,
    batch:batch_id (batch_name)
  `)
  .eq('student_id', studentId)
  .order('month', { ascending: false })
  .limit(12)
```

---

### Query 5: Check if Fee Record Exists

**Purpose:** Verify if fee record exists for student+batch+month

**SQL:**
```sql
SELECT fee_id, paid_amount
FROM fees
WHERE student_id = $1 
  AND batch_id = $2 
  AND month = $3
LIMIT 1;
```

**JavaScript:**
```javascript
const { data, error } = await supabase
  .from('fees')
  .select('fee_id, paid_amount')
  .eq('student_id', studentId)
  .eq('batch_id', batchId)
  .eq('month', month)
  .single()
```

---

### Query 6: Get Students with Fees (Complete Join)

**Purpose:** Get all enrolled students with their fee status

**SQL:**
```sql
SELECT 
  s.student_id,
  s.student_name,
  s.phone,
  e.batch_id,
  b.batch_name,
  b.grade,
  b.fee_amount,
  COALESCE(f.amount, b.fee_amount) AS fee_amount,
  COALESCE(f.paid_amount, 0) AS paid_amount,
  COALESCE(f.status, 'Pending') AS status,
  f.payment_date
FROM enrollment e
JOIN student s ON e.student_id = s.student_id
JOIN batch b ON e.batch_id = b.batch_id
LEFT JOIN fees f ON (
  f.student_id = s.student_id 
  AND f.batch_id = b.batch_id 
  AND f.month = TO_CHAR(NOW(), 'YYYY-MM')
)
WHERE s.status = 'active'
ORDER BY s.student_name ASC;
```

**JavaScript:**
```javascript
const { data: enrollments, error } = await supabase
  .from('enrollment')
  .select(`
    enrollment_id,
    student_id,
    batch_id,
    student:student_id (student_name, phone, email),
    batch:batch_id (batch_name, grade, fee_amount)
  `)
  .eq('student.status', 'active')
  .order('student.student_name')

// Then fetch fees separately and merge
const { data: fees } = await supabase
  .from('fees')
  .select('student_id, batch_id, paid_amount, status, payment_date')
  .eq('month', getCurrentMonth())
```

---

### Query 7: Get Monthly Collection Report

**Purpose:** Get daily/weekly collection breakdown

**SQL:**
```sql
SELECT 
  DATE(payment_date) AS payment_date,
  COUNT(*) AS transactions,
  SUM(paid_amount) AS total_collected,
  COUNT(DISTINCT student_id) AS students_paid
FROM fees
WHERE month = TO_CHAR(NOW(), 'YYYY-MM')
  AND status IN ('Paid', 'Partial')
GROUP BY DATE(payment_date)
ORDER BY payment_date DESC;
```

**JavaScript:**
```javascript
const { data, error } = await supabase
  .from('fees')
  .select('payment_date, paid_amount, student_id')
  .eq('month', getCurrentMonth())
  .in('status', ['Paid', 'Partial'])

// Group by date in JavaScript
const grouped = {}
data?.forEach(f => {
  const date = f.payment_date?.split('T')[0]
  if (!grouped[date]) grouped[date] = []
  grouped[date].push(f)
})
```

---

### Query 8: Get Overdue Fees

**Purpose:** Find students who haven't paid previous months

**SQL:**
```sql
SELECT 
  s.student_id,
  s.student_name,
  s.phone,
  b.batch_name,
  f.month,
  f.amount,
  f.paid_amount,
  (f.amount - f.paid_amount) AS due_amount
FROM fees f
JOIN student s ON f.student_id = s.student_id
JOIN batch b ON f.batch_id = b.batch_id
WHERE f.month < TO_CHAR(NOW(), 'YYYY-MM')
  AND f.status != 'Paid'
ORDER BY f.month ASC, s.student_name ASC;
```

**JavaScript:**
```javascript
const currentMonth = getCurrentMonth()
const { data, error } = await supabase
  .from('fees')
  .select(`
    month,
    amount,
    paid_amount,
    student:student_id (student_name, phone),
    batch:batch_id (batch_name)
  `)
  .lt('month', currentMonth)
  .neq('status', 'Paid')
  .order('month', { ascending: true })
```

---

### Query 9: Create Fee Record

**Purpose:** Insert new fee entry

**SQL:**
```sql
INSERT INTO fees (
  student_id,
  batch_id,
  month,
  amount,
  paid_amount,
  status,
  payment_date,
  created_at,
  updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
ON CONFLICT (student_id, batch_id, month) 
DO UPDATE SET
  paid_amount = paid_amount + $5,
  status = CASE 
    WHEN (paid_amount + $5) >= amount THEN 'Paid'
    WHEN (paid_amount + $5) > 0 THEN 'Partial'
    ELSE 'Pending'
  END,
  payment_date = NOW(),
  updated_at = NOW()
RETURNING *;
```

**JavaScript:**
```javascript
const { data, error } = await supabase
  .from('fees')
  .insert({
    student_id,
    batch_id,
    month,
    amount,
    paid_amount,
    status: 'Pending',
    payment_date: null
  })
  .select()
```

---

### Query 10: Update Fee Record

**Purpose:** Update existing fee entry

**SQL:**
```sql
UPDATE fees
SET 
  paid_amount = $2,
  status = CASE 
    WHEN $2 >= amount THEN 'Paid'
    WHEN $2 > 0 THEN 'Partial'
    ELSE 'Pending'
  END,
  payment_date = NOW(),
  updated_at = NOW()
WHERE fee_id = $1
RETURNING *;
```

**JavaScript:**
```javascript
const { data, error } = await supabase
  .from('fees')
  .update({
    paid_amount: newAmount,
    status: calculateStatus(newAmount, totalAmount),
    payment_date: new Date(),
    updated_at: new Date()
  })
  .eq('fee_id', feeId)
  .select()
```

---

## 💻 JAVASCRIPT API FUNCTIONS

### supabaseFees.js Functions

#### 1. getCurrentMonth()
```javascript
export const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`  // '2026-03'
}

// Usage
const month = getCurrentMonth()
```

#### 2. fetchStudentsWithFees()
```javascript
export const fetchStudentsWithFees = async () => {
  // Fetches all active students with fee info
  // Returns array with: student_name, batch_name, fee_amount, 
  //                     paid_amount, due_amount, status
}

// Usage
const students = await fetchStudentsWithFees()
students.forEach(s => {
  console.log(`${s.student_name}: ₹${s.due_amount} due`)
})
```

#### 3. getFeeSummary()
```javascript
export const getFeeSummary = async () => {
  // Returns: { thisMonthCollection, pendingAmount, totalExpected }
}

// Usage
const summary = await getFeeSummary()
console.log(`Collected: ₹${summary.thisMonthCollection}`)
console.log(`Pending: ₹${summary.pendingAmount}`)
```

#### 4. collectFee(feeData)
```javascript
export const collectFee = async (feeData) => {
  // Main fee collection function
  // Validates and either INSERTs or UPDATEs fee record
}

// Usage
const result = await collectFee({
  student_id: 123,
  batch_id: 45,
  amount_to_collect: 500,
  total_fee_amount: 2500
})

if (result.success) {
  console.log(result.status)  // 'Paid' or 'Partial'
}
```

#### 5. getPendingFees()
```javascript
export const getPendingFees = async () => {
  // Returns unpaid and partial fees for current month
}

// Usage
const pending = await getPendingFees()
console.log(`Pending: ${pending.length} fees`)
```

#### 6. getAllPaymentHistory()
```javascript
export const getAllPaymentHistory = async () => {
  // Returns last 100 payment transactions
}

// Usage
const history = await getAllPaymentHistory()
history.forEach(h => {
  console.log(`${h.student.student_name} - ${h.month}`)
})
```

---

## 🔍 DIRECT SQL EXAMPLES

### Example 1: Get Student Fee Status

```sql
-- Get current month fee status for all students
SELECT 
  e.enrollment_id,
  s.student_name,
  b.batch_name,
  b.fee_amount,
  COALESCE(f.paid_amount, 0) AS paid,
  b.fee_amount - COALESCE(f.paid_amount, 0) AS due,
  COALESCE(f.status, 'No Record') AS status
FROM enrollment e
JOIN student s ON e.student_id = s.student_id
JOIN batch b ON e.batch_id = b.batch_id
LEFT JOIN fees f ON (
  f.student_id = s.student_id 
  AND f.batch_id = b.batch_id 
  AND f.month = TO_CHAR(NOW(), 'YYYY-MM')
)
WHERE b.batch_id = 5
ORDER BY s.student_name;

-- Result:
-- enrollment_id | student_name | batch_name | fee_amount | paid | due | status
-- 101           | Alex         | Math A     | 2500       | 1000 | 1500| Partial
-- 102           | Bob          | Math A     | 2500       | 0    | 2500| No Record
```

---

### Example 2: Monthly Collection Report

```sql
-- Get collection summary for dashboard
SELECT 
  COUNT(*) AS total_students,
  SUM(CASE WHEN f.status = 'Paid' THEN 1 ELSE 0 END) AS paid_count,
  SUM(CASE WHEN f.status = 'Partial' THEN 1 ELSE 0 END) AS partial_count,
  SUM(CASE WHEN f.status = 'Pending' OR f.fee_id IS NULL THEN 1 ELSE 0 END) AS pending_count,
  SUM(f.paid_amount) AS total_collected,
  SUM(f.amount) - SUM(f.paid_amount) AS total_pending
FROM (
  SELECT DISTINCT e.student_id, e.batch_id
  FROM enrollment e
  WHERE e.batch_id IN (SELECT batch_id FROM batch)
) t
LEFT JOIN fees f ON (
  f.student_id = t.student_id 
  AND f.batch_id = t.batch_id 
  AND f.month = TO_CHAR(NOW(), 'YYYY-MM')
)
LEFT JOIN fees f2 ON (
  f2.student_id = t.student_id 
  AND f2.batch_id = t.batch_id 
  AND f2.month = TO_CHAR(NOW(), 'YYYY-MM')
);
```

---

### Example 3: Collection by Batch

```sql
-- Get collection breakdown by batch
SELECT 
  b.batch_name,
  COUNT(DISTINCT e.student_id) AS enrolled,
  SUM(CASE WHEN f.status = 'Paid' THEN 1 ELSE 0 END) AS paid,
  SUM(CASE WHEN f.status = 'Partial' THEN 1 ELSE 0 END) AS partial,
  SUM(f.paid_amount) AS collected,
  SUM(b.fee_amount) - SUM(f.paid_amount) AS pending
FROM batch b
LEFT JOIN enrollment e ON b.batch_id = e.batch_id AND e.status = 'active'
LEFT JOIN fees f ON (
  f.student_id = e.student_id 
  AND f.batch_id = b.batch_id 
  AND f.month = TO_CHAR(NOW(), 'YYYY-MM')
)
GROUP BY b.batch_id, b.batch_name
ORDER BY collected DESC;
```

---

### Example 4: Top Collections

```sql
-- Which batches collected most this month
SELECT 
  b.batch_name,
  SUM(f.paid_amount) AS total_collected,
  COUNT(*) AS transactions
FROM fees f
JOIN batch b ON f.batch_id = b.batch_id
WHERE f.month = TO_CHAR(NOW(), 'YYYY-MM')
GROUP BY b.batch_id, b.batch_name
ORDER BY total_collected DESC
LIMIT 10;
```

---

### Example 5: Outstanding Fees

```sql
-- Students who haven't paid previous months
SELECT 
  s.student_name,
  b.batch_name,
  COUNT(*) AS months_unpaid,
  SUM(f.amount - COALESCE(f.paid_amount, 0)) AS total_due
FROM fees f
JOIN student s ON f.student_id = s.student_id
JOIN batch b ON f.batch_id = b.batch_id
WHERE f.month < TO_CHAR(NOW(), 'YYYY-MM')
  AND f.status != 'Paid'
GROUP BY s.student_id, s.student_name, b.batch_id, b.batch_name
HAVING COUNT(*) >= 1
ORDER BY total_due DESC;
```

---

## 🔐 RLS POLICIES

### Policy 1: Read Current Month Fees

```sql
CREATE POLICY "Users can view current month fees"
ON fees FOR SELECT
TO authenticated
USING (
  month = TO_CHAR(NOW(), 'YYYY-MM')
);
```

### Policy 2: Write Own Fees

```sql
CREATE POLICY "Admins can collect fees"
ON fees FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins can update fees"
ON fees FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);
```

---

## ⚡ PERFORMANCE TIPS

### 1. Use Indexes Wisely

```sql
-- These indexes are already created:
CREATE INDEX idx_fees_month ON fees(month);
CREATE INDEX idx_fees_status ON fees(status);
CREATE INDEX idx_fees_student_batch_month 
  ON fees(student_id, batch_id, month);
```

### 2. Batch Queries

```javascript
// ❌ Bad: Multiple queries
for (let i = 0; i < students.length; i++) {
  const fee = await fetchFeeFor(students[i].id)
}

// ✅ Good: Single query with join
const fees = await supabase
  .from('enrollment')
  .select('*, fees(*)')
```

### 3. Pagination for History

```javascript
// History table can be large, use pagination
const { data, error } = await supabase
  .from('fees')
  .select('*')
  .order('payment_date', { ascending: false })
  .range(0, 49)  // 50 records per page
```

### 4. Cache Summary Data

```javascript
// Don't recalculate summary every render
const [summary, setSummary] = useState(null)
const [lastUpdate, setLastUpdate] = useState(null)

useEffect(() => {
  const now = Date.now()
  // Only refresh if > 5 minutes old
  if (!lastUpdate || now - lastUpdate > 5 * 60 * 1000) {
    loadSummary()
    setLastUpdate(now)
  }
}, [])
```

---

## 🧪 TESTING QUERIES

### Test Insert

```sql
INSERT INTO fees (
  student_id, 
  batch_id, 
  month, 
  amount, 
  paid_amount, 
  status
) VALUES (1, 1, '2026-03', 2500, 1500, 'Partial')
RETURNING *;
```

### Test Update

```sql
UPDATE fees 
SET paid_amount = 2500, status = 'Paid'
WHERE student_id = 1 AND batch_id = 1 AND month = '2026-03'
RETURNING *;
```

### Test Delete

```sql
DELETE FROM fees 
WHERE student_id = 1 AND batch_id = 1 AND month = '2026-03'
RETURNING *;
```

---

**Documentation Version:** 1.0
**Last Updated:** March 2026
