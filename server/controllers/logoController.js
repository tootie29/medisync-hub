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
    // Ensure proper JSON content type
    res.setHeader('Content-Type', 'application/json');
    
    const logos = await logoModel.getAllLogos();
    
    if (!Array.isArray(logos)) {
      console.error('Invalid logos data format:', logos);
      return res.status(500).json({ error: 'Invalid data format from database' });
    }
    
    // Return the logos directly since they're now base64 strings
    console.log('Returning logos:', logos.length);
    res.status(200).json(logos);
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
    // Ensure proper JSON content type
    res.setHeader('Content-Type', 'application/json');
    
    const position = req.params.position;
    console.log(`Fetching logo for position: ${position}`);
    
    // CRITICAL FIX: Add cache busting headers to prevent browser caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    
    const logo = await logoModel.getLogoByPosition(position);
    console.log(`Logo found for position ${position}:`, logo ? 'Found' : 'Not found');
    
    if (!logo) {
      return getDefaultLogo(req, res, position);
    }
    
    // Return the logo directly (it's already base64)
    console.log(`Returning logo for ${position}`);
    
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
 * Upload client-side stored logos
 */
exports.uploadClientLogos = async (req, res) => {
  console.log('Processing client logo upload request');
  const results = [];
  
  try {
    const { primaryLogo, secondaryLogo } = req.body;
    
    console.log('Logo paths received:',
      primaryLogo ? 'Primary logo path present' : 'No primary logo',
      secondaryLogo ? 'Secondary logo path present' : 'No secondary logo'
    );
    
    // Support both file paths and base64 data
    // Check if we're dealing with base64 data
    const isPrimaryBase64 = primaryLogo && primaryLogo.startsWith('data:image/');
    const isSecondaryBase64 = secondaryLogo && secondaryLogo.startsWith('data:image/');
    
    if (isPrimaryBase64 || isSecondaryBase64) {
      console.log('Detected base64 data, forwarding to base64 handler');
      return exports.uploadBase64Logos(req, res);
    }
    
    // Process logos if provided
    if (primaryLogo) {
      const primaryResult = await processClientLogo(primaryLogo, 'primary');
      results.push(primaryResult);
    }

    if (secondaryLogo) {
      const secondaryResult = await processClientLogo(secondaryLogo, 'secondary');
      results.push(secondaryResult);
    }

    console.log('Logo upload results:', results);
    
    if (results.length === 0) {
      return res.status(400).json({ 
        error: 'No logos were processed',
        details: 'No logo paths were provided',
        success: false
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
    console.error('Error uploading client logos:', error);
    res.status(500).json({ 
      error: 'Failed to process logo uploads', 
      details: error.message,
      success: false
    });
  }
};

/**
 * Process client logo path
 */
const processClientLogo = async (logoPath, position) => {
  console.log(`Processing ${position} logo path:`, logoPath);
  
  try {
    // Verify the path format
    if (!logoPath || typeof logoPath !== 'string') {
      throw new Error(`Invalid logo path format for ${position} logo`);
    }
    
    // Add to database with transaction support
    const id = uuidv4();
    await logoModel.updateLogo({
      id: id,
      url: logoPath,
      position: position
    });
    
    // Verify update worked
    const verifiedLogo = await logoModel.getLogoByPosition(position);
    if (!verifiedLogo) {
      throw new Error('Logo verification failed after database update');
    }
    
    return {
      position: position,
      success: true,
      db_id: id,
      path: logoPath
    };
    
  } catch (error) {
    console.error(`Error processing ${position} logo:`, error);
    return {
      position: position,
      error: 'Processing failed',
      details: error.message,
      success: false
    };
  }
};

/**
 * Upload base64 logos with improved error handling and debugging
 */
exports.uploadBase64Logos = async (req, res) => {
  // Ensure proper JSON content type
  res.setHeader('Content-Type', 'application/json');
  console.log('Processing base64 logo upload request');
  
  try {
    // Ensure content type is set to JSON
    res.setHeader('Content-Type', 'application/json');
    
    // Log the entire request for detailed debugging
    console.log('Full request path:', req.originalUrl);
    console.log('Headers:', JSON.stringify(req.headers));
    
    const { primaryLogo, secondaryLogo } = req.body;
    
    console.log('Base64 data received:',
      primaryLogo ? `Primary logo present (${typeof primaryLogo}, length: ${primaryLogo?.length || 0})` : 'No primary logo',
      secondaryLogo ? `Secondary logo present (${typeof secondaryLogo}, length: ${secondaryLogo?.length || 0})` : 'No secondary logo'
    );
    
    // Process logos if provided
    if (primaryLogo) {
      try {
        console.log('Processing primary logo as base64');
        const primaryResult = await processBase64Logo(primaryLogo, 'primary');
        results.push(primaryResult);
        console.log('Primary logo processing result:', primaryResult.success ? 'Success' : 'Failed');
      } catch (primaryError) {
        console.error('Error processing primary logo:', primaryError);
        results.push({
          position: 'primary',
          error: 'Processing failed',
          details: primaryError.message || 'Unknown error',
          success: false
        });
      }
    }

    if (secondaryLogo) {
      try {
        console.log('Processing secondary logo as base64');
        const secondaryResult = await processBase64Logo(secondaryLogo, 'secondary');
        results.push(secondaryResult);
        console.log('Secondary logo processing result:', secondaryResult.success ? 'Success' : 'Failed');
      } catch (secondaryError) {
        console.error('Error processing secondary logo:', secondaryError);
        results.push({
          position: 'secondary',
          error: 'Processing failed',
          details: secondaryError.message || 'Unknown error',
          success: false
        });
      }
    }

    console.log('Logo upload results:', results);
    
    if (results.length === 0) {
      console.error('No logos were processed in request');
      // Send JSON response with an error message
      return res.status(400).json({ 
        error: 'No logos were processed',
        details: 'No base64 data was provided',
        success: false
      });
    }
    
    // Better response structure with consistent JSON format
    const hasErrors = results.some(result => result.error);
    const successCount = results.filter(result => result.success).length;
    
    // Always return a properly formatted JSON response
    const responseObj = { 
      message: successCount > 0 ? 
        `${successCount} logo(s) processed successfully` : 
        'Failed to process logos',
      success: successCount > 0,
      uploads: results
    };
    
    console.log('Sending response:', JSON.stringify(responseObj));
    // Explicitly set the content type again before sending
    res.setHeader('Content-Type', 'application/json');
    res.status(hasErrors && successCount === 0 ? 400 : 200).json(responseObj);
    
  } catch (error) {
    console.error('Error uploading base64 logos:', error);
    
    // Ensure JSON response even in error case
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: 'Failed to process logo uploads', 
      details: error.message || 'Unknown server error',
      success: false
    });
  }
};

/**
 * Process base64 logo
 */
const processBase64Logo = async (base64Data, position) => {
  console.log(`Processing ${position} logo as base64`);
  
  try {
    // Validate base64 format
    if (!base64Data || !base64Data.startsWith('data:image/')) {
      return {
        position,
        error: 'Invalid base64 format',
        details: 'The data must be a valid base64-encoded image',
        success: false
      };
    }
    
    // Generate a unique ID for this logo
    const id = uuidv4();
    
    console.log(`Adding ${position} logo to database with ID ${id}`);
    console.log(`Base64 data length: ${base64Data.length} characters`);
    
    // CRITICAL FIX: Better error handling for database operations
    try {
      // Add to database with transaction support
      await logoModel.updateLogo({
        id: id,
        url: base64Data, // Store the base64 string directly
        position: position
      });
      
      // Verify update worked by fetching it back
      const verifiedLogo = await logoModel.getLogoByPosition(position);
      
      if (!verifiedLogo) {
        throw new Error('Logo verification failed after database update');
      }
      
      console.log(`${position} logo verified in database with ID: ${verifiedLogo.id}`);
      
      // Return success with standardized format
      return {
        position: position,
        success: true,
        db_id: id
      };
    } catch (dbError) {
      console.error(`Database error for ${position} logo:`, dbError);
      return {
        position: position,
        error: 'Database update failed',
        details: dbError.message || 'Unknown database error',
        success: false
      };
    }
  } catch (error) {
    console.error(`Error processing ${position} logo:`, error);
    return {
      position: position,
      error: 'Processing failed',
      details: error.message || 'Unknown error',
      success: false
    };
  }
};

/**
 * Upload logos (file upload method - keeping this for backwards compatibility)
 */
exports.uploadLogos = async (req, res) => {
  // Ensure proper JSON content type
  res.setHeader('Content-Type', 'application/json');
  console.log('Processing logo upload request');
  
  const files = req.files;
  const results = [];
  
  try {
    console.log('Files received for upload:', files ? Object.keys(files).length : 'none', files);
    
    if (!files || Object.keys(files).length === 0) {
      console.error('No files were provided in the request');
      return res.status(400).json({ error: 'No files were uploaded', success: false });
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
        details: dirResult,
        success: false
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
        details: 'No files were successfully processed',
        success: false
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
 * Process individual logo upload (legacy file method)
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

/**
 * New simplified controller method for single logo upload
 */
exports.uploadSingleLogo = async (req, res) => {
  // Always ensure proper JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      error: 'No file was uploaded' 
    });
  }
  
  const position = req.params.position;
  if (!position || !['primary', 'secondary'].includes(position)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid logo position. Must be "primary" or "secondary"' 
    });
  }
  
  try {
    console.log(`Logo upload for ${position} received:`, req.file.originalname);
    
    // Process the uploaded file
    const baseDir = process.env.UPLOAD_BASE_DIR || 
                   (process.env.NODE_ENV === 'production' ? 
                    '/home/entrsolu/api.climasys.entrsolutions.com' : 
                    path.join(__dirname, '../'));
                    
    // Define URLs properly
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Get the relative path to the file
    let relativePath;
    if (req.file.path.startsWith(baseDir)) {
      relativePath = req.file.path.substring(baseDir.length);
      if (!relativePath.startsWith('/')) {
        relativePath = '/' + relativePath;
      }
    } else {
      // Default path construction
      relativePath = `/uploads/assets/logos/${req.file.filename}`;
    }
    
    // Verify file exists
    if (!fs.existsSync(req.file.path)) {
      return res.status(500).json({ 
        success: false, 
        error: 'File saved but not accessible',
        details: { path: req.file.path }
      });
    }
    
    const filePath = `${baseUrl}${relativePath}`;
    console.log(`File accessible at: ${filePath}`);
    
    // Update database with transaction
    const logoId = uuidv4();
    await logoModel.updateLogo({
      id: logoId,
      url: relativePath, // Store the relative path
      position: position
    });
    
    // Verify update was successful
    const savedLogo = await logoModel.getLogoByPosition(position);
    if (!savedLogo || savedLogo.url !== relativePath) {
      return res.status(500).json({ 
        success: false, 
        error: 'Database update verification failed',
        savedLogo 
      });
    }
    
    // Return success with file path
    return res.status(200).json({
      success: true,
      message: `${position} logo uploaded successfully`,
      logoId: logoId,
      filePath: filePath,
      relativePath: relativePath
    });
    
  } catch (error) {
    console.error(`Error processing ${position} logo upload:`, error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Server error processing file upload' 
    });
  }
};

