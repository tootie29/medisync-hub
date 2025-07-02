const { pool } = require('../db/config');
const { v4: uuidv4 } = require('uuid');

class MedicalRecordModel {
  async getAll() {
    try {
      const [records] = await pool.query(`
        SELECT * FROM medical_records
        ORDER BY date DESC
      `);
      
      for (const record of records) {
        const [medications] = await pool.query(
          'SELECT medication_name FROM medications WHERE medical_record_id = ?',
          [record.id]
        );
        record.medications = medications.map(med => med.medication_name);
        
        const [vitalSigns] = await pool.query(
          'SELECT heart_rate, blood_pressure, blood_glucose, respiratory_rate, oxygen_saturation FROM vital_signs WHERE medical_record_id = ?',
          [record.id]
        );
        
        if (vitalSigns.length > 0) {
          record.vitalSigns = {
            heartRate: vitalSigns[0].heart_rate,
            bloodPressure: vitalSigns[0].blood_pressure,
            bloodGlucose: vitalSigns[0].blood_glucose,
            respiratoryRate: vitalSigns[0].respiratory_rate,
            oxygenSaturation: vitalSigns[0].oxygen_saturation
          };
        }

        record.patientId = record.patient_id;
        record.doctorId = record.doctor_id;
        record.bloodPressure = record.blood_pressure;
        record.followUpDate = record.follow_up_date;
        record.certificateEnabled = record.certificate_enabled ? true : false;
        record.createdAt = record.created_at;
        record.updatedAt = record.updated_at;
        record.appointmentId = record.appointment_id || null;
        record.type = record.type || 'General Checkup';
        
        // Get vaccinations for this record
        const [vaccinations] = await pool.query(
          'SELECT * FROM vaccinations WHERE medical_record_id = ?',
          [record.id]
        );
        record.vaccinations = vaccinations.map(vac => ({
          id: vac.id,
          name: vac.name,
          dateAdministered: vac.date_administered,
          doseNumber: vac.dose_number,
          manufacturer: vac.manufacturer,
          lotNumber: vac.lot_number,
          administeredBy: vac.administered_by,
          notes: vac.notes
        }));
        
        delete record.patient_id;
        delete record.doctor_id;
        delete record.blood_pressure;
        delete record.follow_up_date;
        delete record.certificate_enabled;
        delete record.created_at;
        delete record.updated_at;
        delete record.appointment_id;
      }
      
      return records;
    } catch (error) {
      console.error('Error fetching medical records:', error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const [records] = await pool.query('SELECT * FROM medical_records WHERE id = ?', [id]);
      
      if (records.length === 0) {
        return null;
      }
      
      const record = records[0];
      
      const [medications] = await pool.query(
        'SELECT medication_name FROM medications WHERE medical_record_id = ?',
        [id]
      );
      record.medications = medications.map(med => med.medication_name);
      
      const [vitalSigns] = await pool.query(
        'SELECT heart_rate, blood_pressure, blood_glucose, respiratory_rate, oxygen_saturation FROM vital_signs WHERE medical_record_id = ?',
        [id]
      );
      
      if (vitalSigns.length > 0) {
        record.vitalSigns = {
          heartRate: vitalSigns[0].heart_rate,
          bloodPressure: vitalSigns[0].blood_pressure,
          bloodGlucose: vitalSigns[0].blood_glucose,
          respiratoryRate: vitalSigns[0].respiratory_rate,
          oxygenSaturation: vitalSigns[0].oxygen_saturation
        };
      }

      record.patientId = record.patient_id;
      record.doctorId = record.doctor_id;
      record.bloodPressure = record.blood_pressure;
      record.followUpDate = record.follow_up_date;
      record.certificateEnabled = record.certificate_enabled ? true : false;
      record.createdAt = record.created_at;
      record.updatedAt = record.updated_at;
      record.appointmentId = record.appointment_id || null;
      record.type = record.type || 'General Checkup';
      
      // Get vaccinations for this record
      const [vaccinations] = await pool.query(
        'SELECT * FROM vaccinations WHERE medical_record_id = ?',
        [id]
      );
      record.vaccinations = vaccinations.map(vac => ({
        id: vac.id,
        name: vac.name,
        dateAdministered: vac.date_administered,
        doseNumber: vac.dose_number,
        manufacturer: vac.manufacturer,
        lotNumber: vac.lot_number,
        administeredBy: vac.administered_by,
        notes: vac.notes
      }));
      
      delete record.patient_id;
      delete record.doctor_id;
      delete record.blood_pressure;
      delete record.follow_up_date;
      delete record.certificate_enabled;
      delete record.created_at;
      delete record.updated_at;
      delete record.appointment_id;
      
      return record;
    } catch (error) {
      console.error('Error fetching medical record by ID:', error);
      throw error;
    }
  }

  async getByPatientId(patientId) {
    try {
      const [records] = await pool.query(
        'SELECT * FROM medical_records WHERE patient_id = ? ORDER BY date DESC',
        [patientId]
      );
      
      for (const record of records) {
        const [medications] = await pool.query(
          'SELECT medication_name FROM medications WHERE medical_record_id = ?',
          [record.id]
        );
        record.medications = medications.map(med => med.medication_name);
        
        const [vitalSigns] = await pool.query(
          'SELECT heart_rate, blood_pressure, blood_glucose, respiratory_rate, oxygen_saturation FROM vital_signs WHERE medical_record_id = ?',
          [record.id]
        );
        
        if (vitalSigns.length > 0) {
          record.vitalSigns = {
            heartRate: vitalSigns[0].heart_rate,
            bloodPressure: vitalSigns[0].blood_pressure,
            bloodGlucose: vitalSigns[0].blood_glucose,
            respiratoryRate: vitalSigns[0].respiratory_rate,
            oxygenSaturation: vitalSigns[0].oxygen_saturation
          };
        }

        record.patientId = record.patient_id;
        record.doctorId = record.doctor_id;
        record.bloodPressure = record.blood_pressure;
        record.followUpDate = record.follow_up_date;
        record.certificateEnabled = record.certificate_enabled ? true : false;
        record.createdAt = record.created_at;
        record.updatedAt = record.updated_at;
        record.appointmentId = record.appointment_id || null;
        record.type = record.type || 'General Checkup';
        
        // Get vaccinations for this record
        const [vaccinations] = await pool.query(
          'SELECT * FROM vaccinations WHERE medical_record_id = ?',
          [record.id]
        );
        record.vaccinations = vaccinations.map(vac => ({
          id: vac.id,
          name: vac.name,
          dateAdministered: vac.date_administered,
          doseNumber: vac.dose_number,
          manufacturer: vac.manufacturer,
          lotNumber: vac.lot_number,
          administeredBy: vac.administered_by,
          notes: vac.notes
        }));
        
        delete record.patient_id;
        delete record.doctor_id;
        delete record.blood_pressure;
        delete record.follow_up_date;
        delete record.certificate_enabled;
        delete record.created_at;
        delete record.updated_at;
        delete record.appointment_id;
      }
      
      return records;
    } catch (error) {
      console.error('Error fetching medical records by patient ID:', error);
      throw error;
    }
  }

  async create(recordData) {
    console.log('=== MODEL CREATE DEBUG START ===');
    console.log('Model received data:', JSON.stringify(recordData, null, 2));
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      console.log('Transaction started successfully');
      
      const id = recordData.id || uuidv4();
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      console.log('Generated record ID:', id);
      console.log('Timestamp:', now);
      
      // Validate essential fields
      if (!recordData.patientId) {
        throw new Error('Patient ID is required');
      }
      console.log('Patient ID validated:', recordData.patientId);
      
      // ***** CRITICAL FIX: Validate doctor exists or use fallback *****
      let doctorId = recordData.doctorId || 'self-recorded';
      console.log('Original doctor ID:', doctorId);
      
      // Check if the doctor exists in the users table
      if (doctorId && doctorId !== 'self-recorded') {
        console.log('Checking if doctor exists:', doctorId);
        const [doctorExists] = await connection.query(
          'SELECT id FROM users WHERE id = ?',
          [doctorId]
        );
        
        if (doctorExists.length === 0) {
          console.log(`Doctor ID ${doctorId} does not exist in users table`);
          
          // Try to find any head nurse or admin to use as fallback
          const [fallbackDoctor] = await connection.query(
            "SELECT id FROM users WHERE role IN ('head nurse', 'admin') LIMIT 1"
          );
          
          if (fallbackDoctor.length > 0) {
            doctorId = fallbackDoctor[0].id;
            console.log(`Using fallback doctor ID: ${doctorId}`);
          } else {
            // If no fallback doctor found, we'll need to create one or use null
            console.log('No fallback doctor found, using self-recorded');
            doctorId = 'self-recorded';
          }
        } else {
          console.log(`Doctor ID ${doctorId} exists in users table`);
        }
      }
      
      // If still using 'self-recorded', ensure it exists in users table or create it
      if (doctorId === 'self-recorded') {
        const [selfRecordedExists] = await connection.query(
          'SELECT id FROM users WHERE id = ?',
          ['self-recorded']
        );
        
        if (selfRecordedExists.length === 0) {
          console.log('Creating self-recorded user entry');
          await connection.query(
            `INSERT INTO users (id, email, name, role, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['self-recorded', 'system@medihub.com', 'System (Self-Recorded)', 'admin', now, now]
          );
          console.log('Created self-recorded user successfully');
        }
      }
      
      console.log('Final doctor ID to use:', doctorId);
      
      // Validate height and weight are numbers
      const height = parseFloat(recordData.height);
      const weight = parseFloat(recordData.weight);
      
      if (isNaN(height) || height <= 0) {
        throw new Error(`Invalid height value: ${recordData.height}`);
      }
      
      if (isNaN(weight) || weight <= 0) {
        throw new Error(`Invalid weight value: ${recordData.weight}`);
      }
      
      console.log('Height validated:', height);
      console.log('Weight validated:', weight);
      
      // Calculate BMI if not provided or if height and weight are available
      let bmi = recordData.bmi;
      if (!bmi || bmi === 0 || isNaN(bmi)) {
        try {
          const heightInMeters = height / 100;
          bmi = weight / (heightInMeters * heightInMeters);
          bmi = parseFloat(bmi.toFixed(2));
          console.log('Calculated BMI:', bmi, 'from height:', height, 'and weight:', weight);
        } catch (calcError) {
          console.error('BMI calculation error:', calcError);
          bmi = 0; // Default to 0 if calculation fails
        }
      }
      
      // Handle certificate enabled status (default based on healthy BMI range if not explicitly set)
      const certificateEnabled = recordData.certificateEnabled !== undefined ? 
        Boolean(recordData.certificateEnabled) : 
        (bmi >= 18.5 && bmi < 25);
      
      console.log('Certificate enabled status:', certificateEnabled);
      console.log('Certificate status type:', typeof certificateEnabled);
      
      // Set the appointment ID if provided
      const appointmentId = recordData.appointmentId || null;
      console.log('Appointment ID:', appointmentId);
      
      // Set the visit type or use default
      const visitType = recordData.type || 'General Checkup';
      console.log('Visit type:', visitType);
      
      // Prepare values for insertion
      const insertValues = [
        id, 
        recordData.patientId, 
        doctorId, // Use the validated/fallback doctor ID
        recordData.date || new Date().toISOString().split('T')[0], 
        height, 
        weight, 
        bmi || 0, 
        recordData.bloodPressure || null, 
        recordData.temperature || null, 
        recordData.diagnosis || null, 
        recordData.notes || null, 
        recordData.followUpDate || null,
        certificateEnabled ? 1 : 0,
        visitType,
        appointmentId,
        now,
        now
      ];
      
      console.log('Insert values prepared:', insertValues);
      
      // Insert record with validated doctor ID
      const insertQuery = `INSERT INTO medical_records 
        (id, patient_id, doctor_id, date, height, weight, bmi, blood_pressure, temperature, diagnosis, notes, 
        follow_up_date, certificate_enabled, type, appointment_id, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      console.log('Executing insert query:', insertQuery);
      
      const [insertResult] = await connection.query(insertQuery, insertValues);
      console.log('Insert result:', insertResult);
      
      // ... keep existing code (medications, vital signs, vaccinations handling)
      if (recordData.medications && recordData.medications.length > 0) {
        console.log('Processing medications:', recordData.medications);
        for (const medication of recordData.medications) {
          const medicationId = uuidv4();
          await connection.query(
            'INSERT INTO medications (id, medical_record_id, medication_name) VALUES (?, ?, ?)',
            [medicationId, id, medication]
          );
          console.log('Inserted medication:', medication, 'with ID:', medicationId);
        }
      }
      
      if (recordData.vitalSigns) {
        console.log('Processing vital signs:', recordData.vitalSigns);
        const vitalSignsId = uuidv4();
        await connection.query(
          `INSERT INTO vital_signs 
          (id, medical_record_id, heart_rate, blood_pressure, blood_glucose, respiratory_rate, oxygen_saturation, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            vitalSignsId,
            id,
            recordData.vitalSigns.heartRate || null,
            recordData.vitalSigns.bloodPressure || recordData.bloodPressure || null,
            recordData.vitalSigns.bloodGlucose || null,
            recordData.vitalSigns.respiratoryRate || null,
            recordData.vitalSigns.oxygenSaturation || null,
            now,
            now
          ]
        );
        console.log('Inserted vital signs with ID:', vitalSignsId);
      }
      
      if (recordData.vaccinations && recordData.vaccinations.length > 0) {
        console.log('Processing vaccinations:', recordData.vaccinations);
        for (const vaccination of recordData.vaccinations) {
          const vaccinationId = vaccination.id || uuidv4();
          await connection.query(
            `INSERT INTO vaccinations 
            (id, medical_record_id, name, date_administered, dose_number, manufacturer, lot_number, administered_by, notes, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              vaccinationId,
              id,
              vaccination.name,
              vaccination.dateAdministered,
              vaccination.doseNumber || 1,
              vaccination.manufacturer || null,
              vaccination.lotNumber || null,
              vaccination.administeredBy || null,
              vaccination.notes || null,
              now,
              now
            ]
          );
          console.log('Inserted vaccination:', vaccination.name, 'with ID:', vaccinationId);
        }
      }
      
      await connection.commit();
      console.log('Transaction committed successfully');
      
      const returnData = { 
        id, 
        ...recordData, 
        doctorId, // Return the actual doctor ID used
        bmi,
        certificateEnabled,
        type: visitType,
        appointmentId,
        createdAt: now,
        updatedAt: now
      };
      
      console.log('=== MODEL CREATE DEBUG END ===');
      console.log('Returning data:', JSON.stringify(returnData, null, 2));
      
      return returnData;
    } catch (error) {
      await connection.rollback();
      console.error('=== MODEL CREATE ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('SQL State:', error.sqlState);
      console.error('SQL Message:', error.sqlMessage);
      console.error('==========================');
      throw error;
    } finally {
      connection.release();
      console.log('Database connection released');
    }
  }

  async update(id, recordData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      console.log('************ UPDATING MEDICAL RECORD ************');
      console.log('RECORD ID:', id);
      console.log('UPDATE DATA RECEIVED:', JSON.stringify(recordData));
      console.log('************************************************');
      
      let bmi = recordData.bmi;
      if ((recordData.height || recordData.weight) && (!recordData.bmi || recordData.bmi === 0 || isNaN(recordData.bmi))) {
        const [currentRecords] = await connection.query(
          'SELECT height, weight FROM medical_records WHERE id = ?',
          [id]
        );
        
        if (currentRecords.length > 0) {
          const height = recordData.height || currentRecords[0].height;
          const weight = recordData.weight || currentRecords[0].weight;
          
          if (height && weight) {
            const heightInMeters = height / 100;
            bmi = weight / (heightInMeters * heightInMeters);
            bmi = parseFloat(bmi.toFixed(2));
          }
        }
      }
      
      let certificateEnabled = recordData.certificateEnabled;
      console.log('Certificate status in model (initial):', certificateEnabled);
      console.log('Certificate status type:', typeof certificateEnabled);
      
      if (certificateEnabled !== undefined) {
        if (typeof certificateEnabled === 'string') {
          certificateEnabled = certificateEnabled.toLowerCase() === 'true';
        } else if (typeof certificateEnabled === 'number') {
          certificateEnabled = certificateEnabled === 1;
        } else {
          certificateEnabled = Boolean(certificateEnabled);
        }
        
        console.log('Certificate status after conversion (boolean):', certificateEnabled);
      }
      
      if (certificateEnabled === undefined && bmi) {
        certificateEnabled = (bmi >= 18.5 && bmi < 25);
      }
      
      const setClause = [];
      const params = [];
      
      // ... keep existing code (field setting logic) but REMOVED gender handling
      if (recordData.patientId) {
        setClause.push('patient_id = ?');
        params.push(recordData.patientId);
      }
      
      if (recordData.doctorId) {
        setClause.push('doctor_id = ?');
        params.push(recordData.doctorId);
      }
      
      if (recordData.date) {
        setClause.push('date = ?');
        params.push(recordData.date);
      }
      
      if (recordData.height) {
        setClause.push('height = ?');
        params.push(recordData.height);
      }
      
      if (recordData.weight) {
        setClause.push('weight = ?');
        params.push(recordData.weight);
      }
      
      if (bmi) {
        setClause.push('bmi = ?');
        params.push(bmi);
      }
      
      if (recordData.bloodPressure) {
        setClause.push('blood_pressure = ?');
        params.push(recordData.bloodPressure);
      }
      
      if (recordData.temperature) {
        setClause.push('temperature = ?');
        params.push(recordData.temperature);
      }
      
      if (recordData.diagnosis) {
        setClause.push('diagnosis = ?');
        params.push(recordData.diagnosis);
      }
      
      if (recordData.notes) {
        setClause.push('notes = ?');
        params.push(recordData.notes);
      }
      
      if (recordData.followUpDate) {
        setClause.push('follow_up_date = ?');
        params.push(recordData.followUpDate);
      }
      
      if (certificateEnabled !== undefined) {
        setClause.push('certificate_enabled = ?');
        const dbValue = certificateEnabled ? 1 : 0;
        params.push(dbValue);
        console.log(`Setting certificate_enabled in database to ${dbValue} (from boolean ${certificateEnabled})`);
      }
      
      if (recordData.type) {
        setClause.push('type = ?');
        params.push(recordData.type);
      }
      
      if (recordData.appointmentId) {
        setClause.push('appointment_id = ?');
        params.push(recordData.appointmentId);
      }
      
      setClause.push('updated_at = NOW()');
      
      if (setClause.length === 0) {
        console.warn('No fields to update for record', id);
        return await this.getById(id);
      }
      
      params.push(id);
      
      const updateQuery = `UPDATE medical_records SET ${setClause.join(', ')} WHERE id = ?`;
      console.log('UPDATE QUERY:', updateQuery);
      console.log('UPDATE PARAMS:', params);
      
      const [result] = await connection.query(updateQuery, params);
      console.log('UPDATE RESULT:', result);
      
      if (result.affectedRows === 0) {
        console.error(`CRITICAL ERROR: No rows affected when updating medical record ${id}`);
        const [checkRecord] = await connection.query('SELECT id FROM medical_records WHERE id = ?', [id]);
        console.log('Record exists check:', checkRecord);
        if (checkRecord.length === 0) {
          throw new Error(`Medical record with ID ${id} not found`);
        }
      }
      
      // ... keep existing code (medications, vital signs, vaccinations handling)
      if (recordData.medications) {
        await connection.query(
          'DELETE FROM medications WHERE medical_record_id = ?',
          [id]
        );
        
        for (const medication of recordData.medications) {
          await connection.query(
            'INSERT INTO medications (id, medical_record_id, medication_name) VALUES (?, ?, ?)',
            [uuidv4(), id, medication]
          );
        }
      }
      
      if (recordData.vitalSigns) {
        const [existingVitalSigns] = await connection.query(
          'SELECT id FROM vital_signs WHERE medical_record_id = ?',
          [id]
        );
        
        if (existingVitalSigns.length > 0) {
          const vitalSignsUpdateClause = [];
          const vitalSignsParams = [];
          
          if (recordData.vitalSigns.heartRate !== undefined) {
            vitalSignsUpdateClause.push('heart_rate = ?');
            vitalSignsParams.push(recordData.vitalSigns.heartRate);
          }
          
          if (recordData.vitalSigns.bloodPressure !== undefined) {
            vitalSignsUpdateClause.push('blood_pressure = ?');
            vitalSignsParams.push(recordData.vitalSigns.bloodPressure);
          } else if (recordData.bloodPressure) {
            vitalSignsUpdateClause.push('blood_pressure = ?');
            vitalSignsParams.push(recordData.bloodPressure);
          }
          
          if (recordData.vitalSigns.bloodGlucose !== undefined) {
            vitalSignsUpdateClause.push('blood_glucose = ?');
            vitalSignsParams.push(recordData.vitalSigns.bloodGlucose);
          }
          
          if (recordData.vitalSigns.respiratoryRate !== undefined) {
            vitalSignsUpdateClause.push('respiratory_rate = ?');
            vitalSignsParams.push(recordData.vitalSigns.respiratoryRate);
          }
          
          if (recordData.vitalSigns.oxygenSaturation !== undefined) {
            vitalSignsUpdateClause.push('oxygen_saturation = ?');
            vitalSignsParams.push(recordData.vitalSigns.oxygenSaturation);
          }
          
          if (vitalSignsUpdateClause.length > 0) {
            vitalSignsUpdateClause.push('updated_at = NOW()');
            vitalSignsParams.push(id);
            
            await connection.query(
              `UPDATE vital_signs SET ${vitalSignsUpdateClause.join(', ')} WHERE medical_record_id = ?`,
              vitalSignsParams
            );
          }
        } else {
          await connection.query(
            `INSERT INTO vital_signs 
            (id, medical_record_id, heart_rate, blood_pressure, blood_glucose, respiratory_rate, oxygen_saturation, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              uuidv4(),
              id,
              recordData.vitalSigns.heartRate || null,
              recordData.vitalSigns.bloodPressure || recordData.bloodPressure || null,
              recordData.vitalSigns.bloodGlucose || null,
              recordData.vitalSigns.respiratoryRate || null,
              recordData.vitalSigns.oxygenSaturation || null
            ]
          );
        }
      }
      
      if (recordData.vaccinations) {
        // Delete existing vaccinations
        await connection.query(
          'DELETE FROM vaccinations WHERE medical_record_id = ?',
          [id]
        );
        
        // Insert new vaccinations
        for (const vaccination of recordData.vaccinations) {
          await connection.query(
            `INSERT INTO vaccinations 
            (id, medical_record_id, name, date_administered, dose_number, manufacturer, lot_number, administered_by, notes, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              vaccination.id || uuidv4(),
              id,
              vaccination.name,
              vaccination.dateAdministered,
              vaccination.doseNumber || 1,
              vaccination.manufacturer || null,
              vaccination.lotNumber || null,
              vaccination.administeredBy || null,
              vaccination.notes || null
            ]
          );
        }
      }
      
      await connection.commit();
      console.log('Transaction committed successfully');
      
      const updatedRecord = await this.getById(id);
      console.log('UPDATED RECORD:', JSON.stringify(updatedRecord));
      console.log('Certificate status in updated record:', updatedRecord.certificateEnabled);
      console.log('Patient ID in updated record:', updatedRecord.patientId);
      return updatedRecord;
    } catch (error) {
      await connection.rollback();
      console.error('Error updating medical record:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      await connection.query(
        'DELETE FROM medications WHERE medical_record_id = ?',
        [id]
      );
      
      await connection.query(
        'DELETE FROM vital_signs WHERE medical_record_id = ?',
        [id]
      );
      
      // Delete vaccinations
      await connection.query(
        'DELETE FROM vaccinations WHERE medical_record_id = ?',
        [id]
      );
      
      const [result] = await connection.query(
        'DELETE FROM medical_records WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error deleting medical record:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new MedicalRecordModel();
