
const path = require('path');
const fs = require('fs').promises;
const settingsModel = require('../models/settingsModel');

// Path where uploaded images will be stored
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');

// Get branding settings
exports.getBrandingSettings = async (req, res) => {
  try {
    const brandingSettings = await settingsModel.getBrandingSettings();
    res.status(200).json(brandingSettings);
  } catch (error) {
    console.error('Error fetching branding settings:', error);
    res.status(500).json({ error: 'Failed to fetch branding settings' });
  }
};

// Update branding settings
exports.updateBrandingSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    // If there's a new logo that's a data URL, save it to the file system
    if (settings.primaryLogo && settings.primaryLogo.startsWith('data:image')) {
      const primaryLogoPath = await saveImageFromDataUrl(settings.primaryLogo, 'primary-logo');
      settings.primaryLogo = primaryLogoPath;
    }
    
    if (settings.secondaryLogo && settings.secondaryLogo.startsWith('data:image')) {
      const secondaryLogoPath = await saveImageFromDataUrl(settings.secondaryLogo, 'secondary-logo');
      settings.secondaryLogo = secondaryLogoPath;
    }
    
    await settingsModel.updateBrandingSettings(settings);
    
    res.status(200).json({ message: 'Branding settings updated successfully' });
  } catch (error) {
    console.error('Error updating branding settings:', error);
    res.status(500).json({ error: 'Failed to update branding settings' });
  }
};

// Helper function to save an image from a data URL
async function saveImageFromDataUrl(dataUrl, prefix) {
  try {
    // Ensure the upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    
    const matches = dataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid data URL');
    }
    
    const extension = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `${prefix}-${timestamp}.${extension}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    
    // Write the file
    await fs.writeFile(filepath, buffer);
    
    // Return the public URL path
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
}
