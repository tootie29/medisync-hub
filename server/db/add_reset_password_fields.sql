
-- Add reset password columns to the users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP DEFAULT NULL;

-- Show that the operation was completed successfully
SELECT 'Reset password columns added successfully' as result;
