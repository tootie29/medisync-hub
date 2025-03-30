
const logoModel = require('../models/logoModel');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists with a professional path structure
const uploadsDir = path.join(__dirname, '../uploads/assets/logos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Default logo path to use when no logo is found - using a professional path
const defaultLogoPath = '/uploads/assets/logos/default-logo.png';
const defaultLogoFilePath = path.join(__dirname, '..', defaultLogoPath);

// Ensure the default logo exists in the server uploads folder
if (!fs.existsSync(defaultLogoFilePath)) {
  try {
    // Create a basic default logo if none exists
    // Here we're just ensuring the directory exists
    if (!fs.existsSync(path.dirname(defaultLogoFilePath))) {
      fs.mkdirSync(path.dirname(defaultLogoFilePath), { recursive: true });
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
    
    console.log('Files received for upload:', files);
    
    // Get server base URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    // Process primary logo if uploaded
    if (files.primaryLogo && files.primaryLogo[0]) {
      const primaryLogo = files.primaryLogo[0];
      const relativePath = `/uploads/assets/logos/${primaryLogo.filename}`;
      
      // Log the file details for debugging
      console.log('Uploaded primary logo:', {
        originalname: primaryLogo.originalname,
        filename: primaryLogo.filename,
        path: primaryLogo.path,
        relativePath: relativePath,
        fullUrl: `${baseUrl}${relativePath}`
      });
      
      // Save to database
      const logoId = uuidv4();
      const updatedId = await logoModel.updateLogo({
        id: logoId,
        url: relativePath,
        position: 'primary'
      });
      
      console.log('Primary logo saved to database with ID:', updatedId);
      
      results.push({
        position: 'primary',
        filename: primaryLogo.filename,
        path: `${baseUrl}${relativePath}`
      });
    }

    // Process secondary logo if uploaded
    if (files.secondaryLogo && files.secondaryLogo[0]) {
      const secondaryLogo = files.secondaryLogo[0];
      const relativePath = `/uploads/assets/logos/${secondaryLogo.filename}`;
      
      // Log the file details for debugging
      console.log('Uploaded secondary logo:', {
        originalname: secondaryLogo.originalname,
        filename: secondaryLogo.filename,
        path: secondaryLogo.path,
        relativePath: relativePath,
        fullUrl: `${baseUrl}${relativePath}`
      });
      
      // Save to database
      const logoId = uuidv4();
      const updatedId = await logoModel.updateLogo({
        id: logoId,
        url: relativePath,
        position: 'secondary'
      });
      
      console.log('Secondary logo saved to database with ID:', updatedId);
      
      results.push({
        position: 'secondary',
        filename: secondaryLogo.filename,
        path: `${baseUrl}${relativePath}`
      });
    }

    console.log('Logo upload results:', results);
    
    res.status(200).json({ 
      message: 'Logos uploaded successfully',
      uploads: results
    });
  } catch (error) {
    console.error('Error uploading logos:', error);
    res.status(500).json({ error: 'Failed to upload logos', details: error.message });
  }
};
