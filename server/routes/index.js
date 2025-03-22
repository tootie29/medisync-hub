
const express = require('express');
const router = express.Router();

// Import routes
const userRoutes = require('./userRoutes');
const medicalRecordRoutes = require('./medicalRecordRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const medicineRoutes = require('./medicineRoutes');
const settingsRoutes = require('./settingsRoutes');

// Register routes
router.use('/users', userRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/medicines', medicineRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
