
/**
 * Script to fix permissions for upload directories
 * Run this script from cPanel with: node fixPermissions.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

// Convert to promise-based
const chmod = promisify(fs.chmod);
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Get current user
async function getCurrentUser() {
  return new Promise((resolve) => {
    exec('whoami', (error, stdout) => {
      if (error) {
        console.error(`Error getting current user: ${error.message}`);
        resolve('unknown');
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Base directory path (this will be the api.climasys.entrsolutions.com path in cPanel)
const baseDir = '/home/entrsolu/api.climasys.entrsolutions.com';

// Directories to fix
const directories = [
  '',  // Base directory itself
  'uploads',
  'uploads/assets',
  'uploads/assets/logos'
];

// Fix directories
async function fixDirectories() {
  console.log(`Running as user: ${await getCurrentUser()}`);
  console.log(`Base directory: ${baseDir}`);
  
  for (const dir of directories) {
    const fullPath = path.join(baseDir, dir);
    
    try {
      console.log(`Checking directory: ${fullPath}`);
      
      // Check if directory exists
      try {
        await stat(fullPath);
        console.log(`✅ Directory exists: ${fullPath}`);
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.log(`Creating directory: ${fullPath}`);
          await mkdir(fullPath, { recursive: true, mode: 0o755 });
          console.log(`✅ Created directory: ${fullPath}`);
        } else {
          throw err;
        }
      }
      
      // Set directory permissions
      await chmod(fullPath, 0o755);
      console.log(`✅ Set permissions 755 on directory: ${fullPath}`);
      
      // Try to create a test file
      const testFile = path.join(fullPath, `test-write-${Date.now()}.txt`);
      await writeFile(testFile, 'Test write access');
      console.log(`✅ Successfully wrote test file: ${testFile}`);
      
      // Remove test file
      fs.unlinkSync(testFile);
      console.log(`✅ Removed test file: ${testFile}`);
      
    } catch (error) {
      console.error(`❌ Error fixing directory ${fullPath}:`, error.message);
    }
  }
}

// Check if any existing logos need permission fixes
async function fixExistingFiles() {
  try {
    const logosDir = path.join(baseDir, 'uploads/assets/logos');
    const files = await readdir(logosDir);
    
    console.log(`Fixing permissions for ${files.length} files in logos directory`);
    
    for (const file of files) {
      if (file === '.' || file === '..') continue;
      
      const filePath = path.join(logosDir, file);
      try {
        const stats = await stat(filePath);
        if (stats.isFile()) {
          await chmod(filePath, 0o644);
          console.log(`✅ Fixed permissions for: ${file}`);
        }
      } catch (err) {
        console.error(`❌ Error fixing permissions for ${file}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Error fixing existing files:', error.message);
  }
}

// Run the fix
async function main() {
  console.log('=== Permission Fix Tool ===');
  console.log('Starting permission fixes...');
  
  await fixDirectories();
  await fixExistingFiles();
  
  console.log('\nDone fixing permissions!');
  console.log('---------------------------');
  console.log('If you still have issues:');
  console.log('1. Go to cPanel File Manager');
  console.log(`2. Navigate to: ${baseDir}/uploads`);
  console.log('3. Right-click on the uploads folder');
  console.log('4. Select "Change Permissions"');
  console.log('5. Set to 755 (drwxr-xr-x)');
  console.log('6. Check "Apply to all subdirectories and files"');
  console.log('7. Click "Change Permissions"');
}

main().catch(console.error);
