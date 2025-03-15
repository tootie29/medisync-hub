
const mysql = require('mysql2/promise');
require('dotenv').config();

// Log the database configuration (without passwords)
console.log('Database configuration:');
console.log('- Host:', process.env.DB_HOST || 'localhost');
console.log('- User:', process.env.DB_USER || 'root');
console.log('- Database:', process.env.DB_NAME || 'medi_hub');

// Create connection pool with enhanced configuration for cPanel
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medi_hub',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 15000, // Increased timeout for slower connections
  acquireTimeout: 15000,
  // Add retry strategy
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // In case of connection issues
  maxIdle: 5, 
  idleTimeout: 60000,
  // Debug connection issues
  debug: process.env.NODE_ENV !== 'production' && process.env.DB_DEBUG === 'true'
});

// Test database connection with retry mechanism and more detailed logging
async function testConnection() {
  try {
    console.log('Attempting database connection...');
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    
    // Get server information to confirm proper connection
    try {
      const [rows] = await connection.query('SELECT VERSION() as version');
      console.log(`MySQL Version: ${rows[0].version}`);
      console.log('Database connection verified with query');
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
          break;
        case 'ER_BAD_DB_ERROR':
          console.error('Database does not exist - check DB_NAME in your .env file');
          break;
        case 'ETIMEDOUT':
          console.error('Connection timeout - MySQL server may be too slow to respond');
          break;
        case 'ENOTFOUND':
          console.error('Host not found - check DB_HOST in your .env file');
          break;
        default:
          console.error('Check your MySQL server configuration and .env file');
      }
      
      // Add specific guidance for cPanel 
      if (process.env.NODE_ENV === 'production') {
        console.error('For cPanel hosting, ensure:');
        console.error('1. The database has been created in cPanel MySQL Databases');
        console.error('2. DB_USER has appropriate privileges');
        console.error('3. Remote MySQL connections are enabled if needed');
      }
    }
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
