
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables to ensure we have access to them
dotenv.config();

// Check if we should use chmod commands (default to true)
const ENABLE_CHMOD = process.env.ENABLE_CHMOD !== 'false';
const FILE_DEBUG = process.env.FILE_DEBUG === 'true';

/**
 * Verify that a file exists
 * @param {string} filePath Path to the file
 * @returns {boolean} True if file exists, false otherwise
 */
exports.verifyFileExists = (filePath) => {
  try {
    if (!filePath) return false;
    const exists = fs.existsSync(filePath);
    if (FILE_DEBUG) {
      console.log(`File exists check [${exists ? 'YES' : 'NO'}]: ${filePath}`);
    }
    return exists;
  } catch (error) {
    console.error(`Error verifying file existence: ${error.message}`);
    return false;
  }
};

/**
 * Execute shell command as a promise
 * @param {string} cmd Command to execute
 * @returns {Promise<string>} Command output
 */
const execShellCommand = (cmd) => {
  if (FILE_DEBUG) {
    console.log(`Executing shell command: ${cmd}`);
  }
  
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
 * Attempt to fix permissions on a specific file with multiple methods
 * @param {string} filePath Path to the file
 * @returns {Promise<boolean>} True if permissions set, false otherwise
 */
exports.ensureFilePermissions = async (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`Cannot set permissions on non-existent file: ${filePath}`);
    return false;
  }
  
  if (FILE_DEBUG) {
    console.log(`Setting permissions on file: ${filePath}`);
  }
  
  try {
    // Determine file or directory
    const isDirectory = fs.statSync(filePath).isDirectory();
    const permissionMode = isDirectory ? 0o777 : 0o666; // dir: rwxrwxrwx, file: rw-rw-rw-
    
    // Get current permission mode for debugging
    try {
      const stats = fs.statSync(filePath);
      if (FILE_DEBUG) {
        console.log(`Current file mode: ${stats.mode.toString(8)}, Size: ${stats.size} bytes`);
      }
    } catch (err) {
      console.error(`Cannot get current file mode: ${err.message}`);
    }
    
    // Method 1 - use node's fs.chmod
    try {
      await promisify(fs.chmod)(filePath, permissionMode);
      if (FILE_DEBUG) {
        console.log(`Set permissions to ${permissionMode.toString(8)} on ${filePath}`);
      }
    } catch (chmodErr) {
      console.error(`Node fs.chmod failed: ${chmodErr.message}`);
    }
    
    // Method 2 - try using chmod command if enabled
    if (ENABLE_CHMOD) {
      try {
        const chmodResult = await execShellCommand(`chmod ${isDirectory ? '-R ' : ''}${permissionMode.toString(8)} "${filePath}"`);
        if (FILE_DEBUG && chmodResult) {
          console.log(`Shell chmod result: ${chmodResult}`);
        }
      } catch (chmodErr) {
        console.error(`Shell chmod failed: ${chmodErr.message}`);
      }
    }
    
    // Method 3 - try to get file owner information and match it
    try {
      const whoami = await execShellCommand('whoami');
      const user = whoami.trim();
      
      if (user) {
        try {
          await execShellCommand(`chown ${user} "${filePath}"`);
          if (FILE_DEBUG) {
            console.log(`Changed owner to ${user} for ${filePath}`);
          }
        } catch (chownErr) {
          console.error(`Failed to change owner: ${chownErr.message}`);
        }
      }
    } catch (userErr) {
      console.error(`Could not get current user: ${userErr.message}`);
    }
    
    // Verify we can read the file after setting permissions
    try {
      if (!isDirectory) {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(10);
        fs.readSync(fd, buffer, 0, 10, 0);
        fs.closeSync(fd);
        if (FILE_DEBUG) {
          console.log(`Successfully verified read access to ${filePath}`);
        }
      }
    } catch (readErr) {
      console.error(`Warning: Cannot verify read access: ${readErr.message}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error setting file permissions: ${error.message}`);
    
    // Last resort - try to make the directory world-writable
    try {
      const dirPath = path.dirname(filePath);
      if (FILE_DEBUG) {
        console.log(`Last resort: trying to make directory writable: ${dirPath}`);
      }
      await promisify(fs.chmod)(dirPath, 0o777);
      if (FILE_DEBUG) {
        console.log(`Set directory permissions to 0o777 on ${dirPath}`);
      }
      return true;
    } catch (dirErr) {
      console.error(`Failed to set directory permissions: ${dirErr.message}`);
      return false;
    }
  }
};

