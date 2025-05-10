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

// Ensure proper response types for all routes
router.use((req, res, next) => {
  // Explicitly set Content-Type for JSON responses
  res.setHeader('Content-Type', 'application/json');
  
  // Add CORS headers for all responses
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }
  
  next();
});

// Get all logos
router.get('/', logoController.getAllLogos);

// New diagnostic endpoint
router.get('/diagnostics', logoController.getUploadDiagnostics);

// Add a new route for client-side stored logos
router.post('/client', logoController.uploadClientLogos);

// Simplified base64 upload route
router.post('/base64', logoController.uploadBase64Logos);

// Add direct upload endpoints for better reliability
router.post('/upload-logo/:position', upload.single('file'), logoController.uploadSingleLogo);
router.post('/upload-base64-logo/:position', logoController.uploadSingleBase64Logo);

// Route for file uploads (original method - keeping for backward compatibility)
router.post('/', upload.fields([
  { name: 'primaryLogo', maxCount: 1 },
  { name: 'secondaryLogo', maxCount: 1 }
]), (req, res, next) => {
  console.log('Logo upload request received with files:', req.files);
  
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: 'No files were uploaded', success: false });
  }
  
  // Add upload path information to request for controller reference
  req.uploadInfo = {
    baseDir,
    uploadsDir,
    assetsDir,
    logosDir,
    fullUploadPath
  };
  
  next();
}, logoController.uploadLogos);

// Get a single logo by position
router.get('/:position', logoController.getLogoByPosition);

module.exports = router;
