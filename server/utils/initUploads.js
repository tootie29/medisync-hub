
/**
 * Script to initialize upload directories with proper permissions
 * Run this script with: node server/utils/initUploads.js
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { promisify } = require('util');

// Convert fs methods to Promise-based for better error handling
const mkdir = promisify(fs.mkdir);
const chmod = promisify(fs.chmod);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Determine if we're in production (cPanel) or development
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

// Get base directory from environment or use default
const baseDir = process.env.UPLOAD_BASE_DIR || 
                (isProduction ? '/home/entrsolu' : path.join(__dirname, '../../'));

console.log(`Using base directory: ${baseDir}`);

// Define directory structure
const directories = [
  path.join(baseDir, 'uploads'),
  path.join(baseDir, 'uploads/assets'),
  path.join(baseDir, 'uploads/assets/logos')
];

// Create test file path
const testFile = path.join(baseDir, 'uploads/assets/logos/test-write.txt');

// Function to create directories with proper permissions
async function createDirectories() {
  console.log('Creating upload directories...');
  
  for (const dir of directories) {
    try {
      // Check if directory exists
      await access(dir, fs.constants.F_OK)
        .then(() => console.log(`Directory already exists: ${dir}`))
        .catch(async () => {
          // Create if it doesn't exist
          console.log(`Creating directory: ${dir}`);
          await mkdir(dir, { recursive: true, mode: 0o755 });
        });
      
      // Set permissions regardless
      console.log(`Setting permissions for: ${dir}`);
      await chmod(dir, 0o755); // rwxr-xr-x
      
    } catch (error) {
      console.error(`Error with directory ${dir}:`, error);
    }
  }
}

// Function to test write permissions
async function testWritePermissions() {
  try {
    console.log(`Testing write permissions with file: ${testFile}`);
    await writeFile(testFile, 'This is a test file to verify write permissions.');
    await chmod(testFile, 0o644); // rw-r--r--
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
    await access(defaultLogoPath, fs.constants.F_OK);
    console.log('Default logo already exists');
  } catch (error) {
    // Copy from public directory if it exists
    const sourceLogoPath = path.join(__dirname, '../../public/placeholder.svg');
    
    try {
      console.log('Creating default logo...');
      // Read source file
      const data = await promisify(fs.readFile)(sourceLogoPath);
      // Write to destination
      await promisify(fs.writeFile)(defaultLogoPath, data);
      await chmod(defaultLogoPath, 0o644); // rw-r--r--
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
  
  await createDirectories();
  const writeOk = await testWritePermissions();
  
  if (writeOk) {
    await createDefaultLogo();
    
    console.log('\n✅ INITIALIZATION COMPLETE');
    console.log('You can now upload logos in the web application.');
  } else {
    console.log('\n❌ INITIALIZATION FAILED');
    console.log('Please fix the permissions issues before continuing.');
  }
}

// Run the main function
main().catch(console.error);
