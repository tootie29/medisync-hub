
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

// Update a logo with better error handling and guaranteed update
exports.updateLogo = async (logo) => {
  console.log(`Model: Processing logo update for position: ${logo.position}`, logo);
  
  if (!logo.url || !logo.position) {
    throw new Error('Logo URL and position are required');
  }
  
  // Use a transaction for data integrity
  const connection = await db.getConnection();
  let logoId;
  
  try {
    await connection.beginTransaction();
    console.log(`Model: Started transaction for logo position ${logo.position}`);
    
    // First check if a logo for this position already exists
    const [existingLogos] = await connection.query(
      'SELECT * FROM logos WHERE position = ?',
      [logo.position]
    );
    
    console.log(`Model: Check for existing ${logo.position} logo returned:`, existingLogos);
    
    if (existingLogos.length > 0) {
      // Update existing logo
      console.log(`Model: Updating existing logo for position ${logo.position}`);
      logoId = existingLogos[0].id;
      
      // First try updating
      const [result] = await connection.query(
        'UPDATE logos SET url = ?, updated_at = NOW() WHERE id = ?',
        [logo.url, logoId]
      );
      console.log(`Model: Updated logo with ID: ${logoId}, Affected rows:`, result.affectedRows);
      
      // If update fails, force a delete and insert
      if (result.affectedRows === 0) {
        console.log(`Model: Update failed, forcing delete and insert for position ${logo.position}`);
        
        // Delete the potentially corrupted record
        await connection.query('DELETE FROM logos WHERE position = ?', [logo.position]);
        
        // Insert with the same ID
        const [insertResult] = await connection.query(
          'INSERT INTO logos (id, url, position, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [logoId, logo.url, logo.position]
        );
        console.log(`Model: Forced insert result:`, insertResult);
        
        if (insertResult.affectedRows === 0) {
          throw new Error(`Failed to update logo for position ${logo.position}`);
        }
      }
    } else {
      // Insert new logo
      console.log(`Model: Creating new logo for position ${logo.position}`);
      logoId = logo.id || uuidv4();
      
      const [result] = await connection.query(
        'INSERT INTO logos (id, url, position, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [logoId, logo.url, logo.position]
      );
      console.log(`Model: Created new logo with ID: ${logoId}, Result:`, result);
      
      if (result.affectedRows === 0) {
        throw new Error(`Failed to insert logo for position ${logo.position}`);
      }
    }
    
    // Verify the logo exists in database before committing
    const [verifyRows] = await connection.query(
      'SELECT * FROM logos WHERE position = ? AND url = ?',
      [logo.position, logo.url]
    );
    
    if (verifyRows.length === 0) {
      throw new Error(`Verification failed - no logo found for position ${logo.position} after update`);
    }
    
    await connection.commit();
    console.log(`Model: Transaction committed successfully for logo position ${logo.position}`);
    
    return logoId;
  } catch (error) {
    console.error('Database error in updateLogo:', error);
    
    // Try to rollback the transaction
    try {
      await connection.rollback();
      console.log(`Model: Transaction rolled back for logo position ${logo.position}`);
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }
    
    throw new Error(`Failed to update logo in database: ${error.message}`);
  } finally {
    connection.release();
    console.log(`Model: Released database connection for logo position ${logo.position}`);
  }
};
