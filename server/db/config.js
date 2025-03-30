
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool with conservative settings for stability
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medi_hub',
  waitForConnections: true,
  connectionLimit: 5,  // Lower connection limit to avoid overwhelming the server
  queueLimit: 0,
  connectTimeout: 30000, // 30 seconds timeout
  // Add basic retry strategy
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // Debug only when explicitly enabled
  debug: process.env.DB_DEBUG === 'true'
});

// Simplified test connection function
async function testConnection() {
  try {
    console.log('Testing database connection...');
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    
    // Get server information
    const [rows] = await connection.query('SELECT VERSION() as version');
    console.log(`MySQL Version: ${rows[0].version}`);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
