
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

/**
 * Verify that a file exists
 * @param {string} filePath Path to the file
 * @returns {boolean} True if file exists, false otherwise
 */
exports.verifyFileExists = (filePath) => {
  try {
    if (!filePath) return false;
    const exists = fs.existsSync(filePath);
    console.log(`File exists check [${exists ? 'YES' : 'NO'}]: ${filePath}`);
    return exists;
  } catch (error) {
    console.error(`Error verifying file existence: ${error.message}`);
    return false;
  }
};

/**
 * Attempt to fix permissions on a specific file with multiple methods
 * @param {string} filePath Path to the file
 * @returns {Promise<boolean>} True if permissions set, false otherwise
 */
exports.ensureFilePermissions = async (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`Cannot set permissions on non-existent file: ${filePath}`);
    return false;
  }
  
  console.log(`Setting permissions on file: ${filePath}`);
  
  try {
    // First attempt - use node's fs.chmod
    await promisify(fs.chmod)(filePath, 0o666);
    console.log(`Set permissions to 0o666 (rw-rw-rw-) on ${filePath}`);
    
    // Verify we can actually read the file after setting permissions
    try {
      const stats = fs.statSync(filePath);
      console.log(`File size: ${stats.size} bytes, Mode: ${stats.mode.toString(8)}`);
      
      // Try to read the first few bytes to verify read access
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(10);
      fs.readSync(fd, buffer, 0, 10, 0);
      fs.closeSync(fd);
      console.log(`Successfully verified read access to ${filePath}`);
    } catch (readErr) {
      console.error(`Warning: Cannot verify read access: ${readErr.message}`);
    }
    
    // Second attempt - try using chmod command
    // This can help in cases where the node process doesn't have permission but the shell does
    try {
      console.log(`Trying alternative chmod via shell command on ${filePath}`);
      const chmodResult = await execShellCommand(`chmod 666 "${filePath}"`);
      console.log(`Shell chmod result: ${chmodResult}`);
    } catch (chmodErr) {
      console.error(`Shell chmod failed (non-critical): ${chmodErr.message}`);
      // Continue anyway, first method may have worked
    }
    
    // Try to get file owner information
    try {
      const statOutput = await execShellCommand(`stat -c "%U:%G" "${filePath}"`);
      console.log(`File ${filePath} is owned by: ${statOutput.trim()}`);
    } catch (statErr) {
      console.log(`Could not determine file ownership: ${statErr.message}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error setting file permissions: ${error.message}`);
    
    // Last resort - try to make the directory world-writable
    try {
      const dirPath = path.dirname(filePath);
      console.log(`Last resort: trying to make directory writable: ${dirPath}`);
      await promisify(fs.chmod)(dirPath, 0o777);
      console.log(`Set directory permissions to 0o777 on ${dirPath}`);
      return true;
    } catch (dirErr) {
      console.error(`Failed to set directory permissions: ${dirErr.message}`);
      return false;
    }
  }
};

/**
 * Execute shell command as a promise
 * @param {string} cmd Command to execute
 * @returns {Promise<string>} Command output
 */
const execShellCommand = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout ? stdout : stderr);
      }
    });
  });
};

/**
 * Ensure a directory exists and has proper permissions
 * @param {string} dirPath Path to directory
 * @returns {Promise<boolean>} True if directory exists and has proper permissions
 */
exports.ensureDirectoryExists = async (dirPath) => {
  console.log(`Ensuring directory exists with proper permissions: ${dirPath}`);
  
  try {
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating directory: ${dirPath}`);
      await promisify(fs.mkdir)(dirPath, { recursive: true, mode: 0o777 });
    }
    
    // Set permissions
    console.log(`Setting permissions on directory: ${dirPath}`);
    await promisify(fs.chmod)(dirPath, 0o777);
    
    // Verify permissions by writing a test file
    const testFile = path.join(dirPath, `.test-${Date.now()}.txt`);
    console.log(`Writing test file to verify permissions: ${testFile}`);
    
    try {
      fs.writeFileSync(testFile, 'Test write access');
      console.log(`Successfully wrote test file: ${testFile}`);
      
      // Clean up test file
      fs.unlinkSync(testFile);
      console.log(`Removed test file: ${testFile}`);
      
      return true;
    } catch (writeErr) {
      console.error(`Failed to write test file: ${writeErr.message}`);
      
      // Try using shell command as fallback
      try {
        console.log(`Trying to set permissions via shell command`);
        await execShellCommand(`chmod -R 777 "${dirPath}"`);
        console.log(`Shell chmod executed on directory`);
        
        // Try again with test file
        fs.writeFileSync(testFile, 'Test write access after shell chmod');
        console.log(`Successfully wrote test file after shell chmod: ${testFile}`);
        fs.unlinkSync(testFile);
        return true;
      } catch (shellErr) {
        console.error(`All permission methods failed: ${shellErr.message}`);
        return false;
      }
    }
  } catch (error) {
    console.error(`Error ensuring directory: ${error.message}`);
    return false;
  }
};

/**
 * Get absolute URL for a file
 * @param {object} req Express request object
 * @param {string} relativePath Relative path to the file
 * @returns {string} Absolute URL
 */
exports.getAbsoluteUrl = (req, relativePath) => {
  if (!relativePath) return '';
  
  // Get base URL from request
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  // Join with relative path
  return baseUrl + (relativePath.startsWith('/') ? relativePath : '/' + relativePath);
};
