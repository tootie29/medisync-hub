
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Get branding settings
router.get('/branding', settingsController.getBrandingSettings);

// Update branding settings
router.post('/branding', settingsController.updateBrandingSettings);

module.exports = router;
