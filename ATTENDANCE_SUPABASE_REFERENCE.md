# Attendance Feature - Supabase Code Reference

Complete reference of all Supabase queries used in the Attendance Management system.

---

## Table of Contents

1. **Attendance Page Queries** - Queries in `Attendance.jsx`
2. **Individual Query Details** - Breakdown of each query
3. **Error Handling** - Common errors and solutions
4. **Advanced Queries** - Reports and analytics

---

## Attendance Page Queries

### Query 1: Fetch Batches (onMount)

**Purpose:** Load all active batches for the batch selection dropdown

**File:** `src/pages/Attendance.jsx` - useEffect hook (lines ~80-100)

```javascript
const fetchBatches = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('batch')
      .select('batch_id, batch_name, grade')
      .eq('status', 'Active')
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    setBatches(data || [])
    
    // Auto-select first batch if available
    if (data && data.length > 0 && !selectedBatchId) {
      setSelectedBatchId(data[0].batch_id)
    }
  } catch (err) {
    console.error('Error fetching batches:', err)
    setError(err.message || 'Failed to load batches')
  }
}
```

**Execution:** On component mount (dependency: `[]`)

**Response:**
```javascript
[
  {
    batch_id: 1,
    batch_name: "Batch A",
    grade: "10th"
  },
  {
    batch_id: 2,
    batch_name: "Batch B",
    grade: "12th"
  }
]
```

**Error Handling:**
```javascript
// Catches Supabase errors and displays to user
if (fetchError) throw fetchError
```

---

### Query 2: Fetch Students (when batch/date changes)

**Purpose:** Load students enrolled in the selected batch using enrollment table

**File:** `src/pages/Attendance.jsx` - useEffect hook (lines ~115-145)

```javascript
const fetchStudentsAndAttendance = async () => {
  try {
    // STEP 1: Fetch students from enrollment + student join
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('enrollment')
      .select(`
        enrollment_id,
        student:student_id (
          student_id,
          name
        )
      `)
      .eq('batch_id', selectedBatchId)
      .order('created_at', { ascending: false })

    if (enrollmentError) throw enrollmentError

    // Transform data to list of students
    const studentsList = (enrollmentData || []).map((enrollment) => ({
      ...enrollment.student,
      enrollment_id: enrollment.enrollment_id
    }))

    setStudents(studentsList)
    // ... Continue to check for existing class (see Query 3)
  } catch (err) {
    console.error('Error fetching students/attendance:', err)
    setError(err.message || 'Failed to load data')
  }
}
```

**Execution:** When `selectedBatchId` or `attendanceDate` changes

**Response:**
```javascript
[
  {
    enrollment_id: 'uuid123',
    student_id: 'uuid456',
    name: 'John Doe'
  },
  {
    enrollment_id: 'uuid789',
    student_id: 'uuid012',
    name: 'Jane Smith'
  }
]
```

**RLS Join Explanation:**
```
enrollment table → student_id column
  ↓
Joins with → student table
  ↓
Returns → nested student object
```

---

### Query 3: Check if Class Exists

**Purpose:** Load existing class record for the selected batch + date combination

**File:** `src/pages/Attendance.jsx` - useEffect hook (lines ~145-165)

```javascript
// STEP 2: Check if class exists for this batch + date
const { data: classData, error: classError } = await supabase
  .from('classes')
  .select('class_id')
  .eq('batch_id', selectedBatchId)
  .eq('class_date', attendanceDate)
  .single() // Returns single row or error PGRST116

// Error handling for no rows found
if (classError && classError.code !== 'PGRST116') {
  // PGRST116 = no rows found (expected)
  throw classError
}

if (classData) {
  // Class exists, retrieve attendance
  setClassId(classData.class_id)
  // ... Continue to fetch existing attendance (see Query 4)
} else {
  // No class exists yet
  setClassId(null)
  setAttendanceMap({})
}
```

**Execution:** When `selectedBatchId` or `attendanceDate` changes

**Response (if exists):**
```javascript
{
  class_id: 123
}
```

**Response (if not exists):**
```javascript
null
// Error: PGRST116 (expected - not a real error)
```

**Error Codes:**
- `PGRST116` = No rows found (ignore, expected)
- Other codes = Real database errors (throw)

---

### Query 4: Fetch Existing Attendance

**Purpose:** Load attendance records that were previously marked for this class

