
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
    
    // Ensure the upload directory exists with proper permissions
    const isProduction = process.env.NODE_ENV === 'production';
    const baseDir = process.env.UPLOAD_BASE_DIR || 
                    (isProduction ? '/home/entrsolu/api.climasys.entrsolutions.com' : path.join(__dirname, '../../'));
    const uploadsPath = path.join(baseDir, 'uploads', 'assets', 'logos');
    
    console.log(`Ensuring upload directory exists: ${uploadsPath}`);
    await fileUtils.ensureDirectoryExists(uploadsPath);

    // Process logos
    if (files.primaryLogo && files.primaryLogo[0]) {
      const primaryResult = await processLogoUpload(req, files.primaryLogo[0], 'primary', baseUrl);
      results.push(primaryResult);
    }

    if (files.secondaryLogo && files.secondaryLogo[0]) {
      const secondaryResult = await processLogoUpload(req, files.secondaryLogo[0], 'secondary', baseUrl);
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
 * Process individual logo upload
 */
const processLogoUpload = async (req, logoFile, position, baseUrl) => {
  console.log(`Processing ${position} logo`);
  console.log(`${position} logo file details:`, {
    originalName: logoFile.originalname,
    mimetype: logoFile.mimetype,
    size: logoFile.size,
    path: logoFile.path
  });
  
  // Define a URL path that will be stored in the database
  const relativePath = `/uploads/assets/logos/${logoFile.filename}`;
  
  // Double-check file exists
  if (!fileUtils.verifyFileExists(logoFile.path)) {
    return {
      position: position,
      error: 'File not saved correctly',
      details: `File not found at ${logoFile.path}`
    };
  }
  
  console.log(`${position} logo saved at ${logoFile.path}`);
  
  // Ensure file has correct permissions
  await fileUtils.ensureFilePermissions(logoFile.path);
  
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
      filename: logoFile.filename,
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
};
