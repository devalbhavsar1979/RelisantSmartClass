-- ============================================
-- ATTENDANCE MANAGEMENT SYSTEM - SUPABASE SCHEMA
-- ============================================
-- This script creates all necessary tables for the attendance feature

-- 1. CLASSES TABLE
-- Stores information about each class (batch + date combination)
CREATE TABLE IF NOT EXISTS classes (
  class_id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES batch(batch_id) ON DELETE CASCADE,
  class_date DATE NOT NULL,
  topic VARCHAR,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(batch_id, class_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_classes_batch_id ON classes(batch_id);
CREATE INDEX IF NOT EXISTS idx_classes_class_date ON classes(class_date);
CREATE INDEX IF NOT EXISTS idx_classes_batch_date ON classes(batch_id, class_date);

-- 2. ATTENDANCE TABLE
-- Stores attendance records for each student in each class
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
  status VARCHAR NOT NULL CHECK (status IN ('Present', 'Absent')),
  remarks TEXT,
  marked_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_class_student ON attendance(class_id, student_id);

-- 3. OPTIONAL: ATTENDANCE SUMMARY VIEW
-- This view provides quick statistics for each class
CREATE OR REPLACE VIEW attendance_summary AS
SELECT
  c.class_id,
  c.batch_id,
  c.class_date,
  COUNT(a.attendance_id) AS total_marked,
  SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
  SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
  COUNT(DISTINCT e.student_id) AS total_students
FROM classes c
LEFT JOIN attendance a ON c.class_id = a.class_id
LEFT JOIN enrollment e ON c.batch_id = e.batch_id
GROUP BY c.class_id, c.batch_id, c.class_date
ORDER BY c.class_date DESC;

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS) - OPTIONAL
-- ============================================
-- Uncomment if you want to enable Row Level Security

-- ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies (if RLS is enabled)
-- CREATE POLICY "Teachers can view all classes" ON classes
--   FOR SELECT USING (true);

-- CREATE POLICY "Teachers can create classes" ON classes
--   FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Teachers can view all attendance" ON attendance
--   FOR SELECT USING (true);

-- CREATE POLICY "Teachers can mark attendance" ON attendance
--   FOR INSERT WITH CHECK (true);

-- ============================================
-- GRANT PERMISSIONS (Optional)
-- ============================================
-- If you want anonymous users to access these tables:

GRANT SELECT, INSERT, UPDATE, DELETE ON classes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO anon;
GRANT SELECT ON attendance_summary TO anon;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment to insert sample data for testing

/*
-- Insert a sample class (adjust batch_id as needed)
INSERT INTO classes (batch_id, class_date, topic)
VALUES 
  (1, CURRENT_DATE, 'Introduction to React'),
  (1, CURRENT_DATE - INTERVAL '1 day', 'Props and State');

-- Attendance records will be inserted by the frontend application
*/
