
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

/**
 * Verify that a file exists
 * @param {string} filePath Path to the file
 * @returns {boolean} True if file exists, false otherwise
 */
exports.verifyFileExists = (filePath) => {
  try {
    if (!filePath) return false;
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Error verifying file existence: ${error.message}`);
    return false;
  }
};

/**
 * Ensure file has correct permissions
 * @param {string} filePath Path to the file
 * @returns {Promise<boolean>} True if permissions set, false otherwise
 */
exports.ensureFilePermissions = async (filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) return false;
    
    // Using more restrictive permissions for production
    // 0o644 = rw-r--r-- (standard file permissions)
    await promisify(fs.chmod)(filePath, 0o644);
    
    return true;
  } catch (error) {
    console.error(`Error setting file permissions: ${error.message}`);
    // Attempt a second time with more permissive settings if first attempt failed
    try {
      await promisify(fs.chmod)(filePath, 0o666);
      console.log(`Used fallback permissions (666) for: ${filePath}`);
      return true;
    } catch (fallbackError) {
      console.error(`Even fallback permissions failed: ${fallbackError.message}`);
      return false;
    }
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
  
  // Get base URL from request with fallback for direct calls
  const protocol = req ? req.protocol : 'https';
  const host = req ? req.get('host') : 'api.climasys.entrsolutions.com';
  const baseUrl = `${protocol}://${host}`;
  
  // Join with relative path
  return baseUrl + (relativePath.startsWith('/') ? relativePath : '/' + relativePath);
};

/**
 * Create directory recursively if it doesn't exist
 * @param {string} dirPath Path to the directory
 * @returns {Promise<boolean>} True if directory exists or was created
 */
exports.ensureDirectoryExists = async (dirPath) => {
  try {
    if (!dirPath) return false;
    
    if (!fs.existsSync(dirPath)) {
      await promisify(fs.mkdir)(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`);
    return false;
  }
};
