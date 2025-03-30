
/**
 * Database Health Check Utility
 * This script can be run to test the database connection and diagnose issues
 * 
 * Run with: node server/utils/dbHealthCheck.js
 */

const { pool, testConnection, createTestConnection } = require('../db/config');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkDatabaseHealth() {
  console.log('=== DATABASE HEALTH CHECK ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  
  // First, test the regular pool connection
  console.log('Testing database pool connection...');
  const poolConnected = await testConnection();
  
  // If pool connection fails, try a fresh connection
  if (!poolConnected) {
    console.log('\nTesting with a fresh connection...');
    const freshConnected = await createTestConnection();
    
    if (freshConnected) {
      console.log('\n✅ Fresh connection successful, but pool connection failed.');
      console.log('This suggests the pool may have stale connections.');
      console.log('Recommendation: Restart your Node.js application to refresh the connection pool.');
    } else {
      console.log('\n❌ Both pool and fresh connections failed.');
      console.log('This suggests a fundamental connection issue such as:');
      console.log('- Invalid credentials');
      console.log('- Database server is down or unreachable');
      console.log('- Network connectivity issues');
      console.log('- Firewall blocking connections');
    }
  } else {
    console.log('\n✅ Pool connection successful!');
    console.log('The database appears to be functioning correctly.');
  }
  
  // Run query to check table counts
  if (poolConnected) {
    try {
      console.log('\nChecking table record counts:');
      const tables = ['users', 'medical_records', 'appointments', 'medicines', 'logos'];
      
      for (const table of tables) {
        try {
          const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`- ${table}: ${rows[0].count} records`);
        } catch (err) {
          console.log(`- ${table}: Error - ${err.message}`);
        }
      }
    } catch (err) {
      console.error('Error checking table records:', err.message);
    }
  }
  
  console.log('\n=== HEALTH CHECK COMPLETE ===');
  
  // Always close the pool when done
  try {
    await pool.end();
    console.log('Database pool closed.');
  } catch (err) {
    console.error('Error closing database pool:', err.message);
  }
  
  // Exit with appropriate code
  process.exit(poolConnected ? 0 : 1);
}

// Run the health check
checkDatabaseHealth().catch(err => {
  console.error('Unexpected error during health check:', err);
  process.exit(1);
});
