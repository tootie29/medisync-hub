const express = require('express');
const router = express.Router();
const logoController = require('../controllers/logoController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const fileUtils = require('../utils/fileUtils');

// Convert fs methods to Promise-based for better error handling
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const chmod = promisify(fs.chmod);

// Determine if we're in production (cPanel) or development
const isProduction = process.env.NODE_ENV === 'production';

// Get base directory from environment or use default
const baseDir = process.env.UPLOAD_BASE_DIR || 
                (isProduction ? '/home/entrsolu/api.climasys.entrsolutions.com' : path.join(__dirname, '../'));

// Define upload paths
const uploadsDir = 'uploads';
const assetsDir = 'assets';
const logosDir = 'logos';
const fullUploadPath = path.join(baseDir, uploadsDir, assetsDir, logosDir);

console.log(`Server environment: ${isProduction ? 'Production (cPanel)' : 'Development'}`);
console.log(`Base directory: ${baseDir}`);
console.log(`Full upload path: ${fullUploadPath}`);

// Run directory initialization at startup
(async () => {
  try {
    // Use the fileUtils method for ensuring directory exists
    const result = await fileUtils.ensureDirectoryExists(fullUploadPath);
    
    if (result.success) {
      console.log(`Upload directory is ready: ${fullUploadPath}`);
      if (result.dirInfo) {
        console.log(`  - Permissions: ${result.dirInfo.permissions}`);
        console.log(`  - Owner: ${result.dirInfo.owner}`);
        console.log(`  - Writable: ${result.dirInfo.isWritable ? 'Yes' : 'No'}`);
      }
    } else {
      console.error(`Failed to initialize upload directory: ${fullUploadPath}`);
      console.error(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('Error during directory initialization:', error);
  }
})();

// Configure multer for file uploads with improved error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(`Starting file upload to: ${fullUploadPath}`);
    
    // Ensure directory exists before storing
    fileUtils.ensureDirectoryExists(fullUploadPath)
      .then(result => {
        if (result.success && result.isWritable) {
          console.log(`Will store file in: ${fullUploadPath}`);
          cb(null, fullUploadPath);
        } else {
          console.error(`Cannot save file - upload directory issue: ${fullUploadPath}`);
          console.error('Directory details:', result);
          cb(new Error(`Upload directory is not accessible or writable: ${fullUploadPath}`), null);
        }
      })
      .catch(err => {
        console.error(`Error preparing upload directory: ${fullUploadPath}`, err);
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
    fileSize: 1 * 1024 * 1024, // 1MB limit
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

// New diagnostic endpoint
router.get('/diagnostics', logoController.getUploadDiagnostics);

// Add a new route for client-side stored logos that can handle both path and base64
router.post('/client', logoController.uploadClientLogos);

// Add a route for base64 logo uploads
router.post('/base64', logoController.uploadBase64Logos);

// Keep the original route for file uploads
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
  
  // Add upload path information to request for controller reference
  req.uploadInfo = {
    baseDir,
    uploadsDir,
    assetsDir,
    logosDir,
    fullUploadPath
  };
  
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
