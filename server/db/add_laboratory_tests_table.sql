-- Add laboratory tests table to store medical lab results
USE medi_hub;

-- Laboratory tests table
CREATE TABLE IF NOT EXISTS laboratory_tests (
  id VARCHAR(36) PRIMARY KEY,
  medical_record_id VARCHAR(36) NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  test_date DATE NOT NULL,
  result TEXT NOT NULL,
  normal_range VARCHAR(255),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add index for better query performance
CREATE INDEX idx_laboratory_tests_medical_record ON laboratory_tests(medical_record_id);
CREATE INDEX idx_laboratory_tests_test_name ON laboratory_tests(test_name);
CREATE INDEX idx_laboratory_tests_test_date ON laboratory_tests(test_date);