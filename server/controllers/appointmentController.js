
const appointmentModel = require('../models/appointmentModel');

exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await appointmentModel.getAll();
    res.json(appointments);
  } catch (error) {
    console.error('Error in getAllAppointments controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await appointmentModel.getById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Error in getAppointmentById controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAppointmentsByPatientId = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const appointments = await appointmentModel.getByPatientId(patientId);
    res.json(appointments);
  } catch (error) {
    console.error('Error in getAppointmentsByPatientId controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAppointmentsByDoctorId = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const appointments = await appointmentModel.getByDoctorId(doctorId);
    res.json(appointments);
  } catch (error) {
    console.error('Error in getAppointmentsByDoctorId controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const appointmentData = req.body;
    console.log('Received appointment data:', appointmentData);
    
    // Validate required fields
    if (!appointmentData.patientId || !appointmentData.doctorId || 
        !appointmentData.date || !appointmentData.startTime || 
        !appointmentData.endTime || !appointmentData.status || 
        !appointmentData.reason) {
      return res.status(400).json({ 
        message: 'Missing required fields. patientId, doctorId, date, startTime, endTime, status, and reason are required.' 
      });
    }
    
    // Create the appointment
    const newAppointment = await appointmentModel.create(appointmentData);
    console.log('Created appointment:', newAppointment);
    
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Error in createAppointment controller:', error);
    
    // Handle foreign key error specifically
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: 'Invalid patient or doctor ID. The user IDs must exist in the database.',
        details: error.sqlMessage,
        error: error.message 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointmentData = req.body;
    
    console.log('Updating appointment:', appointmentId, appointmentData);
    
    const updatedAppointment = await appointmentModel.update(appointmentId, appointmentData);
    
    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error in updateAppointment controller:', error);
    
    // Handle foreign key error
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        message: 'Invalid patient or doctor ID. The user IDs must exist in the database.',
        error: error.message 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const deleted = await appointmentModel.delete(appointmentId);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAppointment controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
