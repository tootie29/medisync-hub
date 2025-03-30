
const mysql = require('mysql2/promise');
require('dotenv').config();

// Log the database configuration (without passwords)
console.log('Database configuration:');
console.log('- Host:', process.env.DB_HOST || 'localhost');
console.log('- User:', process.env.DB_USER || 'root');
console.log('- Database:', process.env.DB_NAME || 'medi_hub');
console.log('- Debug:', process.env.DB_DEBUG === 'true' ? 'enabled' : 'disabled');

// Create connection pool with enhanced configuration for cPanel
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medi_hub',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000, // Increased timeout for slower connections
  // Add retry strategy
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // In case of connection issues
  maxIdle: 5, 
  idleTimeout: 60000,
  // Debug connection issues - modified to use DB_DEBUG env var
  debug: process.env.DB_DEBUG === 'true'
});

// Test database connection with retry mechanism and more detailed logging
async function testConnection() {
  try {
    console.log('Attempting database connection...');
    console.log(`Connection details: ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}`);
    
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    
    // Get server information to confirm proper connection
    try {
      const [rows] = await connection.query('SELECT VERSION() as version');
      console.log(`MySQL Version: ${rows[0].version}`);
      console.log('Database connection verified with query');
      
      // Additional test: Try to see if tables exist
      try {
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Database tables:', tables.map(t => Object.values(t)[0]).join(', '));
        
        // Check for specific tables
        const expectedTables = ['users', 'medical_records', 'appointments', 'medicines', 'logos'];
        const foundTables = tables.map(t => Object.values(t)[0]);
        
        const missingTables = expectedTables.filter(table => !foundTables.includes(table));
        if (missingTables.length > 0) {
          console.warn('Warning: Some expected tables are missing:', missingTables.join(', '));
          
          // Check specifically for logos table
          if (missingTables.includes('logos')) {
            console.warn('The logos table is missing. This will affect logo upload functionality.');
            console.warn('Consider running the database schema setup script from server/db/schema.sql');
          }
        }
      } catch (tableError) {
        console.error('Failed to query tables:', tableError.message);
      }
    } catch (queryError) {
      console.error('Connected but query failed:', queryError.message);
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    // More detailed error information
    if (error.code) {
      console.error('Error code:', error.code);
      
      switch(error.code) {
        case 'ECONNREFUSED':
          console.error('MySQL server is not running or is unreachable');
          break;
        case 'ER_ACCESS_DENIED_ERROR':
          console.error('Invalid database credentials - check DB_USER and DB_PASSWORD in your .env file');
          console.error('Attempted with user:', process.env.DB_USER);
          break;
        case 'ER_BAD_DB_ERROR':
          console.error('Database does not exist - check DB_NAME in your .env file');
          console.error('Attempted database name:', process.env.DB_NAME);
          console.error('You may need to create this database in your cPanel MySQL Databases section');
          break;
        case 'ETIMEDOUT':
          console.error('Connection timeout - MySQL server may be too slow to respond');
          break;
        case 'ENOTFOUND':
          console.error('Host not found - check DB_HOST in your .env file');
          console.error('Attempted host:', process.env.DB_HOST);
          break;
        default:
          console.error('Check your MySQL server configuration and .env file');
      }
      
      // Add specific guidance for cPanel 
      if (process.env.NODE_ENV === 'production') {
        console.error('For cPanel hosting, ensure:');
        console.error('1. The database has been created in cPanel MySQL Databases');
        console.error('2. The user specified in DB_USER has been created and assigned to the database');
        console.error('3. DB_USER has appropriate privileges (ALL PRIVILEGES) on the database');
        console.error('4. Remote MySQL connections are enabled if not using localhost');
        console.error('5. If using localhost, ensure PHP and Node.js applications are on the same server');
      }
    }
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