/**
 * Ensure a directory exists and has proper permissions
 * @param {string} dirPath Path to directory
 * @returns {Promise<boolean>} True if directory exists and has proper permissions
 */
exports.ensureDirectoryExists = async (dirPath) => {
  if (FILE_DEBUG) {
    console.log(`Ensuring directory exists with proper permissions: ${dirPath}`);
  }
  
  try {
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      if (FILE_DEBUG) {
        console.log(`Creating directory: ${dirPath}`);
      }
      await promisify(fs.mkdir)(dirPath, { recursive: true, mode: 0o777 });
    }
    
    // Set permissions
    if (FILE_DEBUG) {
      console.log(`Setting permissions on directory: ${dirPath}`);
    }
    await this.ensureFilePermissions(dirPath);
    
    // Verify permissions by writing a test file
    const testFile = path.join(dirPath, `.test-${Date.now()}.txt`);
    if (FILE_DEBUG) {
      console.log(`Writing test file to verify permissions: ${testFile}`);
    }
    
    try {
      fs.writeFileSync(testFile, 'Test write access');
      if (FILE_DEBUG) {
        console.log(`Successfully wrote test file: ${testFile}`);
      }
      
      // Clean up test file
      fs.unlinkSync(testFile);
      if (FILE_DEBUG) {
        console.log(`Removed test file: ${testFile}`);
      }
      
      return true;
    } catch (writeErr) {
      console.error(`Failed to write test file: ${writeErr.message}`);
      
      // Try using shell command as fallback
      if (ENABLE_CHMOD) {
        try {
          if (FILE_DEBUG) {
            console.log(`Trying to set permissions via shell command`);
          }
          await execShellCommand(`chmod -R 777 "${dirPath}"`);
          
          // Try again with test file
          fs.writeFileSync(testFile, 'Test write access after shell chmod');
          if (FILE_DEBUG) {
            console.log(`Successfully wrote test file after shell chmod: ${testFile}`);
          }
          fs.unlinkSync(testFile);
          return true;
        } catch (shellErr) {
          console.error(`All permission methods failed: ${shellErr.message}`);
          return false;
        }
      }
      
      return false;
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
  const url = baseUrl + (relativePath.startsWith('/') ? relativePath : '/' + relativePath);
  
  if (FILE_DEBUG) {
    console.log(`getAbsoluteUrl: ${relativePath} -> ${url}`);
  }
  
  return url;
};

/**
 * Get the server's upload directory
 * @returns {string} The absolute path to the upload directory
 */
exports.getUploadDir = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseDir = process.env.UPLOAD_BASE_DIR || 
                 (isProduction ? '/home/entrsolu/api.climasys.entrsolutions.com' : path.join(__dirname, '../..'));
  return path.join(baseDir, 'uploads');
};

/**
 * Log details about the server's file system
 */
exports.logFileSystemDetails = async () => {
  if (!FILE_DEBUG) return;
  
  console.log('=== FILE SYSTEM DETAILS ===');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`UPLOAD_BASE_DIR: ${process.env.UPLOAD_BASE_DIR || 'not set'}`);
  console.log(`CWD: ${process.cwd()}`);
  
  const uploadDir = this.getUploadDir();
  console.log(`Upload directory: ${uploadDir}`);
  
  try {
    // Check directory existence
    const exists = fs.existsSync(uploadDir);
    console.log(`Upload directory exists: ${exists}`);
    
    if (exists) {
      // Check writability with both methods
      try {
        const testFile = path.join(uploadDir, `.test-${Date.now()}.txt`);
        fs.writeFileSync(testFile, 'Test');
        console.log(`Can write to upload directory: YES`);
        fs.unlinkSync(testFile);
      } catch (e) {
        console.log(`Can write to upload directory: NO - ${e.message}`);
      }
      
      // Try to list files
      try {
        const files = fs.readdirSync(uploadDir);
        console.log(`Files in upload directory: ${files.length}`);
      } catch (e) {
        console.log(`Cannot list files in upload directory: ${e.message}`);
      }
    }
  } catch (error) {
    console.error(`Error checking upload directory: ${error.message}`);
  }
  
  console.log('===========================');
};
