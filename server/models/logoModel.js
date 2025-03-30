
const { pool, executeQuery } = require('../db/config');
const { v4: uuidv4 } = require('uuid');

// Get all logos with improved error handling
exports.getAllLogos = async () => {
  try {
    console.log('Model: Fetching all logos from database');
    const rows = await executeQuery('SELECT * FROM logos');
    console.log('Model: Fetched logos:', rows);
    return rows;
  } catch (error) {
    console.error('Database error in getAllLogos:', error);
    // Return empty array instead of throwing to prevent crashes
    return [];
  }
};

// Get logo by position with improved error handling
exports.getLogoByPosition = async (position) => {
  try {
    console.log(`Model: Fetching logo for position: ${position}`);
    const rows = await executeQuery(
      'SELECT * FROM logos WHERE position = ?',
      [position]
    );
    
    console.log(`Model: Fetched logo for position ${position}:`, rows[0] || 'No logo found');
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(`Database error in getLogoByPosition(${position}):`, error);
    return null;
  }
};

// Update a logo with simplified transaction handling
exports.updateLogo = async (logo) => {
  console.log(`Model: Processing logo update for position: ${logo.position}`, logo);
  
  if (!logo.url || !logo.position) {
    throw new Error('Logo URL and position are required');
  }
  
  let connection;
  let logoId = logo.id || uuidv4();
  
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    
    // Start transaction
    await connection.beginTransaction();
    console.log(`Model: Started transaction for logo position ${logo.position}`);
    
    // Check if a logo for this position already exists
    const [existingLogos] = await connection.query(
      'SELECT * FROM logos WHERE position = ?',
      [logo.position]
    );
    
    console.log(`Model: Check for existing ${logo.position} logo returned:`, existingLogos);
    
    // Use a simplified approach - delete and insert
    // This reduces complexity and potential for errors
    
    // Delete existing logo for this position if it exists
    await connection.query('DELETE FROM logos WHERE position = ?', [logo.position]);
    console.log(`Model: Deleted any existing logos for position ${logo.position}`);
    
    // Insert the new logo
    const [insertResult] = await connection.query(
      'INSERT INTO logos (id, url, position, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [logoId, logo.url, logo.position]
    );
    
    console.log(`Model: Inserted new logo with ID: ${logoId}, Result:`, insertResult);
    
    // Check if the insert actually worked
    if (insertResult.affectedRows === 0) {
      throw new Error(`Failed to insert logo for position ${logo.position}`);
    }
    
    // Commit the transaction
    await connection.commit();
    console.log(`Model: Transaction committed successfully for logo position ${logo.position}`);
    
    return logoId;
  } catch (error) {
    console.error('Database error in updateLogo:', error);
    
    // Try to rollback the transaction
    if (connection) {
      try {
        await connection.rollback();
        console.log(`Model: Transaction rolled back for logo position ${logo.position}`);
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    throw new Error(`Failed to update logo in database: ${error.message}`);
  } finally {
    // Always release the connection
    if (connection) {
      connection.release();
      console.log(`Model: Released database connection for logo position ${logo.position}`);
    }
  }
};
