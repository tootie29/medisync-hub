
const db = require('../db/config');
const { v4: uuidv4 } = require('uuid');

// Default settings if none are found in the database
const defaultBrandingSettings = {
  primaryLogo: "/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png",
  secondaryLogo: "/lovable-uploads/72c0d499-9e39-47a1-a868-677102ad3084.png",
  clinicName: "OLIVAREZ CLINIC",
  tagline: "Health at Your Fingertips"
};

// Get branding settings
exports.getBrandingSettings = async () => {
  try {
    const [rows] = await db.query('SELECT * FROM settings WHERE type = "branding" LIMIT 1');
    
    if (rows.length === 0) {
      // If no settings exist, insert the default ones
      const settingsId = uuidv4();
      const settingsJson = JSON.stringify(defaultBrandingSettings);
      
      await db.query(
        'INSERT INTO settings (id, type, settings, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [settingsId, 'branding', settingsJson]
      );
      
      return defaultBrandingSettings;
    }
    
    // Return existing settings
    return JSON.parse(rows[0].settings);
  } catch (error) {
    console.error('Database error when fetching branding settings:', error);
    return defaultBrandingSettings;
  }
};

// Update branding settings
exports.updateBrandingSettings = async (settings) => {
  try {
    const [rows] = await db.query('SELECT * FROM settings WHERE type = "branding" LIMIT 1');
    const settingsJson = JSON.stringify(settings);
    
    if (rows.length === 0) {
      // Insert new settings
      const settingsId = uuidv4();
      await db.query(
        'INSERT INTO settings (id, type, settings, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [settingsId, 'branding', settingsJson]
      );
    } else {
      // Update existing settings
      await db.query(
        'UPDATE settings SET settings = ?, updated_at = NOW() WHERE id = ?',
        [settingsJson, rows[0].id]
      );
    }
    
    return true;
  } catch (error) {
    console.error('Database error when updating branding settings:', error);
    throw error;
  }
};
