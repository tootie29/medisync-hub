
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
  idleTimeout: 60000
});

// Test database connection with retry mechanism
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
