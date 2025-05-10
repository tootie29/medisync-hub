
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool with more resilient settings
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medi_hub',
  waitForConnections: true,
  connectionLimit: 3,  // Reduce connection limit to avoid overwhelming the server
  queueLimit: 5,       // Queue at most 5 connection requests
  connectTimeout: 60000, // 60 seconds timeout for connection
  // Removed invalid options: acquireTimeout and timeout
  // Add enhanced retry strategy
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000, // 30 seconds
  // Debug only when explicitly enabled
  debug: process.env.DB_DEBUG === 'true'
});

// Improved connection test function with detailed error logging
async function testConnection() {
  let connection;
  try {
    console.log('Testing database connection...');
    connection = await pool.getConnection();
    console.log('Database connected successfully!');
    
    // Get server information
    const [rows] = await connection.query('SELECT VERSION() as version');
    console.log(`MySQL Version: ${rows[0].version}`);
    
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    
    // More detailed error information
    if (error.code) {
      console.error('Error code:', error.code);
      
      // Common error codes and remediation instructions
      if (error.code === 'ECONNREFUSED') {
        console.error('Could not connect to the MySQL server. Please check that:');
        console.error('1. MySQL is running');
        console.error(`2. It's accessible at ${process.env.DB_HOST}`);
        console.error('3. The port is correct (default is 3306)');
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('Access denied. Check your username and password in the .env file');
      } else if (error.code === 'ER_BAD_DB_ERROR') {
        console.error(`Database '${process.env.DB_NAME}' does not exist. Create it first.`);
      } else if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Connection lost. The server closed the connection.');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('Connection timed out. Check network connectivity and firewall settings.');
      }
    }
    
    if (error.errno) {
      console.error('Error number:', error.errno);
    }
    
    if (error.sqlState) {
      console.error('SQL state:', error.sqlState);
    }
    
    if (error.sqlMessage) {
      console.error('SQL message:', error.sqlMessage);
    }
    
    return false;
  } finally {
    if (connection) {
      connection.release();
      console.log('Database connection released');
    }
  }
}

// Export a function to execute queries with automatic reconnection
async function executeQuery(query, params = []) {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      const [results] = await pool.execute(query, params);
      return results;
    } catch (error) {
      attempts++;
      console.error(`Query error (attempt ${attempts}/${maxAttempts}):`, error.message);
      
      // If we've reached max attempts, throw the error
      if (attempts >= maxAttempts) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s...
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = {
  pool,
  testConnection,
  executeQuery
};
