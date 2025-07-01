
-- Create vaccinations table
CREATE TABLE IF NOT EXISTS vaccinations (
  id VARCHAR(255) PRIMARY KEY,
  medical_record_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  date_administered DATE NOT NULL,
  dose_number INT DEFAULT 1,
  manufacturer VARCHAR(255) DEFAULT NULL,
  lot_number VARCHAR(255) DEFAULT NULL,
  administered_by VARCHAR(255) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
  INDEX idx_medical_record_id (medical_record_id),
  INDEX idx_vaccination_name (name),
  INDEX idx_date_administered (date_administered)
);
