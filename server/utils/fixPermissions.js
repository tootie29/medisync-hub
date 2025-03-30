
/**
 * Permission fixer utility for upload directories
 * Run with: node utils/fixPermissions.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Convert fs methods to Promises
const mkdir = promisify(fs.mkdir);
const chmod = promisify(fs.chmod);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const execPromise = promisify(exec);

// Determine if we're in production based on environment variable
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

// Get base directory from environment or use default
const baseDir = process.env.UPLOAD_BASE_DIR || 
               (isProduction ? '/home/entrsolu/api.climasys.entrsolutions.com' : path.join(__dirname, '../..'));

console.log(`Base directory: ${baseDir}`);

// Define directory structure to create and fix
const directories = [
  path.join(baseDir, 'uploads'),
  path.join(baseDir, 'uploads/assets'),
  path.join(baseDir, 'uploads/assets/logos')
];

// Test file paths
const testFile = path.join(baseDir, 'uploads/assets/logos/test-write.txt');
const testPHPFile = path.join(baseDir, 'uploads/test-permissions.php');

/**
 * Get detailed information about the system
 */
async function getSystemInfo() {
  console.log('=== SYSTEM INFORMATION ===');
  console.log(`Node.js version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Working directory: ${process.cwd()}`);
  
  try {
    // Try to get user info
    const whoami = await execPromise('whoami');
    console.log(`Running as user: ${whoami.stdout.trim()}`);
    
    // On Linux, try to get more user info
    if (process.platform === 'linux') {
      try {
        const groups = await execPromise('groups');
        console.log(`User groups: ${groups.stdout.trim()}`);
      } catch (e) {
        console.log('Could not determine user groups');
      }
    }
  } catch (error) {
    console.log('Could not determine current user');
  }
  
  console.log('=========================');
}

/**
 * Create directories with all permission methods
 */
async function createAndFixDirectories() {
  console.log('Creating and fixing upload directories...');
  
  for (const dir of directories) {
    console.log(`\nProcessing directory: ${dir}`);
    
    try {
      // Check if directory exists
      if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        // Create directory with permissive mode
        await mkdir(dir, { recursive: true, mode: 0o777 });
        console.log(`✓ Directory created`);
      } else {
        console.log(`✓ Directory already exists`);
      }
      
      // Try all permission methods
      await fixPermissions(dir);
      
    } catch (error) {
      console.error(`❌ Error with directory ${dir}:`, error.message);
    }
  }
}

/**
 * Apply multiple permission fixing methods to a path
 */