**File:** `src/pages/Attendance.jsx` - useEffect hook (lines ~165-180)

```javascript
if (classData) {
  // Class exists, fetch previous attendance
  setClassId(classData.class_id)
  
  const { data: attendanceData, error: attendanceError } = await supabase
    .from('attendance')
    .select('student_id, status')
    .eq('class_id', classData.class_id)

  if (attendanceError) throw attendanceError

  // Build attendance map from existing data
  const newAttendanceMap = {}
  attendanceData?.forEach((record) => {
    newAttendanceMap[record.student_id] = record.status
  })
  setAttendanceMap(newAttendanceMap)
}
```

**Execution:** When checking if class exists and class_id is found

**Response:**
```javascript
[
  { student_id: 'uuid1', status: 'Present' },
  { student_id: 'uuid2', status: 'Absent' },
  { student_id: 'uuid3', status: 'Present' }
]
```

**Data Structure Built:**
```javascript
// Converts to map for O(1) lookup
{
  'uuid1': 'Present',
  'uuid2': 'Absent',
  'uuid3': 'Present'
}
```

---

### Query 5: Create Class Record

**Purpose:** Create a new class record when saving attendance (if it doesn't exist)

**File:** `src/pages/Attendance.jsx` - handleSaveAttendance function (lines ~220-235)

```javascript
const handleSaveAttendance = async () => {
  try {
    // STEP 1: Create class record if it doesn't exist
    let currentClassId = classId

    if (!currentClassId) {
      const { data: newClass, error: createClassError } = await supabase
        .from('classes')
        .insert([{
          batch_id: selectedBatchId,
          class_date: attendanceDate,
          topic: null,      // Optional
          notes: null       // Optional
        }])
        .select('class_id')
        .single()

      if (createClassError) throw createClassError
      
      currentClassId = newClass.class_id
      setClassId(currentClassId) // Save for future use
    }

    // ... Continue to save attendance (see Query 6)
  } catch (err) {
    console.error('Error saving attendance:', err)
    setError(err.message || 'Failed to save attendance')
  }
}
```

**Execution:** When user clicks "Save Attendance" and no class exists

**Request:**
```javascript
{
  batch_id: 1,
  class_date: '2026-03-25',
  topic: null,
  notes: null
}
```

**Response:**
```javascript
{
  class_id: 456
}
```

**Unique Constraint:**
- Only one class per batch per date (automatic)
- Trying to insert duplicate will error out

---

### Query 6: Save Attendance Records (Upsert)

**Purpose:** Save/update all attendance markings to database

**File:** `src/pages/Attendance.jsx` - handleSaveAttendance function (lines ~235-270)

```javascript
const handleSaveAttendance = async () => {
  try {
    // ... (Create class if needed - see Query 5)
    
    // STEP 2: Prepare attendance records
    const attendanceRecords = students
      .filter((student) => attendanceMap[student.student_id]) // Only marked
      .map((student) => ({
        class_id: currentClassId,
        student_id: student.student_id,
        status: attendanceMap[student.student_id]
      }))

    // STEP 3: Delete existing records
    const { error: deleteError } = await supabase
      .from('attendance')
      .delete()
      .eq('class_id', currentClassId)

    if (deleteError) throw deleteError

    // STEP 4: Insert new records
    if (attendanceRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('attendance')
        .insert(attendanceRecords)

      if (insertError) throw insertError
    }

    // Success!
    setSuccessMessage('✓ Attendance saved successfully!')
    setTimeout(() => setSuccessMessage(''), 3000)
  } catch (err) {
    console.error('Error saving attendance:', err)
    setError(err.message || 'Failed to save attendance')
  }
}
```

**Execution:** When user clicks "Save Attendance" button

**Delete Request:**
```javascript
.delete()
.eq('class_id', 456)
```

**Insert Request:**
```javascript
[
  {
    class_id: 456,
    student_id: 'uuid1',
    status: 'Present'
  },
  {
    class_id: 456,
    student_id: 'uuid2',
    status: 'Absent'
  },
  {
    class_id: 456,
    student_id: 'uuid3',
    status: 'Present'
  }
]
```

**Why Delete + Insert (not Upsert)?**
- Handles unmarked students (no record created)
- Simpler logic than checking each record
- UNIQUE constraint prevents duplicates anyway

---

## Individual Query Details

### Query: Select Batches

```sql
SELECT batch_id, batch_name, grade
FROM batch
WHERE status = 'Active'
ORDER BY created_at DESC
```

**Equivalent Supabase:**
```javascript
supabase
  .from('batch')
  .select('batch_id, batch_name, grade')
  .eq('status', 'Active')
  .order('created_at', { ascending: false })
```

---

### Query: Select Students (with Join)

```sql
SELECT 
  e.enrollment_id,
  s.student_id,
  s.name
FROM enrollment e
JOIN student s ON e.student_id = s.student_id
WHERE e.batch_id = 1
ORDER BY e.created_at DESC
```

**Equivalent Supabase:**
```javascript
supabase
  .from('enrollment')
  .select(`
    enrollment_id,
    student:student_id (
      student_id,
      name
    )
  `)
  .eq('batch_id', selectedBatchId)
  .order('created_at', { ascending: false })
```

---

### Query: Check
 Class Exists

```sql
SELECT class_id
FROM classes
WHERE batch_id = 1 AND class_date = '2026-03-25'
LIMIT 1
```

**Equivalent Supabase:**
```javascript
supabase
  .from('classes')
  .select('class_id')
  .eq('batch_id', selectedBatchId)
  .eq('class_date', attendanceDate)
  .single() // Enforces LIMIT 1
```

---

### Query: Select Attendance

```sql
SELECT student_id, status
FROM attendance
WHERE class_id = 456
```

**Equivalent Supabase:**
```javascript
supabase
  .from('attendance')
  .select('student_id, status')
  .eq('class_id', classId)
```

---

### Query: Insert Class

```sql
INSERT INTO classes (batch_id, class_date)
VALUES (1, '2026-03-25')
RETURNING class_id
```

**Equivalent Supabase:**
```javascript
supabase
  .from('classes')
  .insert([{
    batch_id: selectedBatchId,
    class_date: attendanceDate
  }])
  .select('class_id')
  .single() // Returns single row
```

---

### Query: Delete Attendance

```sql
DELETE FROM attendance
WHERE class_id = 456
```

**Equivalent Supabase:**
```javascript
supabase
  .from('attendance')
  .delete()
  .eq('class_id', currentClassId)
```

---

### Query: Insert Attendance (Bulk)

```sql
INSERT INTO attendance (class_id, student_id, status)
VALUES 
  (456, 'uuid1', 'Present'),
  (456, 'uuid2', 'Absent'),
  (456, 'uuid3', 'Present')
```

**Equivalent Supabase:**
```javascript
supabase
  .from('attendance')
  .insert([
    { class_id: 456, student_id: 'uuid1', status: 'Present' },
    { class_id: 456, student_id: 'uuid2', status: 'Absent' },
    { class_id: 456, student_id: 'uuid3', status: 'Present' }
  ])
```

---

## Error Handling

### Error 1: PGRST116 (No Rows Found)

**Occurs:** When using `.single()` and no rows exist

**Expected in:** Query 3 (checking class exists)

**Handling:**
```javascript
const { data, error } = await supabase.from('classes').select('*').single()

if (error && error.code === 'PGRST116') {
  // Expected - no class exists yet
  console.log('No class found, will create new one')
} else if (error) {
  // Real error
  throw error
}
```

---

### Error 2: Foreign Key Constraint

**Occurs:** When trying to delete batch with enrolled students

**Message:** `"Referential integrity constraint violation"`

**In Attendance:** Not applicable (we don't delete batches here)

---

### Error 3: Duplicate UNIQUE Constraint

**Occurs:** When inserting duplicate (class_id, student_id)

**Prevention:** We delete old records before inserting

**Manual Check:**
```sql
-- This would cause error
INSERT INTO attendance (class_id, student_id, status)
VALUES (456, 'uuid1', 'Present')
INSERT INTO attendance (class_id, student_id, status)
VALUES (456, 'uuid1', 'Present') -- Error!
```

---

### Error 4: Connection Errors

**Occurs:** Network issues, Supabase down

**Handling:**
```javascript
try {
  // Query
} catch (err) {
  if (err.message.includes('network')) {
    setError('Network error. Check your connection.')
  } else {
    setError(err.message)
  }
}
```

---

## Advanced Queries

### Query: Get Attendance Summary

**Purpose:** Quick statistics without manual calculation

**Uses:** The `attendance_summary` view created in schema

```javascript
const { data, error } = await supabase
  .from('attendance_summary')
  .select('*')
  .eq('batch_id', selectedBatchId)
  .eq('class_date', attendanceDate)
  .single()
```

**Response:**
```javascript
{
  class_id: 456,
  batch_id: 1,
  class_date: '2026-03-25',
  total_marked: 35,        // How many marked
  present_count: 30,       // Present count
  absent_count: 5,         // Absent count
  total_students: 45       // Total in batch
}
```

---

### Query: Get Attendance History for Student

**Purpose:** View all attendance records for one student

```javascript
const { data, error } = await supabase
  .from('attendance')
  .select(`
    attendance_id,
    status,
    class:class_id (
      class_date,
      batch_id
    )
  `)
  .eq('student_id', studentId)
  .order('class->class_date', { ascending: false })
```

**Response:**
```javascript
[
  {
    attendance_id: 1,
    status: 'Present',
    class: { class_date: '2026-03-25', batch_id: 1 }
  },
  {
    attendance_id: 2,
    status: 'Absent',
    class: { class_date: '2026-03-24', batch_id: 1 }
  }
]
```

---

### Query: Attendance Report (All Batches)

**Purpose:** Generate attendance report for a date range

```sql
SELECT 
  c.batch_id,
  b.batch_name,
  c.class_date,
  s.name,
  a.status
FROM attendance a
JOIN classes c ON a.class_id = c.class_id
JOIN batch b ON c.batch_id = b.batch_id
JOIN student s ON a.student_id = s.student_id
WHERE c.class_date BETWEEN '2026-03-01' AND '2026-03-31'
ORDER BY c.batch_id, c.class_date DESC, s.name ASC
```

---

### Query: Attendance Percentage (Per Student)

**Purpose:** Calculate attendance % for each student

```sql
SELECT 
  s.name,
  COUNT(a.attendance_id) as total_classes,
  SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
  ROUND(
    100.0 * SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) 
    / NULLIF(COUNT(a.attendance_id), 0)
  ) as attendance_percentage
FROM student s
LEFT JOIN enrollment e ON s.student_id = e.student_id
LEFT JOIN classes c ON e.batch_id = c.batch_id
LEFT JOIN attendance a ON c.class_id = a.class_id AND s.student_id = a.student_id
WHERE e.batch_id = 1
GROUP BY s.student_id, s.name
ORDER BY attendance_percentage DESC
```

---

## Performance Tips

### Index Usage

All queries use indexed columns:

```sql
-- Classes table indexes
CREATE INDEX idx_classes_batch_id ON classes(batch_id)
CREATE INDEX idx_classes_batch_date ON classes(batch_id, class_date)

-- Attendance table indexes
CREATE INDEX idx_attendance_class_id ON attendance(class_id)
CREATE INDEX idx_attendance_class_student ON attendance(class_id, student_id)
```

### Query Optimization

✅ **Good:**
```javascript
.select('student_id, status')  // Only needed columns
.eq('class_id', classId)       // Specific filter
```

❌ **Avoid:**
```javascript
.select('*')                   // All columns (includes large fields)
```

---

## Testing Queries

### In Supabase SQL Editor

```sql
-- List all classes
SELECT * FROM classes ORDER BY class_date DESC LIMIT 10;

-- List all attendance
SELECT a.*, c.class_date, c.batch_id FROM attendance a
JOIN classes c ON a.class_id = c.class_id
ORDER BY c.class_date DESC LIMIT 20;

-- Count attendance by status
SELECT status, COUNT(*) as count FROM attendance GROUP BY status;

-- Check for orphaned records (attendance without class)
SELECT COUNT(*) FROM attendance WHERE class_id NOT IN (SELECT class_id FROM classes);
```

---

## Query Reference Table

| Query | Purpose | File | Lines |
|-------|---------|------|-------|
| Fetch Batches | Load batch dropdown | Attendance.jsx | 80-100 |
| Fetch Students | Load enrollment | Attendance.jsx | 115-130 |
| Check Class | See if exists | Attendance.jsx | 135-150 |
| Fetch Attendance | Load existing | Attendance.jsx | 155-180 |
| Create Class | Insert new class | Attendance.jsx | 220-235 |
| Save Attendance | Delete + Insert | Attendance.jsx | 240-270 |

---

**Version:** 1.0.0  
**Last Updated:** March 2026
