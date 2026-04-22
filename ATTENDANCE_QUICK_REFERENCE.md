# Attendance Management - Quick Reference

## 🚀 Quick Start

### 1. Run SQL Migration

Copy and paste the entire content of `ATTENDANCE_SCHEMA.sql` into Supabase SQL Editor and execute.

### 2. Feature is Ready!

All components, routes, and UI are already integrated. Just use it!

---

## 📍 How to Access

**Option 1:** Batches Page → Click "Take Attendance" button on any batch card

**Option 2:** Bottom Navigation → Click "Attendance" tab

**Option 3:** Direct URL → `/attendance`

---

## 🎯 How to Use

### Step 1: Select Batch
Choose a batch from the dropdown.
- ✅ Batches list auto-loads
- ✅ Students auto-fetch for selected batch

### Step 2: Select Date
Pick a date (defaults to today).
- ✅ Can't select future dates
- ✅ Existing attendance auto-loads if available

### Step 3: Mark Attendance
Click ✓ or ✗ on each student card:
- **✓ Present** - Mark student as present (green)
- **✗ Absent** - Mark student as absent (red)

### Step 4: View Summary
Real-time cards show:
- **Total Students** (blue) - Total enrolled students
- **Present** (green) - Count of marked present
- **Absent** (red) - Count of marked absent

### Step 5: Save
Click the "Save Attendance" button.
- ✅ Saves to Supabase automatically
- ✅ Shows "Attendance saved successfully!" message
- ✅ Can edit and save again anytime

---

## 🗄️ Database Tables

### classes
Stores one record per batch per date.

| Column | Type | Notes |
|--------|------|-------|
| class_id | BIGINT | Primary key |
| batch_id | BIGINT | Links to batch table |
| class_date | DATE | Date of class |
| topic | VARCHAR | Optional topic |
| notes | TEXT | Optional notes |
| created_at | TIMESTAMP | Auto-timestamp |
| updated_at | TIMESTAMP | Auto-timestamp |

**Unique Constraint:** `(batch_id, class_date)` - Only one record per batch per day

### attendance
Stores attendance status for each student in each class.

| Column | Type | Notes |
|--------|------|-------|
| attendance_id | BIGINT | Primary key |
| class_id | BIGINT | Links to classes table |
| student_id | UUID | Links to student table |
| status | VARCHAR | 'Present' or 'Absent' |
| remarks | TEXT | Optional remarks |
| marked_by | UUID | Optional: who marked it |
| created_at | TIMESTAMP | Auto-timestamp |
| updated_at | TIMESTAMP | Auto-timestamp |

**Unique Constraint:** `(class_id, student_id)` - Only one attendance per student per class

---

## 📝 Main Queries

### Fetch all batches
```javascript
const { data, error } = await supabase
  .from('batch')
  .select('batch_id, batch_name, grade')
  .eq('status', 'Active')
```

### Fetch students for a batch
```javascript
const { data, error } = await supabase
  .from('enrollment')
  .select(`
    enrollment_id,
    student:student_id (
      student_id,
      name
    )
  `)
  .eq('batch_id', batchId)
```

### Check if class exists
```javascript
const { data, error } = await supabase
  .from('classes')
  .select('class_id')
  .eq('batch_id', batchId)
  .eq('class_date', date)
  .single()
```

### Fetch existing attendance
```javascript
const { data, error } = await supabase
  .from('attendance')
  .select('student_id, status')
  .eq('class_id', classId)
```

### Create class
```javascript
const { data, error } = await supabase
  .from('classes')
  .insert([{ batch_id, class_date }])
  .select('class_id')
  .single()
```

### Save attendance (delete + insert)
```javascript
// Delete old
await supabase.from('attendance').delete().eq('class_id', classId)

// Insert new
await supabase
  .from('attendance')
  .insert([
    { class_id, student_id, status: 'Present' },
    { class_id, student_id, status: 'Absent' },
    ...
  ])
```

---

## 🎨 Components

### Attendance.jsx
Main page with:
- Batch & date selection
- Student list loop
- Manage attendance state
- Save to database

**State Variables:**
```javascript
selectedBatchId, attendanceDate, students, attendanceMap, classId
isLoading, isSaving, error, successMessage
```

