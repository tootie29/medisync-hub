
-- Create the database
CREATE DATABASE IF NOT EXISTS medi_hub;
USE medi_hub;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role ENUM('student', 'staff', 'doctor', 'admin') NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  address TEXT,
  emergency_contact TEXT,
  student_id VARCHAR(50),
  department VARCHAR(100),
  staff_id VARCHAR(50),
  position VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Medical records table
CREATE TABLE IF NOT EXISTS medical_records (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  doctor_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  height DECIMAL(5,2) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  bmi DECIMAL(4,2) NOT NULL,
  blood_pressure VARCHAR(20),
  temperature DECIMAL(3,1),
  diagnosis TEXT,
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (doctor_id) REFERENCES users(id)
);

-- Medications for medical records
CREATE TABLE IF NOT EXISTS medications (
  id VARCHAR(36) PRIMARY KEY,
  medical_record_id VARCHAR(36) NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE
);

-- Vital signs table
CREATE TABLE IF NOT EXISTS vital_signs (
  id VARCHAR(36) PRIMARY KEY,
  medical_record_id VARCHAR(36) NOT NULL,
  heart_rate INT,
  blood_pressure VARCHAR(20),
  blood_glucose INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  doctor_id VARCHAR(36),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (doctor_id) REFERENCES users(id)
);

-- Medicines inventory table
CREATE TABLE IF NOT EXISTS medicines (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  threshold INT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  description TEXT,
  dosage VARCHAR(100),
  expiry_date DATE,
  supplier VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data for users
INSERT INTO users (id, email, name, role, phone, date_of_birth, gender, address, emergency_contact)
VALUES
('1', 'admin@example.com', 'Admin User', 'admin', '123-456-7890', '1980-01-01', 'male', '123 Admin St', 'Jane Admin: 123-456-7890'),
('2', 'doctor@example.com', 'Dr. Smith', 'doctor', '123-456-7891', '1975-05-15', 'female', '456 Doctor Ave', 'John Smith: 123-456-7892'),
('3', 'student@example.com', 'John Student', 'student', '123-456-7893', '2000-10-20', 'male', '789 Student Blvd', 'Mary Student: 123-456-7894'),
('4', 'staff@example.com', 'Sarah Staff', 'staff', '123-456-7895', '1990-08-12', 'female', '101 Staff Road', 'Mike Staff: 123-456-7896');

-- Insert sample data for medical_records and vital_signs
INSERT INTO medical_records (id, patient_id, doctor_id, date, height, weight, bmi, blood_pressure, temperature, diagnosis, notes, follow_up_date)
VALUES
('1', '3', '2', '2023-03-15', 175, 70, 22.9, '120/80', 36.6, 'Common cold', 'Patient should rest and drink plenty of fluids.', '2023-03-22'),
('2', '4', '2', '2023-04-10', 165, 65, 23.9, '130/85', 37.2, 'Mild fever', 'Monitor temperature for the next 48 hours.', '2023-04-17');

INSERT INTO medications (id, medical_record_id, medication_name)
VALUES
('1', '1', 'Paracetamol'),
('2', '1', 'Vitamin C'),
('3', '2', 'Ibuprofen');

INSERT INTO vital_signs (id, medical_record_id, heart_rate, blood_pressure, blood_glucose)
VALUES
('1', '1', 72, '120/80', 95),
('2', '2', 78, '130/85', 100);

-- Insert sample data for appointments
INSERT INTO appointments (id, patient_id, doctor_id, date, start_time, end_time, status, reason, notes)
VALUES
('1', '3', '2', '2023-05-20', '10:00', '10:30', 'confirmed', 'Follow-up checkup', 'Bring previous prescription.'),
('2', '4', '2', '2023-05-21', '11:00', '11:30', 'pending', 'Annual physical examination', '');

-- Insert sample data for medicines
INSERT INTO medicines (id, name, category, quantity, threshold, unit, description, dosage, expiry_date, supplier)
VALUES
('1', 'Paracetamol', 'Painkillers', 100, 20, 'tablets', 'Pain reliever and fever reducer', '500mg', '2024-06-30', 'PharmaCorp'),
('2', 'Ibuprofen', 'Anti-inflammatory', 50, 15, 'tablets', 'Non-steroidal anti-inflammatory drug', '400mg', '2024-08-15', 'MediSupply'),
('3', 'Amoxicillin', 'Antibiotics', 30, 10, 'capsules', 'Antibiotic medication', '250mg', '2023-12-31', 'PharmaCorp');
