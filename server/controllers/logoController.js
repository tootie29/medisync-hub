
const logoModel = require('../models/logoModel');
const { v4: uuidv4 } = require('uuid');
const fileUtils = require('../utils/fileUtils');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

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
 * Get file system diagnostics for debugging
 */
exports.getUploadDiagnostics = async (req, res) => {
  try {
    const baseDir = process.env.UPLOAD_BASE_DIR || '/home/entrsolu/api.climasys.entrsolutions.com';
    const diagnostics = {
      timestamp: new Date().toISOString(),
      baseDir,
      directories: {}
    };
    
    // Check key directories
    const dirsToCheck = [
      { path: baseDir, name: 'baseDir' },
      { path: path.join(baseDir, 'uploads'), name: 'uploads' },
      { path: path.join(baseDir, 'uploads/assets'), name: 'assets' },
      { path: path.join(baseDir, 'uploads/assets/logos'), name: 'logos' }
    ];
    
    for (const dir of dirsToCheck) {
      diagnostics.directories[dir.name] = await fileUtils.getFileInfo(dir.path);
    }
    
    // Try to write a test file
    const testFilePath = path.join(baseDir, 'uploads/assets/logos', `test-${Date.now()}.txt`);
    try {
      await promisify(fs.writeFile)(testFilePath, 'test');
      diagnostics.writeTest = {
        success: true,
        path: testFilePath
      };
      
      // Try to read it back
      const content = await promisify(fs.readFile)(testFilePath, 'utf8');
      diagnostics.readTest = {
        success: true,
        content
      };
      
      // Clean up
      await promisify(fs.unlink)(testFilePath);
      diagnostics.deleteTest = { success: true };
    } catch (writeError) {
      diagnostics.writeTest = {
        success: false,
        error: writeError.message
      };
    }
    
    // Get current process info
    try {
      diagnostics.process = {
        pid: process.pid,
        uid: process.getuid ? process.getuid() : 'unknown',
        gid: process.getgid ? process.getgid() : 'unknown'
      };
    } catch (e) {
      diagnostics.process = { error: e.message };
    }
    
    res.status(200).json(diagnostics);
  } catch (error) {
    console.error('Error getting upload diagnostics:', error);
    res.status(500).json({ error: 'Failed to get upload diagnostics' });
  }
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
    
    // Directory diagnostics
    const baseDir = process.env.UPLOAD_BASE_DIR || '/home/entrsolu/api.climasys.entrsolutions.com';
    const uploadDir = path.join(baseDir, 'uploads/assets/logos');
    
    // Make sure the directory exists and is writable
    const dirResult = await fileUtils.ensureDirectoryExists(uploadDir);
    if (!dirResult.success) {
      console.error('Upload directory issues:', dirResult);
      return res.status(500).json({
        error: 'Upload directory is not accessible',
        details: dirResult
      });
    }
    
    console.log('Upload directory status:', dirResult);
    
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
  
  // Get file info for diagnostics
  const fileInfo = await fileUtils.getFileInfo(logoFile.path);
  console.log(`${position} logo file info:`, fileInfo);
  
  // If file doesn't exist or isn't readable, abort
  if (!fileInfo.exists || !fileInfo.isReadable) {
    return {
      position: position,
      error: 'File not saved correctly or not readable',
      details: `File issues at ${logoFile.path}`,
      fileInfo
    };
  }
  
  // Define a URL path that will be stored in the database
  // Make sure it's relative to API server
  const baseDir = process.env.UPLOAD_BASE_DIR || '/home/entrsolu/api.climasys.entrsolutions.com';
  let relativePath;
  
  if (logoFile.path.startsWith(baseDir)) {
    // Extract relative path from absolute path
    relativePath = logoFile.path.substring(baseDir.length);
    // Ensure it starts with /
    if (!relativePath.startsWith('/')) {
      relativePath = '/' + relativePath;
    }
  } else {
    // Use default path structure
    relativePath = `/uploads/assets/logos/${logoFile.filename}`;
  }
  
  console.log(`${position} logo relative path: ${relativePath}`);
  
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
  const permissionResult = await fileUtils.ensureFilePermissions(logoFile.path);
  if (!permissionResult) {
    console.warn(`Could not set permissions for ${logoFile.path}, but continuing anyway`);
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
      filename: logoFile.filename,
      path: `${baseUrl}${relativePath}`,
      db_id: id,
      originalFile: logoFile.path,
      relativePath: relativePath
    };
    
  } catch (dbError) {
    console.error(`Database error for ${position} logo:`, dbError);
    return {
      position: position,
      error: 'Database update failed',
      details: dbError.message,
      originalFile: logoFile.path,
      relativePath: relativePath
    };
  }
};
