
const express = require('express');
const router = express.Router();
const logoController = require('../controllers/logoController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

// Convert fs methods to Promise-based for better error handling
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const chmod = promisify(fs.chmod);

// Create uploads directory with proper permissions - absolute physical path
const uploadDir = path.join(__dirname, '..', 'uploads', 'assets', 'logos');

// Recursive directory creation function with proper permissions
async function ensureDirectoryExists(directory) {
  console.log(`Ensuring directory exists: ${directory}`);
  try {
    // Check if directory exists
    await access(directory, fs.constants.F_OK);
    console.log(`Directory already exists: ${directory}`);
    
    // Set directory permissions to 0755 (rwxr-xr-x)
    await chmod(directory, 0o755);
    console.log(`Set permissions on: ${directory}`);
    
    // Verify write access
    await access(directory, fs.constants.W_OK);
    console.log(`Directory is writable: ${directory}`);
    
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`Directory does not exist, creating: ${directory}`);
      try {
        // Create directory with permissions
        await mkdir(directory, { recursive: true, mode: 0o755 });
        console.log(`Created directory: ${directory}`);
        
        // Double-check write permissions
        await access(directory, fs.constants.W_OK);
        console.log(`Verified write access to: ${directory}`);
        
        return true;
      } catch (mkdirErr) {
        console.error(`Failed to create directory ${directory}:`, mkdirErr);
        return false;
      }
    } else {
      console.error(`Error accessing directory ${directory}:`, err);
      return false;
    }
  }
}

// Ensure directory exists before server starts
(async () => {
  // Create each directory in the path separately to ensure proper permissions
  const pathParts = uploadDir.split(path.sep);
  let currentPath = '';
  
  for (let i = 0; i < pathParts.length; i++) {
    if (pathParts[i]) {
      currentPath += (currentPath ? path.sep : '') + pathParts[i];
      await ensureDirectoryExists(currentPath);
    }
  }
  
  // Final check of the complete upload path
  const success = await ensureDirectoryExists(uploadDir);
  if (success) {
    console.log(`Upload directory ready: ${uploadDir}`);
  } else {
    console.error(`CRITICAL: Upload directory ${uploadDir} could not be prepared!`);
  }
})();

// Configure multer for file uploads with enhanced reliability
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(`Starting file upload to: ${uploadDir}`);
    
    // Ensure directory exists before storing
    ensureDirectoryExists(uploadDir)
      .then(success => {
        if (success) {
          console.log(`Will store file in: ${uploadDir}`);
          cb(null, uploadDir);
        } else {
          console.error(`Cannot save file - upload directory issue: ${uploadDir}`);
          cb(new Error('Upload directory is not accessible'), null);
        }
      })
      .catch(err => {
        console.error(`Error preparing upload directory: ${uploadDir}`, err);
        cb(err, null);
      });
  },
  filename: function (req, file, cb) {
    // Generate a more reliable filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = 'logo-' + uniqueSuffix + ext;
    console.log(`Generated filename: ${filename}`);
    cb(null, filename);
  }
});

// Improve upload configuration for better reliability
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit to avoid timeouts
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      console.log(`Accepting file: ${file.originalname}, mimetype: ${file.mimetype}`);
      cb(null, true);
    } else {
      console.log(`Rejecting file: ${file.originalname}, mimetype: ${file.mimetype}`);
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all logos
router.get('/', logoController.getAllLogos);

// Upload new logos with improved error handling
router.post('/', upload.fields([
  { name: 'primaryLogo', maxCount: 1 },
  { name: 'secondaryLogo', maxCount: 1 }
]), (req, res, next) => {
  console.log('Logo upload request received with files:', req.files);
  console.log('Request body:', req.body);
  
  if (!req.files || Object.keys(req.files).length === 0) {
    console.error('No files were uploaded in the request');
    return res.status(400).json({ error: 'No files were uploaded' });
  }
  
  // Validate the uploaded files exist on disk before proceeding
  let filesOk = true;
  const fileErrors = [];
  
  if (req.files.primaryLogo && req.files.primaryLogo[0]) {
    const primaryPath = req.files.primaryLogo[0].path;
    if (!fs.existsSync(primaryPath)) {
      filesOk = false;
      fileErrors.push(`Primary logo file not saved to disk: ${primaryPath}`);
      console.error(`Primary logo file not saved to disk: ${primaryPath}`);
    } else {
      console.log(`Verified primary logo exists on disk: ${primaryPath}`);
      
      // Ensure file has correct permissions
      try {
        fs.chmodSync(primaryPath, 0o644); // rw-r--r--
        console.log(`Set file permissions on: ${primaryPath}`);
      } catch (permErr) {
        console.error(`Could not set file permissions: ${permErr.message}`);
      }
    }
  }
  
  if (req.files.secondaryLogo && req.files.secondaryLogo[0]) {
    const secondaryPath = req.files.secondaryLogo[0].path;
    if (!fs.existsSync(secondaryPath)) {
      filesOk = false;
      fileErrors.push(`Secondary logo file not saved to disk: ${secondaryPath}`);
      console.error(`Secondary logo file not saved to disk: ${secondaryPath}`);
    } else {
      console.log(`Verified secondary logo exists on disk: ${secondaryPath}`);
      
      // Ensure file has correct permissions
      try {
        fs.chmodSync(secondaryPath, 0o644); // rw-r--r--
        console.log(`Set file permissions on: ${secondaryPath}`);
      } catch (permErr) {
        console.error(`Could not set file permissions: ${permErr.message}`);
      }
    }
  }
  
  if (!filesOk) {
    return res.status(500).json({ 
      error: 'File upload failed - files not saved to disk',
      details: fileErrors
    });
  }
  
  console.log('All files validated, proceeding to controller');
  next();
}, logoController.uploadLogos);

// Get a single logo by position
router.get('/:position', logoController.getLogoByPosition);

module.exports = router;
