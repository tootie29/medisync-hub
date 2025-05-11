
-- This script adds the new columns to the medical_records table
-- and creates the foreign key relationship after the appointments table exists

USE medi_hub;

-- Add new columns if they don't exist
ALTER TABLE medical_records 
ADD COLUMN IF NOT EXISTS type VARCHAR(100),
ADD COLUMN IF NOT EXISTS appointment_id VARCHAR(36);

-- Add foreign key constraint if it doesn't exist
-- First check if constraint exists to avoid errors
SET @constraint_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = 'medi_hub'
  AND TABLE_NAME = 'medical_records'
  AND REFERENCED_TABLE_NAME = 'appointments'
  AND CONSTRAINT_NAME = 'medical_records_appointment_id_fkey'
);

-- Add the constraint only if it doesn't exist
SET @sql = IF(@constraint_exists = 0,
  'ALTER TABLE medical_records ADD CONSTRAINT medical_records_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT "Foreign key constraint already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update appointments status enum to include 'in-progress' if needed
SET @column_type = (
  SELECT COLUMN_TYPE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'medi_hub'
  AND TABLE_NAME = 'appointments'
  AND COLUMN_NAME = 'status'
);

-- Check if the enum already includes 'in-progress'
SET @sql = IF(@column_type NOT LIKE '%in-progress%',
  "ALTER TABLE appointments MODIFY COLUMN status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'in-progress') NOT NULL",
  'SELECT "Status enum already includes in-progress" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
