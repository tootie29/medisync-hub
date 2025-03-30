
const logoModel = require('../models/logoModel');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists with a professional path structure
const uploadsDir = path.join(__dirname, '..', 'uploads', 'assets', 'logos');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
    console.log(`Created uploads directory: ${uploadsDir}`);
  }
} catch (error) {
  console.error('Error creating uploads directory:', error);
}

// Default logo path to use when no logo is found
const defaultLogoPath = '/uploads/assets/logos/default-logo.png';
const defaultLogoFilePath = path.join(__dirname, '..', defaultLogoPath);

// Ensure the default logo exists in the server uploads folder
if (!fs.existsSync(defaultLogoFilePath)) {
  try {
    // Create a basic default logo if none exists
    if (!fs.existsSync(path.dirname(defaultLogoFilePath))) {
      fs.mkdirSync(path.dirname(defaultLogoFilePath), { recursive: true, mode: 0o755 });
    }
    console.log('Default logo not found, will use fallback paths');
  } catch (error) {
    console.error('Error setting up default logo:', error);
  }
}

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
      const defaultLogoUrl = `${baseUrl}${defaultLogoPath}`;
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

// Upload new logos
exports.uploadLogos = async (req, res) => {
  try {
    const files = req.files;
    const results = [];
    
    console.log('Files received for upload:', JSON.stringify(files, null, 2));
    
    if (!files || ((!files.primaryLogo || files.primaryLogo.length === 0) && 
                  (!files.secondaryLogo || files.secondaryLogo.length === 0))) {
      return res.status(400).json({ error: 'No files were uploaded' });
    }
    
    // Verify the uploads directory exists one more time
    if (!fs.existsSync(uploadsDir)) {
      try {
        fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
        console.log(`Created uploads directory for files in controller: ${uploadsDir}`);
      } catch (dirError) {
        console.error('Failed to create uploads directory in controller:', dirError);
        return res.status(500).json({ error: 'Server error: Failed to create upload directory' });
      }
    }
    
    // Get server base URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Process primary logo if uploaded
    if (files.primaryLogo && files.primaryLogo[0]) {
      const primaryLogo = files.primaryLogo[0];
      const relativePath = `/uploads/assets/logos/${primaryLogo.filename}`;
      
      // Log the file details for debugging
      console.log('Processing primary logo:', {
        originalname: primaryLogo.originalname,
        filename: primaryLogo.filename,
        path: primaryLogo.path,
        relativePath: relativePath,
        fullUrl: `${baseUrl}${relativePath}`
      });
      
      // Verify file exists
      if (!fs.existsSync(primaryLogo.path)) {
        console.error(`Primary logo file does not exist at path: ${primaryLogo.path}`);
        results.push({
          position: 'primary',
          error: 'File not saved to disk properly',
          details: primaryLogo.path
        });
      } else {
        console.log(`Primary logo file exists at path: ${primaryLogo.path}`);
        
        // Save to database
        try {
          const updatedId = await logoModel.updateLogo({
            id: uuidv4(),
            url: relativePath,
            position: 'primary'
          });
          
          console.log('Primary logo saved to database with ID:', updatedId);
          
          // Verify the database update worked by fetching the logo
          const verifiedLogo = await logoModel.getLogoByPosition('primary');
          if (verifiedLogo && verifiedLogo.url === relativePath) {
            console.log('Verified primary logo in database:', verifiedLogo);
            
            results.push({
              position: 'primary',
              filename: primaryLogo.filename,
              path: `${baseUrl}${relativePath}`,
              db_id: updatedId
            });
          } else {
            console.error('Database verification failed for primary logo:', verifiedLogo);
            results.push({
              position: 'primary',
              error: 'Database verification failed',
              details: 'Logo was not properly stored in database'
            });
          }
        } catch (dbError) {
          console.error('Database error saving primary logo:', dbError);
          results.push({
            position: 'primary',
            error: 'Database update failed',
            details: dbError.message
          });
        }
      }
    }

    // Process secondary logo if uploaded
    if (files.secondaryLogo && files.secondaryLogo[0]) {
      const secondaryLogo = files.secondaryLogo[0];
      const relativePath = `/uploads/assets/logos/${secondaryLogo.filename}`;
      
      // Log the file details for debugging
      console.log('Processing secondary logo:', {
        originalname: secondaryLogo.originalname,
        filename: secondaryLogo.filename,
        path: secondaryLogo.path,
        relativePath: relativePath,
        fullUrl: `${baseUrl}${relativePath}`
      });
      
      // Verify file exists
      if (!fs.existsSync(secondaryLogo.path)) {
        console.error(`Secondary logo file does not exist at path: ${secondaryLogo.path}`);
        results.push({
          position: 'secondary',
          error: 'File not saved to disk properly',
          details: secondaryLogo.path
        });
      } else {
        console.log(`Secondary logo file exists at path: ${secondaryLogo.path}`);
        
        // Save to database
        try {
          const updatedId = await logoModel.updateLogo({
            id: uuidv4(),
            url: relativePath,
            position: 'secondary'
          });
          
          console.log('Secondary logo saved to database with ID:', updatedId);
          
          // Verify the database update worked by fetching the logo
          const verifiedLogo = await logoModel.getLogoByPosition('secondary');
          if (verifiedLogo && verifiedLogo.url === relativePath) {
            console.log('Verified secondary logo in database:', verifiedLogo);
            
            results.push({
              position: 'secondary',
              filename: secondaryLogo.filename,
              path: `${baseUrl}${relativePath}`,
              db_id: updatedId
            });
          } else {
            console.error('Database verification failed for secondary logo:', verifiedLogo);
            results.push({
              position: 'secondary',
              error: 'Database verification failed',
              details: 'Logo was not properly stored in database'
            });
          }
        } catch (dbError) {
          console.error('Database error saving secondary logo:', dbError);
          results.push({
            position: 'secondary',
            error: 'Database update failed',
            details: dbError.message
          });
        }
      }
    }

    console.log('Logo upload results:', results);
    
    // Check if any uploads were successful
    if (results.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to process logo uploads',
        details: 'No files were successfully processed'
      });
    }
    
    // Check if any errors occurred
    const hasErrors = results.some(result => result.error);
    if (hasErrors) {
      console.warn('Some logo uploads had errors:', results);
    }
    
    res.status(200).json({ 
      message: 'Logos processed',
      success: !hasErrors,
      uploads: results
    });
  } catch (error) {
    console.error('Error uploading logos:', error);
    res.status(500).json({ error: 'Failed to upload logos', details: error.message });
  }
};
