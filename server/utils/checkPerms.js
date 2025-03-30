
/**
 * Permission check and fix utility
 * Run with: node server/utils/checkPerms.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const { promisify } = require('util');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Get user information
function getCurrentUser() {
  try {
    const user = execSync('whoami').toString().trim();
    console.log(`Current user: ${user}`);
    return user;
  } catch (error) {
    console.log('Could not determine current user');
    return 'unknown';
  }
}

// Get process info
function getProcessInfo() {
  try {
    const processUser = process.getuid ? process.getuid() : 'N/A';
    const processGid = process.getgid ? process.getgid() : 'N/A';
    console.log(`Process UID: ${processUser}, GID: ${processGid}`);
    return { uid: processUser, gid: processGid };
  } catch (error) {
    console.log('Could not determine process info');
    return { uid: 'unknown', gid: 'unknown' };
  }
}

// Get directory user/group
function getDirOwnership(dir) {
  try {
    const stats = fs.statSync(dir);
    return { uid: stats.uid, gid: stats.gid };
  } catch (error) {
    console.log(`Error checking ownership of ${dir}: ${error.message}`);
    return { uid: 'unknown', gid: 'unknown' };
  }
}

// Directory check and fix function
async function checkAndFixDirectory(directory) {
  console.log(`\nChecking directory: ${directory}`);
  
  try {
    // Check if directory exists
    if (!fs.existsSync(directory)) {
      console.log(`Directory does not exist: ${directory}`);
      console.log('Creating directory...');
      
      try {
        fs.mkdirSync(directory, { recursive: true, mode: 0o777 });
        console.log(`Created directory: ${directory}`);
      } catch (mkdirErr) {
        console.error(`FAILED to create directory: ${mkdirErr.message}`);
        return false;
      }
    }
    
    // Get ownership info
    const ownership = getDirOwnership(directory);
    console.log(`Directory owner: UID=${ownership.uid}, GID=${ownership.gid}`);
    
    // Check permissions
    const stats = fs.statSync(directory);
    const currentMode = stats.mode;
    const octalMode = '0' + (stats.mode & 0o777).toString(8);
    console.log(`Current permissions: ${octalMode}`);
    
    // Try to make directory writable
    try {
      console.log('Setting directory to 777 permissions...');
      fs.chmodSync(directory, 0o777); // rwxrwxrwx - wide open for testing
      console.log('Permissions updated');
      
      // Verify the change
      const newStats = fs.statSync(directory);
      const newOctalMode = '0' + (newStats.mode & 0o777).toString(8);
      console.log(`New permissions: ${newOctalMode}`);
      
      if ((newStats.mode & 0o777) !== 0o777) {
        console.log('WARNING: Could not set full 777 permissions');
      }
    } catch (chmodErr) {
      console.error(`FAILED to change permissions: ${chmodErr.message}`);
    }
    
    // Test write access
    const testFile = path.join(directory, 'test-write-' + Date.now() + '.txt');
    try {
      console.log(`Testing write access with file: ${testFile}`);
      fs.writeFileSync(testFile, 'Test write access');
      console.log('✅ Successfully wrote test file');
      
      // Clean up test file
      fs.unlinkSync(testFile);
      console.log('Test file removed');
      
      return true;
    } catch (writeErr) {
      console.error(`❌ FAILED to write test file: ${writeErr.message}`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking directory ${directory}: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('=== DIRECTORY PERMISSION CHECK UTILITY ===');
  console.log(`Time: ${new Date().toISOString()}`);
  
  // Get user and process info
  getCurrentUser();
  getProcessInfo();
  
  // Determine base directory
  const isProduction = process.env.NODE_ENV === 'production';
  const baseDir = process.env.UPLOAD_BASE_DIR || 
                  (isProduction ? '/home/entrsolu/api.climasys.entrsolutions.com' : path.join(__dirname, '../../'));
  
  console.log(`\nBase directory: ${baseDir}`);
  
  // Define directory structure
  const directories = [
    baseDir,
    path.join(baseDir, 'uploads'),
    path.join(baseDir, 'uploads/assets'),
    path.join(baseDir, 'uploads/assets/logos')
  ];
  
  // Check each directory
  for (const dir of directories) {
    const success = await checkAndFixDirectory(dir);
    
    if (!success) {
      console.log(`\nFailed to verify permissions for: ${dir}`);
      console.log('\nPOSSIBLE SOLUTIONS:');
      console.log('1. Manually set permissions on the server:');
      console.log(`   chmod -R 777 ${dir}`);
      console.log('2. Check ownership:');
      console.log(`   chown -R [cPanel username]:nobody ${dir}`);
    }
  }
  
  console.log('\n=== DIRECTORY CHECKS COMPLETE ===');
}

// Run the main function
main().catch(console.error);
