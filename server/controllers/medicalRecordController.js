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
    
    // Always use the patient ID as is, regardless of prefix format
    console.log('Using patient ID as provided:', patientId);
    
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
    console.log('=== CREATE MEDICAL RECORD DEBUG ===');
    console.log('Raw request body:', JSON.stringify(recordData, null, 2));
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    
    // ***** VACCINATION DEBUG: Check vaccination data specifically *****
    if (recordData.vaccinations) {
      console.log('=== VACCINATION DATA DEBUG ===');
      console.log('Number of vaccinations:', recordData.vaccinations.length);
      console.log('Vaccination data:', JSON.stringify(recordData.vaccinations, null, 2));
      
      recordData.vaccinations.forEach((vac, index) => {
        console.log(`Vaccination ${index + 1}:`, {
          id: vac.id,
          name: vac.name,
          dateAdministered: vac.dateAdministered,
          doseNumber: vac.doseNumber,
          manufacturer: vac.manufacturer,
          lotNumber: vac.lotNumber,
          administeredBy: vac.administeredBy,
          notes: vac.notes
        });
      });
      console.log('===============================');
    } else {
      console.log('NO VACCINATION DATA FOUND in request');
    }
    
    console.log('=====================================');
    
    // ***** CRITICAL FIX: Validate and sanitize input data *****
    if (!recordData.patientId) {
      console.error('VALIDATION ERROR: Patient ID is missing');
      return res.status(400).json({ message: 'Patient ID is required' });
    }
    
    // Validate required numeric fields early
    if (!recordData.height || isNaN(parseFloat(recordData.height))) {
      console.error('VALIDATION ERROR: Invalid height:', recordData.height);
      return res.status(400).json({ message: 'Valid height is required' });
    }
    
    if (!recordData.weight || isNaN(parseFloat(recordData.weight))) {
      console.error('VALIDATION ERROR: Invalid weight:', recordData.weight);
      return res.status(400).json({ message: 'Valid weight is required' });
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
    
    // Add appointmentId if provided (for linking records to appointments)
    if (recordData.appointmentId) {
      console.log('Linking medical record to appointment:', recordData.appointmentId);
    }
    
    // Convert and validate numeric fields
    recordData.height = parseFloat(recordData.height);
    recordData.weight = parseFloat(recordData.weight);
    
    console.log('Processed height:', recordData.height);
    console.log('Processed weight:', recordData.weight);
    
    // Ensure date is present
    if (!recordData.date) {
      recordData.date = new Date().toISOString().split('T')[0];
      console.log('Set default date:', recordData.date);
    }
    
    // Ensure doctorId is present
    if (!recordData.doctorId) {
      recordData.doctorId = 'self-recorded';
      console.log('Set default doctorId:', recordData.doctorId);
    }
    
    // Add visit type if provided
    if (recordData.type) {
      console.log('Visit type specified:', recordData.type);
    } else {
      // Default to general checkup if not specified
      recordData.type = 'General Checkup';
      console.log('Set default visit type:', recordData.type);
    }
    
    // ***** VACCINATION VALIDATION: Validate vaccination data structure *****
    if (recordData.vaccinations && recordData.vaccinations.length > 0) {
      console.log('VALIDATING VACCINATION DATA...');
      const validatedVaccinations = [];
      
      for (let i = 0; i < recordData.vaccinations.length; i++) {
        const vac = recordData.vaccinations[i];
        console.log(`Validating vaccination ${i + 1}:`, vac);
        
        if (!vac.name || !vac.dateAdministered) {
          console.error(`VALIDATION ERROR: Vaccination ${i + 1} missing required fields:`, {
            name: vac.name,
            dateAdministered: vac.dateAdministered
          });
          continue; // Skip invalid vaccination
        }
        
        const validatedVaccination = {
          id: vac.id || `vaccination-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: vac.name,
          dateAdministered: vac.dateAdministered,
          doseNumber: parseInt(vac.doseNumber) || 1,
          manufacturer: vac.manufacturer || '',
          lotNumber: vac.lotNumber || '',
          administeredBy: vac.administeredBy || '',
          notes: vac.notes || ''
        };
        
        validatedVaccinations.push(validatedVaccination);
        console.log(`Validated vaccination ${i + 1}:`, validatedVaccination);
      }
      
      recordData.vaccinations = validatedVaccinations;
      console.log('Final validated vaccinations:', recordData.vaccinations.length, 'vaccines');
    }
    
    console.log('Final data being sent to model:', JSON.stringify(recordData, null, 2));
    
    const newRecord = await medicalRecordModel.create(recordData);
    console.log('Medical record created successfully:', newRecord.id);
    
    // ***** VACCINATION VERIFICATION: Check if vaccinations were saved *****
    if (recordData.vaccinations && recordData.vaccinations.length > 0) {
      console.log('VERIFYING VACCINATION SAVE...');
      const savedRecord = await medicalRecordModel.getById(newRecord.id);
      if (savedRecord && savedRecord.vaccinations) {
        console.log('VERIFICATION SUCCESS: Saved record has', savedRecord.vaccinations.length, 'vaccinations');
        savedRecord.vaccinations.forEach((vac, index) => {
          console.log(`Saved vaccination ${index + 1}:`, {
            id: vac.id,
            name: vac.name,
            dateAdministered: vac.dateAdministered
          });
        });
      } else {
        console.error('VERIFICATION FAILED: No vaccinations found in saved record');
      }
    }
    
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('=== CREATE MEDICAL RECORD ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    console.error('====================================');
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
