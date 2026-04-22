-- ============================================
-- Communication Logs Schema
-- Relisant SmartClass - WhatsApp Communication Module
-- ============================================

-- Table to log all WhatsApp messages sent to parents
CREATE TABLE communication_logs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Message recipient info
  student_id INT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  
  -- Message content
  message TEXT NOT NULL,
  message_type VARCHAR(50), -- 'announcement', 'reminder', 'homework', 'fees'
  subject VARCHAR(255),
  
  -- Delivery status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  message_id VARCHAR(255), -- WhatsApp message ID for tracking
  error_message TEXT, -- Error details if status is 'failed'
  
  -- Timestamps
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key
  FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX idx_communication_logs_student_id ON communication_logs(student_id);
CREATE INDEX idx_communication_logs_status ON communication_logs(status);
CREATE INDEX idx_communication_logs_sent_at ON communication_logs(sent_at DESC);
CREATE INDEX idx_communication_logs_created_at ON communication_logs(created_at DESC);
CREATE INDEX idx_communication_logs_phone ON communication_logs(phone);

-- Optional: Add audit log trigger
CREATE OR REPLACE FUNCTION update_communication_logs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER communication_logs_update_trigger
BEFORE UPDATE ON communication_logs
FOR EACH ROW
EXECUTE FUNCTION update_communication_logs_timestamp();

-- ============================================
-- Optional: Communication Templates Table
-- ============================================

CREATE TABLE communication_templates (
  id BIGSERIAL PRIMARY KEY,
  
  -- Template details
  template_name VARCHAR(255) NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- 'announcement', 'reminder', 'homework', 'fees'
  template_body TEXT NOT NULL,
  
  -- Usage info
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sample templates
INSERT INTO communication_templates (template_name, message_type, template_body) VALUES
  ('Class Announcement', 'announcement', 'Dear Parent, {message}'),
  ('Fee Reminder', 'fees', 'Dear Parent, ₹{amount} fee is pending for {student_name} in {batch_name}. Please arrange payment at the earliest.'),
  ('Homework Notification', 'homework', 'Homework for {student_name}: {message}'),
  ('Event Reminder', 'reminder', 'Reminder: {message}');

-- ============================================
-- How to Setup in Supabase:
-- ============================================

-- 1. Enable Row Level Security (RLS) for security
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;

-- 2. Create policies (if using Supabase Auth)
-- Allow teachers to view communication logs
-- CREATE POLICY "Teachers can view communication logs"
--   ON communication_logs FOR SELECT
--   USING (auth.uid() = (SELECT user_id FROM teacher_accounts WHERE user_id = auth.uid()));

-- 3. Grant table access
-- GRANT SELECT, INSERT, UPDATE ON communication_logs TO authenticated;
-- GRANT SELECT ON communication_templates TO authenticated;

-- ============================================
-- Queries for frontend/backend:
-- ============================================

-- View recent send history
-- SELECT * FROM communication_logs 
-- ORDER BY sent_at DESC 
-- LIMIT 20;

-- Count messages by status
-- SELECT status, COUNT(*) as count 
-- FROM communication_logs 
-- GROUP BY status;

-- Check message delivery rate for a batch
-- SELECT 
--   s.batch_id,
--   COUNT(*) as total_messages,
--   SUM(CASE WHEN cl.status = 'delivered' THEN 1 ELSE 0 END) as delivered,
--   ROUND(SUM(CASE WHEN cl.status = 'delivered' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) as delivery_rate
-- FROM communication_logs cl
-- JOIN student s ON cl.student_id = s.student_id
-- WHERE cl.sent_at >= NOW() - INTERVAL '7 days'
-- GROUP BY s.batch_id;

-- Failed messages needing retry
-- SELECT * FROM communication_logs 
-- WHERE status = 'failed' 
-- AND sent_at >= NOW() - INTERVAL '1 day'
-- ORDER BY sent_at DESC;

-- ============================================
-- Cleanup/Maintenance Queries:
-- ============================================

-- Archive old logs (keep last 6 months)
-- DELETE FROM communication_logs 
-- WHERE sent_at < NOW() - INTERVAL '6 months';

-- Update delivery status (run periodically)
-- UPDATE communication_logs 
-- SET status = 'delivered' 
-- WHERE status = 'sent' 
-- AND sent_at < NOW() - INTERVAL '1 hour';
