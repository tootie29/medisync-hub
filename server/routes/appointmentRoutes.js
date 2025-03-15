
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Get all appointments
router.get('/', appointmentController.getAllAppointments);

// Get appointment by ID
router.get('/:id', appointmentController.getAppointmentById);

// Get appointments by patient ID
router.get('/patient/:patientId', appointmentController.getAppointmentsByPatientId);

// Get appointments by doctor ID
router.get('/doctor/:doctorId', appointmentController.getAppointmentsByDoctorId);

// Create new appointment
router.post('/', appointmentController.createAppointment);

// Update appointment
router.put('/:id', appointmentController.updateAppointment);

// Delete appointment
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;
