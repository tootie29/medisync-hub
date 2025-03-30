
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
    
    if (!logo.url || !logo.position) {
      throw new Error('Logo URL and position are required');
    }
    
    // First check if a logo for this position already exists
    const [existingLogos] = await db.query(
      'SELECT * FROM logos WHERE position = ?',
      [logo.position]
    );
    
    console.log(`Model: Check for existing ${logo.position} logo returned:`, existingLogos);
    
    let logoId;
    
    if (existingLogos.length > 0) {
      // Update existing logo - explicitly set the URL to ensure update
      console.log(`Model: Updating existing logo for position ${logo.position}`);
      const [result] = await db.query(
        'UPDATE logos SET url = ? WHERE position = ?',
        [logo.url, logo.position]
      );
      console.log(`Model: Updated logo with ID: ${existingLogos[0].id}, Result:`, result);
      
      logoId = existingLogos[0].id;
      
      // If no rows were affected, force an insert
      if (result.affectedRows === 0) {
        console.warn(`Model: Update failed for logo position ${logo.position}, forcing insert`);
        logoId = uuidv4();
        const [insertResult] = await db.query(
          'INSERT INTO logos (id, url, position, created_at) VALUES (?, ?, ?, NOW())',
          [logoId, logo.url, logo.position]
        );
        console.log(`Model: Forced insert with ID: ${logoId}, Result:`, insertResult);
      }
    } else {
      // Insert new logo
      console.log(`Model: Creating new logo for position ${logo.position}`);
      logoId = logo.id || uuidv4();
      
      try {
        const [result] = await db.query(
          'INSERT INTO logos (id, url, position, created_at) VALUES (?, ?, ?, NOW())',
          [logoId, logo.url, logo.position]
        );
        console.log(`Model: Created new logo with ID: ${logoId}, Result:`, result);
        
        // Check if the insert was successful
        if (result.affectedRows === 0) {
          throw new Error('Insert operation failed - no rows affected');
        }
      } catch (insertError) {
        console.error(`Model: Error inserting logo:`, insertError);
        throw new Error(`Failed to insert logo: ${insertError.message}`);
      }
    }
    
    // Verify the update/insert occurred
    const [verifyRows] = await db.query(
      'SELECT * FROM logos WHERE position = ?',
      [logo.position]
    );
    
    if (verifyRows.length === 0) {
      console.error(`Model: Verification failed - no logo found for position ${logo.position} after update`);
      throw new Error(`Failed to update logo in database: Verification failed`);
    }
    
    console.log(`Model: Verification successful - logo for position ${logo.position}:`, verifyRows[0]);
    
    return logoId;
  } catch (error) {
    console.error('Database error in updateLogo:', error);
    throw new Error(`Failed to update logo in database: ${error.message}`);
  }
};
