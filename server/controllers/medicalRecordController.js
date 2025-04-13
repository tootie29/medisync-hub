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
    let patientId = req.params.patientId;
    console.log('Original patientId parameter:', patientId);
    
    // Handle both formats of patient ID (with or without prefix)
    if (patientId.startsWith('user-')) {
      console.log('Patient ID has user- prefix, will handle appropriately');
      // We'll keep the ID as is for consistent lookups
    }
    
    console.log('Looking up records for patient ID:', patientId);
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
    console.log('Creating medical record with data:', JSON.stringify(recordData));
    
    // ***** CRITICAL FIX: Validate and sanitize input data *****
    if (!recordData.patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }
    
    // Handle certificateEnabled explicitly
    if ('certificateEnabled' in recordData) {
      recordData.certificateEnabled = recordData.certificateEnabled === true || 
                                      recordData.certificateEnabled === 'true' || 
                                      recordData.certificateEnabled === 1;
      console.log('Certificate enabled status explicitly set to:', recordData.certificateEnabled);
    }
    
    // Handle patientId format - preserve format from client to ensure consistent lookups
    if (recordData.patientId) {
      console.log('Original patientId from client:', recordData.patientId);
      // Keep the patientId as is to maintain the same format sent by the client
    }
    
    // Check for required numeric fields
    recordData.height = parseFloat(recordData.height) || 0;
    recordData.weight = parseFloat(recordData.weight) || 0;
    
    if (!recordData.height || !recordData.weight) {
      return res.status(400).json({ message: 'Valid height and weight are required' });
    }
    
    // Ensure date is present
    if (!recordData.date) {
      recordData.date = new Date().toISOString().split('T')[0];
    }
    
    // Ensure doctorId is present
    if (!recordData.doctorId) {
      recordData.doctorId = 'self-recorded';
    }
    
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
    console.log('Update data RECEIVED FROM CLIENT:', JSON.stringify(recordData));
    
    // *** CRITICAL FIX: Handle certificateEnabled properly ***
    // Explicitly handle certificateEnabled as a boolean
    if ('certificateEnabled' in recordData) {
      // Convert any truthy/falsy value to a strict boolean
      const rawValue = recordData.certificateEnabled;
      recordData.certificateEnabled = rawValue === true || 
                                    rawValue === 'true' || 
                                    rawValue === 1;
      console.log('Certificate status explicitly set to:', recordData.certificateEnabled);
      console.log('Original certificate value was:', rawValue);
      console.log('Type of original certificate value:', typeof rawValue);
    }
    
    // Log the final data being sent to the model
    console.log('Final update data being sent to model:', JSON.stringify(recordData));
    
    const updatedRecord = await medicalRecordModel.update(recordId, recordData);
    
    if (!updatedRecord) {
      console.error('Model returned null or undefined for updated record');
      return res.status(404).json({ message: 'Medical record not found' });
    }
    
    console.log('Medical record updated successfully:', JSON.stringify(updatedRecord));
    console.log('Certificate status in response:', updatedRecord.certificateEnabled);
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
