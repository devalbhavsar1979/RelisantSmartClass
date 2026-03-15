# Batches Feature - Supabase Integration

Complete integration of the Batches feature with Supabase database.

---

## Overview

The Batches feature now fully integrates with Supabase to:
- ✅ Load batches from the `batch` table in real-time
- ✅ Create new batches with form validation
- ✅ Display loading, error, and empty states
- ✅ Auto-refresh when navigating between pages
- ✅ Show success messages after creation

---

## Database Table Structure

```sql
CREATE TABLE batch (
  batch_id BIGSERIAL PRIMARY KEY,
  batch_name VARCHAR NOT NULL,
  subject VARCHAR,
  grade VARCHAR,
  schedule VARCHAR,           -- Comma-separated days (Monday, Tuesday, etc.)
  start_time TIME,
  end_time TIME,
  fee_amount NUMERIC,
  max_capacity INTEGER,
  status VARCHAR DEFAULT 'Active',
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Updated Files

### 1. **src/pages/Batches.jsx** - Fetch & Display Batches

**Key Features:**
- Fetches all batches from Supabase on page load
- Orders by `created_at` (newest first)
- Transforms Supabase data to match `BatchCard` component
- Handles loading state with spinner
- Handles error state with retry button
- Shows empty state when no batches exist

**Data Transformation:**
```javascript
const transformedBatches = data.map((batch) => ({
  id: batch.batch_id,
  name: batch.batch_name,
  grade: batch.grade,
  subject: batch.subject,
  students: batch.max_capacity || 0,
  fees: `₹${batch.fee_amount}`,
  days: batch.schedule || 'To be scheduled',
  location: 'Center',
  time: batch.start_time && batch.end_time 
    ? `${batch.start_time} – ${batch.end_time}` 
    : 'To be scheduled',
  status: batch.status,
  description: batch.description,
  created_at: batch.created_at,
  updated_at: batch.updated_at
}))
```

**Supabase Query:**
```javascript
const { data, error } = await supabase
  .from('batch')
  .select('*')
  .order('created_at', { ascending: false })
```

**States:**
- ✅ **Loading**: Shows spinner while fetching
- ✅ **Error**: Shows error message with retry button
- ✅ **Empty**: Shows "No batches created yet" message
- ✅ **Success**: Displays grid of batch cards

---

### 2. **src/pages/AddBatch.jsx** - Create New Batches

**Key Features:**
- Form validates required fields before submission
- Inserts data into Supabase `batch` table
- Shows success message after creation
- Auto-redirects to Batches page after 1.5 seconds
- Displays user-friendly error messages
- Disables form during submission

**Form Fields (Maps to Database):**

| Form Field | Database Column | Type | Required |
|-----------|-----------------|------|----------|
| Batch Name | `batch_name` | VARCHAR | ✅ Yes |
| Subject | `subject` | VARCHAR | ✅ Yes |
| Grade | `grade` | VARCHAR | ✅ Yes |
| Schedule Days | `schedule` | VARCHAR | ❌ No |
| Start Time | `start_time` | TIME | ✅ Yes |
| End Time | `end_time` | TIME | ✅ Yes |
| Monthly Fees | `fee_amount` | NUMERIC | ✅ Yes |
| Max Capacity | `max_capacity` | INTEGER | ❌ No |
| Description | `description` | TEXT | ❌ No |

**Validation:**
```javascript
- Batch Name: Required, must be non-empty
- Subject: Required, must be selected
- Grade: Required, must be selected
- Start Time: Required, must be provided
- End Time: Required, must be provided
- Fee Amount: Required, must be numeric
```

**Supabase Insert:**
```javascript
const { data, error } = await supabase
  .from('batch')
  .insert([{
    batch_name: formData.batch_name.trim(),
    subject: formData.subject.trim(),
    grade: formData.grade,
    schedule: formData.schedule || null,
    start_time: formData.start_time.trim(),
    end_time: formData.end_time.trim(),
    fee_amount: parseFloat(formData.fee_amount),
    max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
    description: formData.description.trim() || null,
    status: 'Active'
  }])
  .select()
