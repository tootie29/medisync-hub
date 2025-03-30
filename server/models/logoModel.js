
const db = require('../db/config');
const { v4: uuidv4 } = require('uuid');

// Get all logos
exports.getAllLogos = async () => {
  try {
    console.log('Model: Fetching all logos from database');
    const [rows] = await db.query('SELECT * FROM logos');
    console.log('Model: Fetched logos:', rows);
    return rows;
  } catch (error) {
    console.error('Database error in getAllLogos:', error);
    throw new Error('Failed to fetch logos from database');
  }
};

// Get logo by position
exports.getLogoByPosition = async (position) => {
  try {
    console.log(`Model: Fetching logo for position: ${position}`);
    const [rows] = await db.query(
      'SELECT * FROM logos WHERE position = ?',
      [position]
    );
    
    console.log(`Model: Fetched logo for position ${position}:`, rows[0] || 'No logo found');
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(`Database error in getLogoByPosition(${position}):`, error);
    throw new Error('Failed to fetch logo from database');
  }
};

// Update a logo (replaces existing logo for that position)
exports.updateLogo = async (logo) => {
  try {
    console.log(`Model: Updating logo for position: ${logo.position}`, logo);
    
    // First check if a logo for this position already exists
    const [existingLogos] = await db.query(
      'SELECT * FROM logos WHERE position = ?',
      [logo.position]
    );
    
    if (existingLogos.length > 0) {
      // Update existing logo
      console.log(`Model: Updating existing logo for position ${logo.position}`);
      await db.query(
        'UPDATE logos SET url = ? WHERE position = ?',
        [logo.url, logo.position]
      );
      console.log(`Model: Updated logo with ID: ${existingLogos[0].id}`);
      return existingLogos[0].id;
    } else {
      // Insert new logo
      console.log(`Model: Creating new logo for position ${logo.position}`);
      await db.query(
        'INSERT INTO logos (id, url, position, created_at) VALUES (?, ?, ?, NOW())',
        [logo.id, logo.url, logo.position]
      );
      console.log(`Model: Created new logo with ID: ${logo.id}`);
      return logo.id;
    }
  } catch (error) {
    console.error('Database error in updateLogo:', error);
    throw new Error('Failed to update logo in database');
  }
};
