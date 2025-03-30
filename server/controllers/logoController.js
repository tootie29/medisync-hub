
const logoModel = require('../models/logoModel');
const { v4: uuidv4 } = require('uuid');
const fileUtils = require('../utils/fileUtils');
const path = require('path');
const fs = require('fs');

/**
 * Get all logos
 */
exports.getAllLogos = async (req, res) => {
  try {
    // Log file system details before handling the request
    await fileUtils.logFileSystemDetails();
    
    const logos = await logoModel.getAllLogos();
    
    if (!Array.isArray(logos)) {
      console.error('Invalid logos data format:', logos);
      return res.status(500).json({ error: 'Invalid data format from database' });
    }
    
    // Add absolute URLs to the logos
    const logosWithUrls = logos.map(logo => ({
      ...logo,
      url: fileUtils.getAbsoluteUrl(req, logo.url)
    }));
    
    console.log('Returning logos with URLs:', logosWithUrls);
    res.status(200).json(logosWithUrls);
  } catch (error) {
    console.error('Error fetching logos:', error);
    res.status(500).json({ error: 'Failed to fetch logos' });
  }
};

/**
 * Get logo by position
 */
exports.getLogoByPosition = async (req, res) => {
  try {
    const position = req.params.position;
    console.log(`Fetching logo for position: ${position}`);
    
    const logo = await logoModel.getLogoByPosition(position);
    console.log(`Logo found for position ${position}:`, logo);
    
    if (!logo) {
      return getDefaultLogo(req, res, position);
    }
    
    // Add absolute URL to the logo
    logo.url = fileUtils.getAbsoluteUrl(req, logo.url);
    console.log(`Returning logo for ${position} with URL:`, logo.url);
    
    res.status(200).json(logo);
  } catch (error) {
    console.error(`Error fetching logo for position ${req.params.position}:`, error);
    res.status(500).json({ error: 'Failed to fetch logo' });
  }
};

/**
 * Return default logo when no logo is found
 */
const getDefaultLogo = (req, res, position) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const defaultLogoUrl = `${baseUrl}/uploads/assets/logos/default-logo.png`;
  console.log(`No logo found for ${position}, using default:`, defaultLogoUrl);
  
  return res.status(200).json({
    id: 'default',
    url: defaultLogoUrl,
    position: position
  });
};

/**
 * Upload logos
 */
exports.uploadLogos = async (req, res) => {
  console.log('Processing logo upload request');
  const files = req.files;
  const results = [];
  
  try {
    console.log('Files received for upload:', files ? Object.keys(files).length : 'none');
    
    if (!files || Object.keys(files).length === 0) {
      console.error('No files were provided in the request');
      return res.status(400).json({ error: 'No files were uploaded' });
    }
    
    // Get server base URL and upload info
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadInfo = req.uploadInfo || {};
    
    console.log('Upload info from request:', uploadInfo);
    
    // Log the file system details before upload
    await fileUtils.logFileSystemDetails();
    
    // Ensure the upload directory exists with proper permissions
    const isProduction = process.env.NODE_ENV === 'production';
    const baseDir = process.env.UPLOAD_BASE_DIR || 
                    (isProduction ? '/home/entrsolu/api.climasys.entrsolutions.com' : path.join(__dirname, '../../'));
    const uploadsPath = path.join(baseDir, 'uploads', 'assets', 'logos');
    
    console.log(`Ensuring upload directory exists: ${uploadsPath}`);
    const dirOk = await fileUtils.ensureDirectoryExists(uploadsPath);
    
    if (!dirOk) {
      console.error(`Failed to ensure upload directory exists and is writable: ${uploadsPath}`);
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Could not create or access the upload directory',
        path: uploadsPath
      });
    }

    // Process logos with enhanced error handling
    if (files.primaryLogo && files.primaryLogo[0]) {
      const primaryResult = await processLogoUpload(req, files.primaryLogo[0], 'primary', baseUrl, uploadsPath);
      results.push(primaryResult);
    }

    if (files.secondaryLogo && files.secondaryLogo[0]) {
      const secondaryResult = await processLogoUpload(req, files.secondaryLogo[0], 'secondary', baseUrl, uploadsPath);
      results.push(secondaryResult);
    }

    console.log('Logo upload results:', results);
    
    if (results.length === 0) {
      return res.status(500).json({ 
        error: 'No logos were processed',
        details: 'No files were successfully processed'
      });
    }
    
    // Return results
    const hasErrors = results.some(result => result.error);
    res.status(hasErrors ? 207 : 200).json({ 
      message: 'Logos processed',
      success: !hasErrors,
      uploads: results
    });
    
  } catch (error) {
    console.error('Error uploading logos:', error);
    res.status(500).json({ 
      error: 'Failed to upload logos', 
      details: error.message 
    });
  }
};

/**
 * Process individual logo upload with improved error handling
 */
const processLogoUpload = async (req, logoFile, position, baseUrl, uploadsPath) => {
  console.log(`Processing ${position} logo`);
  console.log(`${position} logo file details:`, {
    originalName: logoFile.originalname,
    mimetype: logoFile.mimetype,
    size: logoFile.size,
    path: logoFile.path
  });
  
  // Handle the case where multer saved the file but with a temporary name
  // We want to move it to our uploads directory with a proper name
  const fileExt = path.extname(logoFile.originalname);
  const safeFileName = `${position}-logo-${Date.now()}${fileExt}`;
  const finalFilePath = path.join(uploadsPath, safeFileName);
  const relativePath = `/uploads/assets/logos/${safeFileName}`;
  
  try {
    // Check if the source file exists
    if (!fileUtils.verifyFileExists(logoFile.path)) {
      return {
        position: position,
        error: 'Source file not found',
        details: `File not found at ${logoFile.path}`
      };
    }
    
    // Try to copy the file to its final destination
    const sourceContents = fs.readFileSync(logoFile.path);
    fs.writeFileSync(finalFilePath, sourceContents);
    
    console.log(`${position} logo copied to: ${finalFilePath}`);
    
    // Ensure file has correct permissions
    const permOk = await fileUtils.ensureFilePermissions(finalFilePath);
    if (!permOk) {
      console.warn(`Warning: Could not set permissions on ${finalFilePath}`);
    }
    
    // Verify the file was created successfully
    if (!fileUtils.verifyFileExists(finalFilePath)) {
      return {
        position: position,
        error: 'File copy failed',
        details: `File was not copied correctly to ${finalFilePath}`
      };
    }
    
    try {
      // Add to database with transaction support
      const id = uuidv4();
      await logoModel.updateLogo({
        id: id,
        url: relativePath,
        position: position
      });
      
      // Verify update worked
      const verifiedLogo = await logoModel.getLogoByPosition(position);
      if (!verifiedLogo || verifiedLogo.url !== relativePath) {
        throw new Error('Logo verification failed after database update');
      }
      
      return {
        position: position,
        filename: safeFileName,
        path: `${baseUrl}${relativePath}`,
        db_id: id
      };
      
    } catch (dbError) {
      console.error(`Database error for ${position} logo:`, dbError);
      return {
        position: position,
        error: 'Database update failed',
        details: dbError.message
      };
    }
  } catch (error) {
    console.error(`Error processing ${position} logo:`, error);
    return {
      position: position,
      error: 'File processing failed',
      details: error.message
    };
  }
};
