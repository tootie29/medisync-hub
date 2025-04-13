
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
          'SELECT heart_rate, blood_pressure, blood_glucose FROM vital_signs WHERE medical_record_id = ?',
          [record.id]
        );
        
        if (vitalSigns.length > 0) {
          record.vitalSigns = vitalSigns[0];
        }

        record.patientId = record.patient_id;
        record.doctorId = record.doctor_id;
        record.bloodPressure = record.blood_pressure;
        record.followUpDate = record.follow_up_date;
        record.certificateEnabled = record.certificate_enabled ? true : false;
        record.createdAt = record.created_at;
        record.updatedAt = record.updated_at;
        
        delete record.patient_id;
        delete record.doctor_id;
        delete record.blood_pressure;
        delete record.follow_up_date;
        delete record.certificate_enabled;
        delete record.created_at;
        delete record.updated_at;
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
        'SELECT heart_rate, blood_pressure, blood_glucose FROM vital_signs WHERE medical_record_id = ?',
        [id]
      );
      
      if (vitalSigns.length > 0) {
        record.vitalSigns = {
          heartRate: vitalSigns[0].heart_rate,
          bloodPressure: vitalSigns[0].blood_pressure,
          bloodGlucose: vitalSigns[0].blood_glucose
        };
      }

      record.patientId = record.patient_id;
      record.doctorId = record.doctor_id;
      record.bloodPressure = record.blood_pressure;
      record.followUpDate = record.follow_up_date;
      record.certificateEnabled = record.certificate_enabled ? true : false;
      record.createdAt = record.created_at;
      record.updatedAt = record.updated_at;
      
      delete record.patient_id;
      delete record.doctor_id;
      delete record.blood_pressure;
      delete record.follow_up_date;
      delete record.certificate_enabled;
      delete record.created_at;
      delete record.updated_at;
      
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
          'SELECT heart_rate, blood_pressure, blood_glucose FROM vital_signs WHERE medical_record_id = ?',
          [record.id]
        );
        
        if (vitalSigns.length > 0) {
          record.vitalSigns = {
            heartRate: vitalSigns[0].heart_rate,
            bloodPressure: vitalSigns[0].blood_pressure,
            bloodGlucose: vitalSigns[0].blood_glucose
          };
        }

        record.patientId = record.patient_id;
        record.doctorId = record.doctor_id;
        record.bloodPressure = record.blood_pressure;
        record.followUpDate = record.follow_up_date;
        record.certificateEnabled = record.certificate_enabled ? true : false;
        record.createdAt = record.created_at;
        record.updatedAt = record.updated_at;
        
        delete record.patient_id;
        delete record.doctor_id;
        delete record.blood_pressure;
        delete record.follow_up_date;
        delete record.certificate_enabled;
        delete record.created_at;
        delete record.updated_at;
      }
      
      return records;
    } catch (error) {
      console.error('Error fetching medical records by patient ID:', error);
      throw error;
    }
  }

  async create(recordData) {
    console.log('Creating medical record with data:', JSON.stringify(recordData));
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const id = recordData.id || uuidv4();
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // Validate essential fields
      if (!recordData.patientId) {
        throw new Error('Patient ID is required');
      }
      
      // Calculate BMI if not provided or if height and weight are available
      let bmi = recordData.bmi;
      if ((!bmi || bmi === 0 || isNaN(bmi)) && recordData.height && recordData.weight) {
        try {
          const heightInMeters = parseFloat(recordData.height) / 100;
          bmi = parseFloat(recordData.weight) / (heightInMeters * heightInMeters);
          bmi = parseFloat(bmi.toFixed(2));
          console.log('Calculated BMI:', bmi, 'from height:', recordData.height, 'and weight:', recordData.weight);
        } catch (calcError) {
          console.error('BMI calculation error:', calcError);
          bmi = 0; // Default to 0 if calculation fails
        }
      }
      
      // Handle certificate enabled status (default based on healthy BMI range if not explicitly set)
      const certificateEnabled = recordData.certificateEnabled !== undefined ? 
        Boolean(recordData.certificateEnabled) : 
        (bmi >= 18.5 && bmi < 25);
      
      console.log('Creating record with certificate status:', certificateEnabled);
      console.log('Certificate status type:', typeof certificateEnabled);
      console.log('Patient ID being used for record:', recordData.patientId);
      
      // Insert record with explicit type handling
      await connection.query(
        `INSERT INTO medical_records 
        (id, patient_id, doctor_id, date, height, weight, bmi, blood_pressure, temperature, diagnosis, notes, follow_up_date, certificate_enabled, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, 
          recordData.patientId, 
          recordData.doctorId || 'self-recorded', 
          recordData.date || new Date().toISOString().split('T')[0], 
          parseFloat(recordData.height) || 0, 
          parseFloat(recordData.weight) || 0, 
          bmi || 0, 
          recordData.bloodPressure || null, 
          recordData.temperature || null, 
          recordData.diagnosis || null, 
          recordData.notes || null, 
          recordData.followUpDate || null,
          certificateEnabled ? 1 : 0,
          now,
          now
        ]
      );
      
      // Handle medications if provided
      if (recordData.medications && recordData.medications.length > 0) {
        for (const medication of recordData.medications) {
          await connection.query(
            'INSERT INTO medications (id, medical_record_id, medication_name) VALUES (?, ?, ?)',
            [uuidv4(), id, medication]
          );
        }
      }
      
      // Handle vital signs if provided
      if (recordData.vitalSigns) {
        await connection.query(
          `INSERT INTO vital_signs 
          (id, medical_record_id, heart_rate, blood_pressure, blood_glucose, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            id,
            recordData.vitalSigns.heartRate || null,
            recordData.vitalSigns.bloodPressure || recordData.bloodPressure || null,
            recordData.vitalSigns.bloodGlucose || null,
            now,
            now
          ]
        );
      }
      
      await connection.commit();
      
      return { 
        id, 
        ...recordData, 
        bmi,
        certificateEnabled,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      await connection.rollback();
      console.error('Error creating medical record:', error);
      throw error;
    } finally {
      connection.release();
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
            (id, medical_record_id, heart_rate, blood_pressure, blood_glucose, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              uuidv4(),
              id,
              recordData.vitalSigns.heartRate,
              recordData.vitalSigns.bloodPressure || recordData.bloodPressure,
              recordData.vitalSigns.bloodGlucose
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