```

**After Successful Save:**
1. Shows green success message: "✓ Batch created successfully! Redirecting..."
2. Redirects to `/batches` after 1.5 seconds
3. Batches page automatically reloads data

---

## Component Flow

```
App (Router)
  ↓
  ├─ /batches → Batches.jsx
  │  ├─ useEffect: Fetch from Supabase
  │  ├─ useState: batches, isLoading, error
  │  └─ Render: Loading/Error/Empty/Grid of BatchCard
  │
  └─ /batches/add → AddBatch.jsx
     ├─ useState: formData, errors, isSubmitting, showSuccess
     ├─ validateForm: Check required fields
     ├─ handleSubmit: Insert into Supabase
     ├─ onSuccess: Show message → Redirect to /batches
     └─ onError: Show error message (form stays open)
```

---

## User Interface States

### Loading State
```
┌─────────────────────────────┐
│      Loading batches...     │
│          [spinner]          │
└─────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────┐
│   Failed to load batches.           │
│   Please try again.                 │
│                                     │
│      [Try Again Button]             │
└─────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────┐
│   No batches created yet.           │
│   Click "Add New Batch" to create   │
│   your first batch.                 │
└─────────────────────────────────────┘
```

### Success Message (Add Batch)
```
┌─────────────────────────────────────┐
│ ✓ Batch created successfully!       │
│   Redirecting...                    │
└─────────────────────────────────────┘
```

---

## Schedule Format

Days are stored as comma-separated strings in the database:

**Example:**
```
schedule: "Monday, Wednesday, Friday"
schedule: "Tuesday, Thursday, Saturday"
schedule: "Monday, Tuesday, Wednesday, Thursday, Friday"
```

This gets displayed in the UI as:
```
Mon-Wed-Fri
Tue-Thu-Sat
Mon-Tue-Wed-Thu-Fri
```

---

## Time Format

Times are stored in 24-hour format (HH:MM):

**Examples:**
```
start_time: "07:00"    → Displayed as "07:00 – 08:00"
end_time: "08:00"

start_time: "14:30"    → Displayed as "14:30 – 15:30"
end_time: "15:30"

start_time: "05:00"    → Displayed as "05:00 – 06:30"
end_time: "06:30"
```

---

## Error Handling

### Form Validation Errors
Displayed inline below each field:
- "Batch name is required"
- "Subject is required"
- "Grade is required"
- "Start time is required"
- "End time is required"
- "Fee amount is required"
- "Fee amount must be a valid number"

### Supabase Errors
Displayed at top of form:
- Database connection errors
- Insert operation failures
- Validation constraint violations

---

## CSS Updates

### New Loading State Styles
```css
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

### New Error State Styles
```css
.error-container {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 40px 20px;
}

.retry-btn {
  background: #dc2626;
  color: white;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
}
```

### New Success Message Styles
```css
.success-message {
  background: #ecfdf5;
  border: 1px solid #6ee7b7;
  border-radius: 8px;
  padding: 14px 16px;
  color: #059669;
  font-weight: 500;
}
```

---

## Testing Guide

### Test 1: Load Batches from Supabase
1. Navigate to `/batches`
2. Should see loading spinner briefly
3. Should display all batches from database (if any exist)
4. Check console for no errors

### Test 2: Empty State
1. Delete all batches from Supabase
2. Refresh `/batches`
3. Should show "No batches created yet" message
4. Click "Add New Batch" button

### Test 3: Create New Batch
1. Click "Add New Batch"
2. Fill form with valid data:
   - Batch Name: "10th Evening Batch"
   - Subject: "Maths"
   - Grade: "10th"
   - Schedule Days: Select Monday, Wednesday, Friday
   - Start Time: "04:00"
   - End Time: "05:00"
   - Monthly Fees: "1500"
3. Click "Save Batch"
4. Should see success message
5. Auto-redirect to `/batches`
6. New batch should appear in list

### Test 4: Form Validation
1. Go to Add Batch page
2. Leave required fields empty
3. Click "Save Batch"
4. Should show error messages for:
   - Batch Name
   - Subject
   - Grade
   - Start Time
   - End Time
   - Fee Amount

### Test 5: Error Handling
1. Disconnect internet or block Supabase
2. Try fetching batches → Should show error + retry button
3. Try creating batch → Should show error message in form

