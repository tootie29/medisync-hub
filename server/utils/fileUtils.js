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
    
    console.log(`Setting permissions on file: ${filePath}`);
    // Try very permissive permissions - for troubleshooting only
    // In production this should be 0o644 (rw-r--r--)
    await promisify(fs.chmod)(filePath, 0o666);
    
    return true;
  } catch (error) {
    console.error(`Error setting file permissions: ${error.message}`);
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
