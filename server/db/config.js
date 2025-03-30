
const mysql = require('mysql2/promise');
require('dotenv').config();

// Simplified pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medi_hub',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '2', 10),
  queueLimit: 0,
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000', 10),
  debug: process.env.DB_DEBUG === 'true'
});

// Basic test connection function
async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log(`Connection details: ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}`);
    
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
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
          console.error('Check your MySQL server configuration and .env file');
      }
    }
    
    return false;
  }
}

// Simplified test connection method
async function createTestConnection() {
  try {
    const testPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'medi_hub',
      waitForConnections: true,
      connectionLimit: 1,
      connectTimeout: 10000
    });
    
    const conn = await testPool.getConnection();
    console.log('Test connection successful');
    conn.release();
    await testPool.end();
    return true;
  } catch (err) {
    console.error('Test connection failed:', err.message);
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
  createTestConnection,
  pingDatabase
};
