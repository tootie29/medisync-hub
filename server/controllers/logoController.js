
const logoModel = require('../models/logoModel');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/logos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all logos
exports.getAllLogos = async (req, res) => {
  try {
    const logos = await logoModel.getAllLogos();
    res.status(200).json(logos);
  } catch (error) {
    console.error('Error fetching logos:', error);
    res.status(500).json({ error: 'Failed to fetch logos' });
  }
};

// Upload new logos
exports.uploadLogos = async (req, res) => {
  try {
    const files = req.files;
    const results = [];

    // Process primary logo if uploaded
    if (files.primaryLogo && files.primaryLogo[0]) {
      const primaryLogo = files.primaryLogo[0];
      const relativePath = `/uploads/logos/${primaryLogo.filename}`;
      
      // Save to database
      const logoId = uuidv4();
      await logoModel.updateLogo({
        id: logoId,
        url: relativePath,
        position: 'primary'
      });
      
      results.push({
        position: 'primary',
        filename: primaryLogo.filename,
        path: relativePath
      });
    }

    // Process secondary logo if uploaded
    if (files.secondaryLogo && files.secondaryLogo[0]) {
      const secondaryLogo = files.secondaryLogo[0];
      const relativePath = `/uploads/logos/${secondaryLogo.filename}`;
      
      // Save to database
      const logoId = uuidv4();
      await logoModel.updateLogo({
        id: logoId,
        url: relativePath,
        position: 'secondary'
      });
      
      results.push({
        position: 'secondary',
        filename: secondaryLogo.filename,
        path: relativePath
      });
    }

    res.status(200).json({ 
      message: 'Logos uploaded successfully',
      uploads: results
    });
  } catch (error) {
    console.error('Error uploading logos:', error);
    res.status(500).json({ error: 'Failed to upload logos' });
  }
};