/**
 * New simplified controller method for single base64 upload
 */
exports.uploadSingleBase64Logo = async (req, res) => {
  // Always ensure proper JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  const position = req.params.position;
  if (!position || !['primary', 'secondary'].includes(position)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid logo position. Must be "primary" or "secondary"' 
    });
  }
  
  try {
    // Get base64 data from the appropriate field
    const base64Data = req.body[position + 'Logo'] || req.body.data;
    if (!base64Data || !base64Data.startsWith('data:image/')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or missing base64 image data' 
      });
    }
    
    console.log(`Processing ${position} logo base64 upload, data length: ${base64Data.length}`);
    
    // Generate ID and update database
    const logoId = uuidv4();
    await logoModel.updateLogo({
      id: logoId,
      url: base64Data,
      position: position
    });
    
    // Verify update was successful
    const savedLogo = await logoModel.getLogoByPosition(position);
    if (!savedLogo) {
      return res.status(500).json({ 
        success: false, 
        error: 'Database update verification failed' 
      });
    }
    
    // Return success
    return res.status(200).json({
      success: true,
      message: `${position} logo saved successfully`,
      logoId: logoId
    });
    
  } catch (error) {
    console.error(`Error processing ${position} base64 logo:`, error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Server error processing base64 upload' 
    });
  }
};
