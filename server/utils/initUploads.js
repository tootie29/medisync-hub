
/**
 * Script to initialize upload directories with proper permissions
 * Run this script with: node server/utils/initUploads.js
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { promisify } = require('util');
const fileUtils = require('./fileUtils');
const { exec } = require('child_process');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Determine if we're in production (cPanel) or development
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

// Get base directory from environment or use default
const baseDir = process.env.UPLOAD_BASE_DIR || 
                (isProduction ? '/home/entrsolu/api.climasys.entrsolutions.com' : path.join(__dirname, '../../'));

console.log(`Using base directory: ${baseDir}`);

// Define directory structure
const directories = [
  path.join(baseDir, 'uploads'),
  path.join(baseDir, 'uploads/assets'),
  path.join(baseDir, 'uploads/assets/logos')
];

// Create test file path
const testFile = path.join(baseDir, 'uploads/assets/logos/test-write.txt');

// Function to get current process user
async function getCurrentUser() {
  try {
    const username = await new Promise((resolve, reject) => {
      exec('whoami', (error, stdout) => {
        if (error) reject(error);
        else resolve(stdout.trim());
      });
    });
    
    console.log(`Current process running as user: ${username}`);
    return username;
  } catch (error) {
    console.error(`Could not determine current user: ${error.message}`);
    return 'unknown';
  }
}

// Function to create directories with proper permissions
async function createDirectories() {
  console.log('Creating upload directories...');
  
  for (const dir of directories) {
    const result = await fileUtils.ensureDirectoryExists(dir);
    
    if (result.success) {
      console.log(`✅ Directory ready: ${dir}`);
      if (result.dirInfo) {
        console.log(`  - Permissions: ${result.dirInfo.permissions}`);
        console.log(`  - Owner: ${result.dirInfo.owner}`);
        console.log(`  - Writable: ${result.dirInfo.isWritable ? 'Yes' : 'No'}`);
      }
    } else {
      console.error(`❌ Failed to prepare directory ${dir}: ${result.error}`);
    }
  }
}

// Function to test write permissions
async function testWritePermissions() {
  try {
    console.log(`Testing write permissions with file: ${testFile}`);
    await promisify(fs.writeFile)(testFile, 'This is a test file to verify write permissions.');
    await fileUtils.ensureFilePermissions(testFile);
    
    const fileInfo = await fileUtils.getFileInfo(testFile);
    console.log('Test file details:');
    console.log(`  - Permissions: ${fileInfo.permissions}`);
    console.log(`  - Owner: ${fileInfo.owner}`);
    console.log(`  - Readable: ${fileInfo.isReadable ? 'Yes' : 'No'}`);
    console.log(`  - Writable: ${fileInfo.isWritable ? 'Yes' : 'No'}`);
    
    console.log('✅ Successfully wrote test file - write permissions are GOOD');
    return true;
  } catch (error) {
    console.error('❌ Failed to write test file:', error);
    console.log('\nPOSSIBLE SOLUTIONS:');
    console.log('1. Run this command to fix permissions:');
    console.log(`   chmod -R 755 ${baseDir}/uploads`);
    console.log('2. Make sure the node process has ownership:');
    console.log(`   chown -R [username]:nobody ${baseDir}/uploads`);
    console.log('3. Check selinux context if applicable:');
    console.log(`   restorecon -R ${baseDir}/uploads`);
    return false;
  }
}

// Function to create a default logo if needed
async function createDefaultLogo() {
  const defaultLogoPath = path.join(baseDir, 'uploads/assets/logos/default-logo.png');
  
  try {
    // Check if default logo exists
    await promisify(fs.access)(defaultLogoPath, fs.constants.F_OK);
    console.log('Default logo already exists');
  } catch (error) {
    // Create a simple placeholder SVG as default logo
    try {
      console.log('Creating default logo...');
      // Simple SVG placeholder
      const placeholderSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect width="200" height="200" fill="#f0f0f0"/>
          <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#888" text-anchor="middle" dominant-baseline="middle">Logo</text>
        </svg>
      `;
      
      // Write to destination
      await promisify(fs.writeFile)(defaultLogoPath, placeholderSvg);
      await fileUtils.ensureFilePermissions(defaultLogoPath);
      console.log('✅ Default logo created successfully');
    } catch (copyError) {
      console.error('❌ Failed to create default logo:', copyError);
    }
  }
}

// Main function
async function main() {
  console.log('=== UPLOAD DIRECTORY INITIALIZATION ===');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Node version: ${process.version}`);
  console.log(`Working directory: ${process.cwd()}`);
  
  // Get current user
  await getCurrentUser();
  
  // Create and check directories
  await createDirectories();
  
  // Test write permissions
  const writeOk = await testWritePermissions();
  
  if (writeOk) {
    await createDefaultLogo();
    
    console.log('\n✅ INITIALIZATION COMPLETE');
    console.log('You can now upload logos in the web application.');
  } else {
    console.log('\n❌ INITIALIZATION FAILED');
    console.log('Please fix the permissions issues before continuing.');
    
    // Detailed diagnostics
    console.log('\n=== DETAILED DIAGNOSTICS ===');
    
    // Check if we can create a file in the server root to test basic write access
    const rootTestFile = path.join(baseDir, 'test-root-write.txt');
    try {
      await promisify(fs.writeFile)(rootTestFile, 'Test');
      console.log(`✅ Can write to server root directory: ${baseDir}`);
      await promisify(fs.unlink)(rootTestFile);
    } catch (e) {
      console.error(`❌ Cannot write to server root directory: ${baseDir}`);
      console.error(`  Error: ${e.message}`);
    }
    
    // Suggest cPanel file permission fixes
    console.log('\nIf you are using cPanel, try these steps:');
    console.log('1. Log in to cPanel');
    console.log('2. Go to File Manager');
    console.log(`3. Navigate to ${baseDir}`);
    console.log('4. Create the "uploads" folder if it doesn\'t exist');
    console.log('5. Right-click on the "uploads" folder and select "Change Permissions"');
    console.log('6. Set permissions to 755 (rwxr-xr-x)');
    console.log('7. Check "Apply to all subdirectories and files"');
    console.log('8. Click "Change Permissions"');
  }
}

// Run the main function
main().catch(console.error);
