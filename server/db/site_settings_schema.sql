
-- Site Settings Schema

-- Create the database if it doesn't exist
USE medi_hub;

-- Logos table with updated paths
CREATE TABLE IF NOT EXISTS logos (
  id VARCHAR(36) PRIMARY KEY,
  url VARCHAR(255) NOT NULL,
  position ENUM('primary', 'secondary') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default logos with professional paths
REPLACE INTO logos (id, url, position) 
VALUES 
('1', '/uploads/assets/logos/default-logo.png', 'primary'),
('2', '/uploads/assets/logos/default-logo.png', 'secondary');

-- Site settings table for additional clinic configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id VARCHAR(36) PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type ENUM('text', 'number', 'boolean', 'json', 'color') NOT NULL DEFAULT 'text',
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default site settings
INSERT INTO site_settings (id, setting_key, setting_value, setting_type, description, category, is_public)
VALUES
('1', 'site_name', 'Olivarez Clinic', 'text', 'Name of the clinic', 'general', TRUE),
('2', 'site_tagline', 'Health at Your Fingertips', 'text', 'Tagline of the clinic', 'general', TRUE),
('3', 'primary_color', '#10b981', 'color', 'Primary brand color', 'appearance', TRUE),
('4', 'secondary_color', '#059669', 'color', 'Secondary brand color', 'appearance', TRUE),
('5', 'accent_color', '#047857', 'color', 'Accent brand color', 'appearance', TRUE),
('6', 'show_appointment_reminders', 'true', 'boolean', 'Show appointment reminders', 'notifications', FALSE),
('7', 'appointment_reminder_hours', '24', 'number', 'Hours before appointment to send reminder', 'notifications', FALSE),
('8', 'clinic_contact_info', '{"phone": "+123456789", "email": "contact@olivarezclinic.com", "address": "123 Medical Avenue"}', 'json', 'Clinic contact information', 'contact', TRUE),
('9', 'clinic_hours', '{"monday": "8:00-17:00", "tuesday": "8:00-17:00", "wednesday": "8:00-17:00", "thursday": "8:00-17:00", "friday": "8:00-17:00", "saturday": "8:00-12:00", "sunday": "Closed"}', 'json', 'Clinic operating hours', 'general', TRUE);
