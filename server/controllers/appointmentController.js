
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
    const newAppointment = await appointmentModel.create(appointmentData);
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Error in createAppointment controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointmentData = req.body;
    
    console.log(`Updating appointment ${appointmentId} with data:`, JSON.stringify(appointmentData));
    
    // Handle special status transitions
    if (appointmentData.status) {
      console.log(`Status change requested to: ${appointmentData.status}`);
      
      // You could add additional logic here for specific status transitions
      // For example, if status changes to "completed", you might want to
      // automatically suggest creating a medical record
    }
    
    const updatedAppointment = await appointmentModel.update(appointmentId, appointmentData);
    
    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error in updateAppointment controller:', error);
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
