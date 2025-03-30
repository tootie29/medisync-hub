
/**
 * Migration script to update logo paths in the database
 * Run this with: node server/db/migrate_logo_paths.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medi_hub'
};

// Ensure the new directories exist
const newLogoDir = path.join(__dirname, '../uploads/assets/logos');
if (!fs.existsSync(newLogoDir)) {
  fs.mkdirSync(newLogoDir, { recursive: true });
  console.log(`Created directory: ${newLogoDir}`);
}

async function migrateLogoPaths() {
  let connection;
  
  try {
    // Connect to the database
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully.');
    
    // 1. Get all logos from the database
    console.log('Fetching existing logos...');
    const [logos] = await connection.execute('SELECT * FROM logos');
    console.log(`Found ${logos.length} logos.`);
    
    // 2. Create site_settings table if it doesn't exist
    console.log('Creating site_settings table if it doesn\'t exist...');
    await connection.execute(`
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
      )
    `);
    
    // 3. Insert default site settings
    console.log('Adding default site settings...');
    await connection.execute(`
      INSERT IGNORE INTO site_settings (id, setting_key, setting_value, setting_type, description, category, is_public)
      VALUES
      (?, 'site_name', 'Olivarez Clinic', 'text', 'Name of the clinic', 'general', TRUE),
      (?, 'site_tagline', 'Health at Your Fingertips', 'text', 'Tagline of the clinic', 'general', TRUE),
      (?, 'primary_color', '#10b981', 'color', 'Primary brand color', 'appearance', TRUE),
      (?, 'secondary_color', '#059669', 'color', 'Secondary brand color', 'appearance', TRUE),
      (?, 'accent_color', '#047857', 'color', 'Accent brand color', 'appearance', TRUE),
      (?, 'show_appointment_reminders', 'true', 'boolean', 'Show appointment reminders', 'notifications', FALSE),
      (?, 'appointment_reminder_hours', '24', 'number', 'Hours before appointment to send reminder', 'notifications', FALSE),
      (?, 'clinic_contact_info', '{"phone": "+123456789", "email": "contact@olivarezclinic.com", "address": "123 Medical Avenue"}', 'json', 'Clinic contact information', 'contact', TRUE),
      (?, 'clinic_hours', '{"monday": "8:00-17:00", "tuesday": "8:00-17:00", "wednesday": "8:00-17:00", "thursday": "8:00-17:00", "friday": "8:00-17:00", "saturday": "8:00-12:00", "sunday": "Closed"}', 'json', 'Clinic operating hours', 'general', TRUE)
    `, Array(9).fill().map(() => uuidv4()));
    
    // 4. Update logo paths and copy files if needed
    for (const logo of logos) {
      if (logo.url && !logo.url.includes('/uploads/assets/logos/')) {
        const oldPath = logo.url;
        const fileName = path.basename(oldPath);
        const newPath = `/uploads/assets/logos/${fileName}`;
        
        console.log(`Updating logo path: ${oldPath} -> ${newPath}`);
        
        // Update the database
        await connection.execute(
          'UPDATE logos SET url = ? WHERE id = ?',
          [newPath, logo.id]
        );
        
        // Try to copy the file if it exists on the filesystem
        const oldFilePath = path.join(__dirname, '..', oldPath.replace(/^\//, ''));
        const newFilePath = path.join(__dirname, '..', newPath.replace(/^\//, ''));
        
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.copyFileSync(oldFilePath, newFilePath);
            console.log(`Copied file from ${oldFilePath} to ${newFilePath}`);
          } catch (err) {
            console.error(`Error copying file: ${err.message}`);
          }
        } else {
          console.log(`Original file not found: ${oldFilePath}`);
        }
      }
    }
    
    // 5. Ensure default logos exist
    console.log('Ensuring default logos exist...');
    const defaultLogoQueries = [
      'primary', 
      'secondary'
    ].map(position => 
      connection.execute(
        'SELECT COUNT(*) as count FROM logos WHERE position = ?',
        [position]
      ).then(async ([rows]) => {
        if (rows[0].count === 0) {
          console.log(`Creating default ${position} logo...`);
          await connection.execute(
            'INSERT INTO logos (id, url, position) VALUES (?, ?, ?)',
            [uuidv4(), `/uploads/assets/logos/default-logo.png`, position]
          );
        }
      })
    );
    
    await Promise.all(defaultLogoQueries);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the migration
migrateLogoPaths();
