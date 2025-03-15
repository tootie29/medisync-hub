
const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');

// Get all medical records
router.get('/', medicalRecordController.getAllMedicalRecords);

// Get medical record by ID
router.get('/:id', medicalRecordController.getMedicalRecordById);

// Get medical records by patient ID
router.get('/patient/:patientId', medicalRecordController.getMedicalRecordsByPatientId);

// Create new medical record
router.post('/', medicalRecordController.createMedicalRecord);

// Update medical record
router.put('/:id', medicalRecordController.updateMedicalRecord);

// Delete medical record
router.delete('/:id', medicalRecordController.deleteMedicalRecord);

module.exports = router;
