
const logoModel = require('../models/logoModel');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');

// Convert fs methods to Promise-based for better error handling
const access = promisify(fs.access);
const chmod = promisify(fs.chmod);

// Get all logos
exports.getAllLogos = async (req, res) => {
  try {
    const logos = await logoModel.getAllLogos();
    
    if (!Array.isArray(logos)) {
      console.error('Invalid logos data format:', logos);
      return res.status(500).json({ error: 'Invalid data format from database' });
    }
    
    // Add absolute URLs to the logos
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const logosWithUrls = logos.map(logo => ({
      ...logo,
      url: logo.url.startsWith('http') ? logo.url : `${baseUrl}${logo.url}`
    }));
    
    console.log('Returning logos with URLs:', logosWithUrls);
    res.status(200).json(logosWithUrls);
  } catch (error) {
    console.error('Error fetching logos:', error);
    res.status(500).json({ error: 'Failed to fetch logos' });
  }
};

// Get logo by position
exports.getLogoByPosition = async (req, res) => {
  try {
    const position = req.params.position;
    console.log(`Fetching logo for position: ${position}`);
    
    const logo = await logoModel.getLogoByPosition(position);
    console.log(`Logo found for position ${position}:`, logo);
    
    if (!logo) {
      // Return default logo if not found
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const defaultLogoUrl = `${baseUrl}/uploads/assets/logos/default-logo.png`;
      console.log(`No logo found for ${position}, using default:`, defaultLogoUrl);
      
      return res.status(200).json({
        id: 'default',
        url: defaultLogoUrl,
        position: position
      });
    }
    
    // Add absolute URL to the logo
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    logo.url = logo.url.startsWith('http') ? logo.url : `${baseUrl}${logo.url}`;
    console.log(`Returning logo for ${position} with URL:`, logo.url);
    
    res.status(200).json(logo);
  } catch (error) {
    console.error(`Error fetching logo for position ${req.params.position}:`, error);
    res.status(500).json({ error: 'Failed to fetch logo' });
  }
};

// Upload logos with improved reliability and validation
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

    // Process primary logo
    if (files.primaryLogo && files.primaryLogo[0]) {
      console.log('Processing primary logo');
      const primaryLogo = files.primaryLogo[0];
      console.log('Primary logo file details:', {
        originalName: primaryLogo.originalname,
        mimetype: primaryLogo.mimetype,
        size: primaryLogo.size,
        path: primaryLogo.path
      });
      
      // Define a URL path that will be stored in the database
      const relativePath = `/uploads/assets/logos/${primaryLogo.filename}`;
      
      // Double-check file exists
      if (!fs.existsSync(primaryLogo.path)) {
        console.error(`Primary logo file not found at ${primaryLogo.path}`);
        results.push({
          position: 'primary',
          error: 'File not saved correctly',
          details: `File not found at ${primaryLogo.path}`
        });
      } else {
        console.log(`Primary logo saved at ${primaryLogo.path}`);
        
        // Ensure file has correct permissions
        try {
          fs.chmodSync(primaryLogo.path, 0o644); // rw-r--r--
          console.log(`Set file permissions on: ${primaryLogo.path}`);
        } catch (permErr) {
          console.error(`Could not set file permissions: ${permErr.message}`);
        }
        
        try {
          // Add to database with transaction support
          const id = uuidv4();
          await logoModel.updateLogo({
            id: id,
            url: relativePath,
            position: 'primary'
          });
          
          // Verify update worked
          const verifiedLogo = await logoModel.getLogoByPosition('primary');
          if (!verifiedLogo || verifiedLogo.url !== relativePath) {
            throw new Error('Logo verification failed after database update');
          }
          
          results.push({
            position: 'primary',
            filename: primaryLogo.filename,
            path: `${baseUrl}${relativePath}`,
            db_id: id
          });
          
          console.log('Primary logo successfully updated');
        } catch (dbError) {
          console.error('Database error for primary logo:', dbError);
          results.push({
            position: 'primary',
            error: 'Database update failed',
            details: dbError.message
          });
        }
      }
    }

    // Process secondary logo
    if (files.secondaryLogo && files.secondaryLogo[0]) {
      console.log('Processing secondary logo');
      const secondaryLogo = files.secondaryLogo[0];
      console.log('Secondary logo file details:', {
        originalName: secondaryLogo.originalname,
        mimetype: secondaryLogo.mimetype,
        size: secondaryLogo.size,
        path: secondaryLogo.path
      });
      
      // Define a URL path that will be stored in the database
      const relativePath = `/uploads/assets/logos/${secondaryLogo.filename}`;
      
      // Double-check file exists
      if (!fs.existsSync(secondaryLogo.path)) {
        console.error(`Secondary logo file not found at ${secondaryLogo.path}`);
        results.push({
          position: 'secondary',
          error: 'File not saved correctly',
          details: `File not found at ${secondaryLogo.path}`
        });
      } else {
        console.log(`Secondary logo saved at ${secondaryLogo.path}`);
        
        // Ensure file has correct permissions
        try {
          fs.chmodSync(secondaryLogo.path, 0o644); // rw-r--r--
          console.log(`Set file permissions on: ${secondaryLogo.path}`);
        } catch (permErr) {
          console.error(`Could not set file permissions: ${permErr.message}`);
        }
        
        try {
          // Add to database with transaction support
          const id = uuidv4();
          await logoModel.updateLogo({
            id: id,
            url: relativePath,
            position: 'secondary'
          });
          
          // Verify update worked
          const verifiedLogo = await logoModel.getLogoByPosition('secondary');
          if (!verifiedLogo || verifiedLogo.url !== relativePath) {
            throw new Error('Logo verification failed after database update');
          }
          
          results.push({
            position: 'secondary',
            filename: secondaryLogo.filename,
            path: `${baseUrl}${relativePath}`,
            db_id: id
          });
          
          console.log('Secondary logo successfully updated');
        } catch (dbError) {
          console.error('Database error for secondary logo:', dbError);
          results.push({
            position: 'secondary',
            error: 'Database update failed',
            details: dbError.message
          });
        }
      }
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
