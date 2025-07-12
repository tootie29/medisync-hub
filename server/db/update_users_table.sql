-- Add course field to existing users table
ALTER TABLE users ADD COLUMN course VARCHAR(100) AFTER department;

-- Optional: Update existing student records with sample course data
-- You can customize these based on your actual student data
UPDATE users SET course = 'Computer Science' WHERE role = 'student' AND student_id IS NOT NULL AND course IS NULL LIMIT 1;
UPDATE users SET course = 'Information Technology' WHERE role = 'student' AND student_id IS NOT NULL AND course IS NULL LIMIT 1;
UPDATE users SET course = 'Business Administration' WHERE role = 'student' AND student_id IS NOT NULL AND course IS NULL LIMIT 1;

-- Verify the changes
SELECT id, name, role, student_id, department, course, faculty FROM users WHERE role = 'student';