async function fixPermissions(pathToFix) {
  console.log(`Applying all permission methods to: ${pathToFix}`);
  
  try {
    // Method 1: Node's fs.chmod
    console.log('Method 1: Using Node.js fs.chmod...');
    try {
      await chmod(pathToFix, 0o777);
      console.log('✓ fs.chmod applied successfully');
    } catch (e) {
      console.log(`❌ fs.chmod failed: ${e.message}`);
    }
    
    // Method 2: Shell chmod command
    console.log('Method 2: Using shell chmod command...');
    try {
      const { stdout } = await execPromise(`chmod -R 777 "${pathToFix}"`);
      console.log(`✓ Shell chmod executed: ${stdout || 'No output'}`);
    } catch (e) {
      console.log(`❌ Shell chmod failed: ${e.message}`);
    }
    
    // Method 3: Shell chown command (if in production)
    if (isProduction) {
      console.log('Method 3: Using shell chown command...');
      try {
        // First get current user
        const { stdout: user } = await execPromise('whoami');
        const username = user.trim();
        
        // Apply chown
        const { stdout } = await execPromise(`chown -R ${username}:${username} "${pathToFix}"`);
        console.log(`✓ Shell chown to ${username} executed: ${stdout || 'No output'}`);
      } catch (e) {
        console.log(`❌ Shell chown failed: ${e.message}`);
      }
    }
    
    // Check current permissions
    try {
      const { stdout } = await execPromise(`ls -la "${pathToFix}"`);
      console.log('Current directory listing:');
      console.log(stdout);
    } catch (e) {
      console.log(`Could not get directory listing: ${e.message}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Permission fixing failed for ${pathToFix}:`, error.message);
    return false;
  }
}

/**
 * Test write access by creating a file
 */
async function testWriteAccess() {
  console.log('\nTesting write access...');
  
  try {
    // Test text file
    console.log(`Creating test text file: ${testFile}`);
    const content = `Test file created at ${new Date().toISOString()} by Node.js version ${process.version}`;
    await writeFile(testFile, content);
    await chmod(testFile, 0o666);
    
    // Verify we can read it back
    const readContent = await readFile(testFile, 'utf8');
    console.log(`✓ Successfully wrote and read test file (${readContent.length} bytes)`);
    
    // Create a PHP test file for web server access
    if (isProduction) {
      console.log(`Creating test PHP file: ${testPHPFile}`);
      const phpContent = `<?php
// This file tests if the web server can write to this directory
echo "PHP Test file created at " . date('Y-m-d H:i:s');
?>`;
      await writeFile(testPHPFile, phpContent);
      await chmod(testPHPFile, 0o666);
      console.log(`✓ Test PHP file created at ${testPHPFile}`);
      
      // Output the URL to access this file
      const serverUrl = 'https://api.climasys.entrsolutions.com';
      const phpTestUrl = `${serverUrl}/uploads/test-permissions.php`;
      console.log(`\nYou can verify web server permissions by accessing: ${phpTestUrl}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Write access test failed:`, error.message);
    return false;
  }
}

/**
 * Create a default logo from placeholder if needed
 */
async function createDefaultLogo() {
  console.log('\nCreating default logo file...');
  
  const defaultLogoPath = path.join(baseDir, 'uploads/assets/logos/default-logo.png');
  
  try {
    if (fs.existsSync(defaultLogoPath)) {
      console.log(`✓ Default logo already exists at ${defaultLogoPath}`);
      return true;
    }
    
    // Simple default image content (1x1 transparent PNG)
    const transparentPixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==',
      'base64'
    );
    
    await writeFile(defaultLogoPath, transparentPixel);
    await chmod(defaultLogoPath, 0o666);
    
    console.log(`✓ Created default logo at ${defaultLogoPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create default logo:`, error.message);
    return false;
  }
}

/**
 * Check for common issues with cPanel hosting
 */
async function checkCPanelConfiguration() {
  if (!isProduction) return;
  
  console.log('\nChecking for common cPanel configuration issues...');
  
  try {
    // Check for .htaccess file that might be restricting access
    const htaccessPath = path.join(baseDir, 'uploads/.htaccess');
    
    if (fs.existsSync(htaccessPath)) {
      console.log(`Found .htaccess file at ${htaccessPath}`);
      console.log('Contents:');
      const htaccess = await readFile(htaccessPath, 'utf8');
      console.log(htaccess);
      
      // Check if it's preventing access
      if (htaccess.includes('Deny from all')) {
        console.log('⚠️ .htaccess contains "Deny from all" which could prevent access!');
        
        // Create a backup
        await writeFile(`${htaccessPath}.bak`, htaccess);
        
        // Replace with permissive .htaccess
        const newHtaccess = `# Allow access to this directory
Options +Indexes
<IfModule mod_headers.c>
  <FilesMatch "\\.(jpg|jpeg|png|gif|svg)$">
    Header set Access-Control-Allow-Origin "*"
  </FilesMatch>
</IfModule>
`;
        await writeFile(htaccessPath, newHtaccess);
        console.log(`✓ Updated .htaccess to allow access (backup saved as ${htaccessPath}.bak)`);
      }
    } else {
      // Create a permissive .htaccess
      const newHtaccess = `# Allow access to this directory
Options +Indexes
<IfModule mod_headers.c>
  <FilesMatch "\\.(jpg|jpeg|png|gif|svg)$">
    Header set Access-Control-Allow-Origin "*"
  </FilesMatch>
</IfModule>
`;
      await writeFile(htaccessPath, newHtaccess);
      console.log(`✓ Created permissive .htaccess file at ${htaccessPath}`);
    }
  } catch (error) {
    console.error('❌ Error checking cPanel configuration:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== UPLOAD PERMISSIONS FIXER ===');
  console.log(`Time: ${new Date().toISOString()}`);
  
  // Get system information
  await getSystemInfo();
  
  // Create and fix directories
  await createAndFixDirectories();
  
  // Test write access
  const writeOk = await testWriteAccess();
  
  // Check cPanel configuration
  await checkCPanelConfiguration();
  
  // Create default logo
  if (writeOk) {
    await createDefaultLogo();
  }
  
  console.log('\n=== SUMMARY ===');
  if (writeOk) {
    console.log('✅ PERMISSIONS FIXED SUCCESSFULLY');
    console.log('You should now be able to upload logos in the web application.');
    
    console.log('\nIf you still have issues:');
    console.log('1. Make sure your server is configured to serve files from the uploads directory');
    console.log('2. Check that your API endpoints are configured correctly');
    console.log('3. Verify that your database is properly storing the file paths');
  } else {
    console.log('❌ PERMISSION ISSUES STILL EXIST');
    console.log('\nAdditional steps to try:');
    console.log('1. Contact your hosting provider about file permissions');
    console.log('2. Check if SELinux or other security systems are blocking access');
    console.log('3. Consider using a different directory for uploads');
  }
}

// Run the main function
main().catch(console.error);
