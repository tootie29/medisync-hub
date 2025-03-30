
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
    if (!exists) {
      console.error(`File not found: ${filePath}`);
    }
    return exists;
  } catch (error) {
    console.error(`Error verifying file existence: ${error.message}`);
    return false;
  }
};

/**
 * Get file ownership and permissions info for debugging
 * @param {string} filePath Path to the file or directory
 * @returns {Promise<object>} Object with ownership and permissions info
 */
exports.getFileInfo = async (filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { exists: false };
    }
    
    const stats = fs.statSync(filePath);
    const octalMode = '0' + (stats.mode & 0o777).toString(8);
    
    // Try to get owner info on Linux systems
    let ownerInfo = '';
    try {
      ownerInfo = await new Promise((resolve, reject) => {
        exec(`ls -la "${filePath}" | awk '{print $3":"$4}'`, (error, stdout) => {
          if (error) reject(error);
          else resolve(stdout.trim());
        });
      });
    } catch (e) {
      ownerInfo = 'Unknown (not Linux or no permissions)';
    }
    
    return {
      exists: true,
      size: stats.size,
      permissions: octalMode,
      owner: ownerInfo,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      isReadable: await isReadable(filePath),
      isWritable: await isWritable(filePath)
    };
  } catch (error) {
    console.error(`Error getting file info: ${error.message}`);
    return { exists: false, error: error.message };
  }
};

/**
 * Check if file/directory is readable
 */
async function isReadable(filePath) {
  try {
    await promisify(fs.access)(filePath, fs.constants.R_OK);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if file/directory is writable
 */
async function isWritable(filePath) {
  try {
    await promisify(fs.access)(filePath, fs.constants.W_OK);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Apply progressively more permissive permissions until success
 * @param {string} filePath Path to the file
 * @returns {Promise<boolean>} True if permissions set, false otherwise
 */
exports.ensureFilePermissions = async (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`Cannot set permissions on non-existent file: ${filePath}`);
    return false;
  }
  
  // Array of permissions to try in order (from restrictive to permissive)
  const permissionsToTry = [0o644, 0o664, 0o666];
  
  for (const permission of permissionsToTry) {
    try {
      console.log(`Attempting to set permissions ${permission.toString(8)} on ${filePath}`);
      await promisify(fs.chmod)(filePath, permission);
      
      // Verify permissions were actually set
      const newStats = fs.statSync(filePath);
      const newMode = newStats.mode & 0o777;
      
      console.log(`File ${filePath} permissions set to ${newMode.toString(8)}`);
      
      // Check if file is readable and writable
      if (await isReadable(filePath) && await isWritable(filePath)) {
        console.log(`File ${filePath} is now readable and writable`);
        return true;
      }
    } catch (error) {
      console.error(`Failed setting ${permission.toString(8)} permissions: ${error.message}`);
    }
  }
  
  // If we reach here, all attempts failed
  console.error(`All permission attempts failed for ${filePath}`);
  return false;
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
 * Create directory recursively with proper permissions
 * @param {string} dirPath Path to the directory
 * @returns {Promise<object>} Result with success status and directory info
 */
exports.ensureDirectoryExists = async (dirPath) => {
  try {
    if (!dirPath) {
      return { 
        success: false, 
        error: 'No directory path provided' 
      };
    }
    
    // Check if directory exists
    const exists = fs.existsSync(dirPath);
    
    if (!exists) {
      console.log(`Creating directory: ${dirPath}`);
      try {
        await promisify(fs.mkdir)(dirPath, { recursive: true, mode: 0o755 });
        console.log(`Created directory: ${dirPath}`);
      } catch (mkdirErr) {
        console.error(`Failed to create directory: ${mkdirErr.message}`);
        return { 
          success: false, 
          error: `Failed to create directory: ${mkdirErr.message}`,
          path: dirPath
        };
      }
    }
    
    // Try to set directory permissions
    try {
      await promisify(fs.chmod)(dirPath, 0o755);
      console.log(`Set permissions on directory: ${dirPath}`);
    } catch (chmodErr) {
      console.error(`Failed to set directory permissions: ${chmodErr.message}`);
      // Continue anyway - directory might still be usable
    }
    
    // Get directory info for diagnosis
    const dirInfo = await exports.getFileInfo(dirPath);
    
    // Test write access with a temp file
    let canWrite = false;
    const testFile = path.join(dirPath, `test-${Date.now()}.txt`);
    try {
      await promisify(fs.writeFile)(testFile, 'test');
      canWrite = true;
      // Clean up test file
      try {
        await promisify(fs.unlink)(testFile);
      } catch (unlinkErr) {
        console.error(`Failed to delete test file: ${unlinkErr.message}`);
      }
    } catch (writeErr) {
      console.error(`Directory is not writable: ${writeErr.message}`);
    }
    
    return { 
      success: true, 
      path: dirPath,
      exists: true, 
      isWritable: canWrite,
      dirInfo
    };
  } catch (error) {
    console.error(`Error ensuring directory exists: ${error.message}`);
    return { 
      success: false, 
      error: error.message,
      path: dirPath 
    };
  }
};
