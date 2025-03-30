
/**
 * Simplified Database Health Check Utility
 * Run with: node server/utils/dbHealthCheck.js
 */

const { pool, testConnection } = require('../db/config');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkDatabaseHealth() {
  console.log('=== DATABASE HEALTH CHECK ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  console.log('Testing database connection...');
  const connected = await testConnection();
  
  if (connected) {
    console.log('\n✅ Database connection successful!');
  } else {
    console.log('\n❌ Database connection failed.');
    console.log('Please check your database configuration in the .env file.');
  }
  
  console.log('\n=== HEALTH CHECK COMPLETE ===');
  
  // Close the pool when done
  try {
    await pool.end();
    console.log('Database pool closed.');
  } catch (err) {
    console.error('Error closing database pool:', err.message);
  }
  
  // Exit with appropriate code
  process.exit(connected ? 0 : 1);
}

// Run the health check
checkDatabaseHealth().catch(err => {
  console.error('Unexpected error during health check:', err);
  process.exit(1);
});
