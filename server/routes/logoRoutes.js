
const express = require('express');
const router = express.Router();
const logoController = require('../controllers/logoController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory with proper permissions
const uploadDir = path.join(__dirname, '../uploads/assets/logos');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    console.log(`Created upload directory: ${uploadDir}`);
  } catch (error) {
    console.error(`Failed to create upload directory: ${uploadDir}`, error);
  }
}

// Configure multer for file uploads with professional path
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Double check directory exists before storing
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
        console.log(`Created upload directory: ${uploadDir}`);
      } catch (error) {
        console.error(`Failed to create upload directory: ${uploadDir}`, error);
        return cb(error, null);
      }
    }
    console.log(`Storing file in: ${uploadDir}`);
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
  console.log('Logo upload request received:', req.files);
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: 'No files were uploaded' });
  }
  next();
}, logoController.uploadLogos);

// Added route to get a single logo by position
router.get('/:position', logoController.getLogoByPosition);

module.exports = router;