### AttendanceSummaryCard.jsx
Displays one metric card.

**Props:**
```javascript
<AttendanceSummaryCard
  title="Total Students"
  value={45}
  type="total|present|absent"
/>
```

### StudentAttendanceCard.jsx
Shows one student with action buttons.

**Props:**
```javascript
<StudentAttendanceCard
  student={{ student_id: 'uuid', name: 'John' }}
  status="Present|Absent|null"
  onMarkPresent={() => {}}
  onMarkAbsent={() => {}}
/>
```

---

## 🎨 Styling

### Colors
- **Total**: Blue `#0284c7`
- **Present**: Green `#16a34a`
- **Absent**: Red `#dc2626`
- **Pending**: Gray `#94a3b8`

### Responsive
- **Mobile**: Single column, stacked buttons
- **Tablet**: Two-column cards
- **Desktop**: Full grid layout

---

## 🔄 Workflow Diagram

```
┌─ Open Attendance Page
              ↓
┌─ Select Batch (fetches students)
              ↓
┌─ Select Date (fetches existing attendance)
              ↓
┌─ Mark Attendance (update local state)
              ↓
┌─ Click "Save Attendance"
              ↓
┌─ Create class record (if not exists)
              ↓
┌─ Save attendance records to Supabase
              ↓
┌─ Show success message
```

---

## ⚠️ Error Handling

### Error States

```javascript
if (error) {
  // Show error message with dismiss button
  <div className="error-message">
    <p>{error}</p>
    <button onClick={() => setError(null)}>Dismiss</button>
  </div>
}
```

### Common Issues

| Issue | Fix |
|-------|-----|
| No students showing | Add students to batch first |
| Can't select future dates | That's intentional (only past/today) |
| Attendance not saving | Check network, try again |
| Batch dropdown empty | Create batches first |

---

## 💡 Pro Tips

1. **Bulk Mark** - Can mark Present/Absent multiple times per student (last click wins)

2. **Existing Attendance** - If you mark attendance for same date again, it updates automatically

3. **Date Navigation** - Go back to previous dates to edit old attendance

4. **Summary Updates** - Cards automatically update as you click buttons (real-time)

5. **Mobile Friendly** - All buttons have large touch targets on mobile

---

## 🧪 Testing Checklist

- [ ] Can select batch from dropdown
- [ ] Students load when batch selected
- [ ] Date picker shows and allows selecting past dates
- [ ] Can click Present button (turns green)
- [ ] Can click Absent button (turns red)
- [ ] Summary cards update in real-time
- [ ] Save button submits to database
- [ ] Success message shows after save
- [ ] Can edit existing attendance
- [ ] Error message shows if something fails
- [ ] Mobile layout responsive
- [ ] Bottom nav shows Attendance link
- [ ] Batch card "Take Attendance" button works

---

## 🐛 Debugging

### Check State in Console
```javascript
console.log('Students:', students)
console.log('Attendance Map:', attendanceMap)
console.log('Class ID:', classId)
console.log('Selected Batch:', selectedBatchId)
```

### Check Database
Open Supabase > SQL Editor and run:

```sql
-- See all classes
SELECT * FROM classes ORDER BY class_date DESC LIMIT 20;

-- See all attendance
SELECT a.*, c.class_date FROM attendance a 
JOIN classes c ON a.class_id = c.class_id 
ORDER BY c.class_date DESC LIMIT 20;

-- See attendance for a specific batch
SELECT a.*, c.class_date FROM attendance a
JOIN classes c ON a.class_id = c.class_id
WHERE c.batch_id = 1
ORDER BY c.class_date DESC;
```

---

## 📚 Full Documentation

For complete details, see: `ATTENDANCE_IMPLEMENTATION_GUIDE.md`

Includes:
- Full database schema
- All query examples
- State management details
- Component documentation
- Security considerations
- Performance optimization
- Troubleshooting guide

---

**Quick Links:**
- 📄 Schema: `ATTENDANCE_SCHEMA.sql`
- 📖 Guide: `ATTENDANCE_IMPLEMENTATION_GUIDE.md`
- 🎨 Code: `src/pages/Attendance.jsx`

---

**Version:** 1.0.0  
**Status:** ✅ Ready to Use
