
const medicalRecordModel = require('../models/medicalRecordModel');

exports.getAllMedicalRecords = async (req, res) => {
  try {
    const records = await medicalRecordModel.getAll();
    res.json(records);
  } catch (error) {
    console.error('Error in getAllMedicalRecords controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMedicalRecordById = async (req, res) => {
  try {
    const recordId = req.params.id;
    const record = await medicalRecordModel.getById(recordId);
    
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Error in getMedicalRecordById controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMedicalRecordsByPatientId = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const records = await medicalRecordModel.getByPatientId(patientId);
    res.json(records);
  } catch (error) {
    console.error('Error in getMedicalRecordsByPatientId controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createMedicalRecord = async (req, res) => {
  try {
    const recordData = req.body;
    console.log('Creating medical record with data:', recordData);
    const newRecord = await medicalRecordModel.create(recordData);
    console.log('Medical record created:', newRecord);
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error in createMedicalRecord controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateMedicalRecord = async (req, res) => {
  try {
    const recordId = req.params.id;
    const recordData = req.body;
    console.log('Updating medical record with ID:', recordId);
    console.log('Update data:', recordData);
    
    // *** CRITICAL FIX: Handle certificateEnabled properly ***
    // Explicitly handle certificateEnabled as a boolean
    if ('certificateEnabled' in recordData) {
      // Convert any truthy/falsy value to a strict boolean
      recordData.certificateEnabled = recordData.certificateEnabled === true || recordData.certificateEnabled === 'true' || recordData.certificateEnabled === 1;
      console.log('Certificate status set to:', recordData.certificateEnabled);
    }
    
    // Log the final data being sent to the model
    console.log('Final update data being sent to model:', JSON.stringify(recordData));
    
    const updatedRecord = await medicalRecordModel.update(recordId, recordData);
    
    if (!updatedRecord) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    console.log('Medical record updated:', updatedRecord);
    res.json(updatedRecord);
  } catch (error) {
    console.error('Error in updateMedicalRecord controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteMedicalRecord = async (req, res) => {
  try {
    const recordId = req.params.id;
    const deleted = await medicalRecordModel.delete(recordId);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    res.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    console.error('Error in deleteMedicalRecord controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
