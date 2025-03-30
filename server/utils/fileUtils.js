
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Convert fs methods to Promise-based for better error handling
const access = promisify(fs.access);
const chmod = promisify(fs.chmod);

/**
 * Ensures proper file permissions are set
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - Success status
 */
exports.ensureFilePermissions = async (filePath) => {
  try {
    await chmod(filePath, 0o644); // rw-r--r--
    console.log(`Set file permissions on: ${filePath}`);
    return true;
  } catch (permErr) {
    console.error(`Could not set file permissions: ${permErr.message}`);
    return false;
  }
};

/**
 * Verify that a file exists on disk
 * @param {string} filePath - Path to the file
 * @returns {boolean} - Whether the file exists
 */
exports.verifyFileExists = (filePath) => {
  const exists = fs.existsSync(filePath);
  if (!exists) {
    console.error(`File not found at ${filePath}`);
  } else {
    console.log(`File verified at ${filePath}`);
  }
  return exists;
};

/**
 * Get absolute URL for a resource
 * @param {Object} req - Express request object
 * @param {string} relativePath - Relative path to the resource
 * @returns {string} - Absolute URL
 */
exports.getAbsoluteUrl = (req, relativePath) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return relativePath.startsWith('http') ? relativePath : `${baseUrl}${relativePath}`;
};