### Test 6: Auto-Refresh on Page Change
1. Open Batches page
2. Navigate to Add Batch
3. Create new batch
4. Should automatically refresh Batches page
5. New batch should appear

---

## Deployment

### Vercel
When deploying to Vercel:
1. Environment variables are already set (from previous setup):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Build will use these automatically
3. Deploy: `vercel --prod`

### Manual Deployment Steps
```bash
# 1. Test locally
npm run dev

# 2. Build
npm run build

# 3. Deploy
vercel --prod
```

---

## Performance Notes

- ✅ Queries are ordered by `created_at` (newest first) for proper indexing
- ✅ Data transformation happens client-side (lightweight operation)
- ✅ Loading state prevents multiple simultaneous requests
- ✅ Error state allows retry without page refresh

---

## Future Enhancements

Potential features to add:

1. **Pagination**: Load batches in chunks
2. **Filtering**: Filter by grade, subject, status
3. **Searching**: Search batches by name
4. **Sorting**: Sort by created date, fees, capacity
5. **Editing**: Edit existing batch details
6. **Deletion**: Delete batches (with confirmation)
7. **Student Count**: Calculate actual enrolled students
8. **Location**: Add location to Supabase table
9. **Bulk Actions**: Select multiple batches
10. **Export**: Export batch list to CSV/PDF

---

## Troubleshooting

### Batches Not Loading
**Problem:** Spinner keeps showing / No batches appear

**Solutions:**
1. Check Supabase credentials in `.env`
2. Verify `batch` table exists in Supabase
3. Check browser console for errors
4. Click "Try Again" button to retry
5. Verify Internet connection

### Form Not Submitting
**Problem:** "Save Batch" button doesn't work

**Solutions:**
1. Fill all required fields (marked with *)
2. Check error messages displayed in red
3. Verify Fee Amount is numeric (no letters)
4. Check browser console for Supabase errors
5. Ensure Internet connection is active

### Success Message But No Redirect
**Problem:** Batch saved but didn't redirect to batches page

**Solutions:**
1. Manually navigate to `/batches`
2. Page should load with new batch
3. Check browser console for navigation errors
4. Clear cache and reload (Ctrl+Shift+R)

---

## Code Reference

### Batches.jsx - Complete Example
```javascript
// Fetch from Supabase
const fetchBatches = async () => {
  try {
    setIsLoading(true)
    setError(null)

    const { data, error: supabaseError } = await supabase
      .from('batch')
      .select('*')
      .order('created_at', { ascending: false })

    if (supabaseError) {
      setError('Failed to load batches. Please try again.')
      return
    }

    // Transform data
    const transformedBatches = data.map((batch) => ({
      id: batch.batch_id,
      name: batch.batch_name,
      // ... more fields
    }))

    setBatches(transformedBatches)
  } catch (err) {
    setError('An unexpected error occurred.')
  } finally {
    setIsLoading(false)
  }
}
```

### AddBatch.jsx - Complete Example
```javascript
// Insert into Supabase
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!validateForm()) return

  setIsSubmitting(true)
  setSubmitError(null)

  try {
    const batchData = {
      batch_name: formData.batch_name.trim(),
      subject: formData.subject.trim(),
      grade: formData.grade,
      schedule: formData.schedule || null,
      start_time: formData.start_time.trim(),
      end_time: formData.end_time.trim(),
      fee_amount: parseFloat(formData.fee_amount),
      max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
      description: formData.description.trim() || null,
      status: 'Active'
    }

    const { data, error: insertError } = await supabase
      .from('batch')
      .insert([batchData])
      .select()

    if (insertError) {
      setSubmitError(insertError.message)
      return
    }

    // Show success and redirect
    setShowSuccess(true)
    setTimeout(() => navigate('/batches'), 1500)
  } catch (err) {
    setSubmitError('An unexpected error occurred.')
  } finally {
    setIsSubmitting(false)
  }
}
```

---

## Summary

✅ **Batches feature fully integrated with Supabase**
- Fetch, create, validate, and display batches
- Proper loading, error, and empty states
- User-friendly success messages
- Complete form validation
- Ready for production deployment
