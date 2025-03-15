
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool with enhanced configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medi_hub',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  acquireTimeout: 10000,
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
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    
    // Get server information to confirm proper connection
    const [rows] = await connection.query('SELECT VERSION() as version');
    console.log(`MySQL Version: ${rows[0].version}`);
    
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
          console.error('Invalid database credentials');
          break;
        case 'ER_BAD_DB_ERROR':
          console.error('Database does not exist');
          break;
        default:
          console.error('Check your MySQL server and configuration');
      }
    }
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
