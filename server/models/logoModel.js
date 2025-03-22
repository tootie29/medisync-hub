
const db = require('../db/config');
const { v4: uuidv4 } = require('uuid');

// Get all logos
exports.getAllLogos = async () => {
  try {
    const [rows] = await db.query('SELECT * FROM logos');
    return rows;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch logos from database');
  }
};

// Update a logo (replaces existing logo for that position)
exports.updateLogo = async (logo) => {
  try {
    // First check if a logo for this position already exists
    const [existingLogos] = await db.query(
      'SELECT * FROM logos WHERE position = ?',
      [logo.position]
    );
    
    if (existingLogos.length > 0) {
      // Update existing logo
      await db.query(
        'UPDATE logos SET url = ? WHERE position = ?',
        [logo.url, logo.position]
      );
      return existingLogos[0].id;
    } else {
      // Insert new logo
      await db.query(
        'INSERT INTO logos (id, url, position, created_at) VALUES (?, ?, ?, NOW())',
        [logo.id, logo.url, logo.position]
      );
      return logo.id;
    }
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to update logo in database');
  }
};
