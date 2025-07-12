-- Add course field to users table for students
ALTER TABLE users ADD COLUMN course VARCHAR(100) AFTER department;

-- Update existing student records with sample course data if needed
UPDATE users SET course = 'Computer Science' WHERE role = 'student' AND course IS NULL AND email = 'student@example.com';
UPDATE users SET course = 'Engineering' WHERE role = 'student' AND course IS NULL AND email = 'sample-user1@example.com';
UPDATE users SET course = 'Business Administration' WHERE role = 'student' AND course IS NULL AND email = 'sample-user2@example.com';
UPDATE users SET course = 'Information Technology' WHERE role = 'student' AND course IS NULL AND email = 'sample-user3@example.com';