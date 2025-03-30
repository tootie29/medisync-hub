
const express = require('express');
const router = express.Router();
const logoController = require('../controllers/logoController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory with proper permissions - absolute physical path
const uploadDir = path.join(__dirname, '..', 'uploads', 'assets', 'logos');

// Ensure directory exists before server starts
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    console.log(`Created upload directory: ${uploadDir}`);
  } else {
    console.log(`Upload directory exists: ${uploadDir}`);
    // Check write permissions
    fs.accessSync(uploadDir, fs.constants.W_OK);
    console.log(`Upload directory is writable: ${uploadDir}`);
  }
} catch (error) {
  console.error(`ERROR with upload directory: ${uploadDir}`, error);
}

// Configure multer for file uploads with debugging
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(`Starting file upload to: ${uploadDir}`);
    
    // Double check directory exists before storing
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
        console.log(`Created upload directory during request: ${uploadDir}`);
      } catch (dirError) {
        console.error(`Failed to create upload directory: ${uploadDir}`, dirError);
        return cb(dirError, null);
      }
    }
    
    // Verify write permissions
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      console.log(`Verified upload directory is writable: ${uploadDir}`);
    } catch (accessError) {
      console.error(`Upload directory is not writable: ${uploadDir}`, accessError);
      return cb(accessError, null);
    }
    
    console.log(`Will store file in: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = 'logo-' + uniqueSuffix + ext;
    console.log(`Generated filename: ${filename}`);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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

// Upload new logos - make sure multer is properly configured
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

// Added route to get a single logo by position
router.get('/:position', logoController.getLogoByPosition);

module.exports = router;
