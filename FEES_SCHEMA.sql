-- ============================================================================
-- FEES COLLECTION MODULE - DATABASE SCHEMA
-- ============================================================================
-- This SQL script creates the fees table for tracking student fee collection
-- Run this in your Supabase SQL Editor

-- Create the fees table
CREATE TABLE IF NOT EXISTS fees (
  fee_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
  batch_id BIGINT NOT NULL REFERENCES batch(batch_id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM' (e.g., '2026-03')
  amount NUMERIC(10, 2) NOT NULL, -- Total fee amount for the month
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0, -- Amount paid so far
  status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Paid', 'Partial', 'Pending'
  payment_date TIMESTAMP NULL, -- Date of last payment
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate entries for same student in same month
  UNIQUE(student_id, batch_id, month)
);

-- Create indexes for better query performance
CREATE INDEX idx_fees_student_id ON fees(student_id);
CREATE INDEX idx_fees_batch_id ON fees(batch_id);
CREATE INDEX idx_fees_month ON fees(month);
CREATE INDEX idx_fees_status ON fees(status);
CREATE INDEX idx_fees_student_batch_month ON fees(student_id, batch_id, month);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE fees ENABLE ROW LEVEL SECURITY;

-- Example queries for reference:

-- 1. Get total collection for current month
-- SELECT SUM(paid_amount) AS total_collected
-- FROM fees
-- WHERE month = TO_CHAR(NOW(), 'YYYY-MM')
--   AND status IN ('Paid', 'Partial');

-- 2. Get pending amount for current month
-- SELECT SUM(amount - paid_amount) AS pending_amount
-- FROM fees
-- WHERE month = TO_CHAR(NOW(), 'YYYY-MM')
--   AND status IN ('Pending', 'Partial');

-- 3. Get fees for a specific batch in current month
-- SELECT f.fee_id, s.student_name, f.amount, f.paid_amount, 
--        (f.amount - f.paid_amount) AS due_amount, f.status
-- FROM fees f
-- JOIN student s ON f.student_id = s.student_id
-- WHERE f.batch_id = $1 AND f.month = TO_CHAR(NOW(), 'YYYY-MM')
-- ORDER BY s.student_name;

-- 4. Get payment history for a student
-- SELECT f.month, f.amount, f.paid_amount, f.status, f.payment_date
-- FROM fees f
-- WHERE f.student_id = $1
-- ORDER BY f.month DESC;
