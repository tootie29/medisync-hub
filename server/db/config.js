
const mysql = require('mysql2/promise');
require('dotenv').config();

// Ultra-simplified pool configuration for stability
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medi_hub',
  waitForConnections: true,
  connectionLimit: 1, // Minimal connection limit for stability
  queueLimit: 0,
  connectTimeout: 5000, // Shorter timeout for faster failure detection
  debug: false // Force debug off for stability
});

// Simplified test connection function
async function testConnection() {
  try {
    console.log('Testing database connection...');
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Simple ping database function
async function pingDatabase() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('Database ping failed:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  pingDatabase
};
