-- Updated Users table schema with course field
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role ENUM('student', 'staff', 'head nurse', 'admin') NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  address TEXT,
  emergency_contact TEXT,
  student_id VARCHAR(50),
  department VARCHAR(100),
  course VARCHAR(100),  -- NEW FIELD: Course for students
  staff_id VARCHAR(50),
  position VARCHAR(100),
  faculty VARCHAR(100),
  password VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(100),
  token_expiry TIMESTAMP,
  reset_password_token VARCHAR(100),
  reset_token_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- If you already have the users table, use this ALTER statement instead:
-- ALTER TABLE users ADD COLUMN course VARCHAR(100) AFTER department;

-- Update existing records if needed
UPDATE users SET course = 'Computer Science' WHERE role = 'student' AND course IS NULL AND email = 'student@example.com';
UPDATE users SET course = 'Engineering' WHERE role = 'student' AND course IS NULL;