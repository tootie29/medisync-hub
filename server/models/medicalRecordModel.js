const { pool } = require('../db/config');
const { v4: uuidv4 } = require('uuid');

class MedicalRecordModel {
  async getAll() {
    try {
      // Get medical records with basic information
      const [records] = await pool.query(`
        SELECT * FROM medical_records
        ORDER BY date DESC
      `);
      
      // For each record, get medications and vital signs
      for (const record of records) {
        // Get medications
        const [medications] = await pool.query(
          'SELECT medication_name FROM medications WHERE medical_record_id = ?',
          [record.id]
        );
        record.medications = medications.map(med => med.medication_name);
        
        // Get vital signs
        const [vitalSigns] = await pool.query(
          'SELECT heart_rate, blood_pressure, blood_glucose FROM vital_signs WHERE medical_record_id = ?',
          [record.id]
        );
        
        if (vitalSigns.length > 0) {
          record.vitalSigns = vitalSigns[0];
        }

        // Convert snake_case to camelCase
        record.patientId = record.patient_id;
        record.doctorId = record.doctor_id;
        record.bloodPressure = record.blood_pressure;
        record.followUpDate = record.follow_up_date;
        record.certificateEnabled = record.certificate_enabled ? true : false;
        record.createdAt = record.created_at;
        record.updatedAt = record.updated_at;
        
        // Remove snake_case properties
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
      
      // Get medications
      const [medications] = await pool.query(
        'SELECT medication_name FROM medications WHERE medical_record_id = ?',
        [id]
      );
      record.medications = medications.map(med => med.medication_name);
      
      // Get vital signs
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

      // Convert snake_case to camelCase
      record.patientId = record.patient_id;
      record.doctorId = record.doctor_id;
      record.bloodPressure = record.blood_pressure;
      record.followUpDate = record.follow_up_date;
      record.certificateEnabled = record.certificate_enabled ? true : false;
      record.createdAt = record.created_at;
      record.updatedAt = record.updated_at;
      
      // Remove snake_case properties
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
      
      // For each record, get medications and vital signs
      for (const record of records) {
        // Get medications
        const [medications] = await pool.query(
          'SELECT medication_name FROM medications WHERE medical_record_id = ?',
          [record.id]
        );
        record.medications = medications.map(med => med.medication_name);
        
        // Get vital signs
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

        // Convert snake_case to camelCase
        record.patientId = record.patient_id;
        record.doctorId = record.doctor_id;
        record.bloodPressure = record.blood_pressure;
        record.followUpDate = record.follow_up_date;
        record.certificateEnabled = record.certificate_enabled ? true : false;
        record.createdAt = record.created_at;
        record.updatedAt = record.updated_at;
        
        // Remove snake_case properties
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
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const id = recordData.id || uuidv4();
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // Calculate BMI if not provided or is zero
      let bmi = recordData.bmi;
      if ((!bmi || bmi === 0 || isNaN(bmi)) && recordData.height && recordData.weight) {
        const heightInMeters = recordData.height / 100;
        bmi = recordData.weight / (heightInMeters * heightInMeters);
        bmi = parseFloat(bmi.toFixed(2));
      }
      
      // Make sure BMI is never 0 if height and weight are available
      if ((!bmi || bmi === 0 || isNaN(bmi)) && recordData.height && recordData.weight) {
        console.warn('BMI calculation failed, retrying with height and weight:', recordData.height, recordData.weight);
        try {
          const heightInMeters = parseFloat(recordData.height) / 100;
          bmi = parseFloat(recordData.weight) / (heightInMeters * heightInMeters);
          bmi = parseFloat(bmi.toFixed(2));
        } catch (calcError) {
          console.error('BMI recalculation failed:', calcError);
        }
      }
      
      // Auto-enable certificate for healthy BMI range (18.5-24.9)
      const certificateEnabled = recordData.certificateEnabled !== undefined ? 
        recordData.certificateEnabled : 
        (bmi >= 18.5 && bmi < 25);
      
      // 1. Insert medical record
      await connection.query(
        `INSERT INTO medical_records 
        (id, patient_id, doctor_id, date, height, weight, bmi, blood_pressure, temperature, diagnosis, notes, follow_up_date, certificate_enabled, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, 
          recordData.patientId, 
          recordData.doctorId, 
          recordData.date, 
          recordData.height, 
          recordData.weight, 
          bmi, 
          recordData.bloodPressure, 
          recordData.temperature, 
          recordData.diagnosis, 
          recordData.notes, 
          recordData.followUpDate,
          certificateEnabled,
          now,
          now
        ]
      );
      
      // 2. Insert medications if provided
      if (recordData.medications && recordData.medications.length > 0) {
        for (const medication of recordData.medications) {
          await connection.query(
            'INSERT INTO medications (id, medical_record_id, medication_name) VALUES (?, ?, ?)',
            [uuidv4(), id, medication]
          );
        }
      }
      
      // 3. Insert vital signs if provided
      if (recordData.vitalSigns) {
        await connection.query(
          `INSERT INTO vital_signs 
          (id, medical_record_id, heart_rate, blood_pressure, blood_glucose, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            id,
            recordData.vitalSigns.heartRate,
            recordData.vitalSigns.bloodPressure || recordData.bloodPressure,
            recordData.vitalSigns.bloodGlucose,
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
        certificateEnabled: recordData.certificateEnabled || false,
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
      
      // Recalculate BMI if height or weight has changed
      let bmi = recordData.bmi;
      if ((recordData.height || recordData.weight) && (!recordData.bmi || recordData.bmi === 0 || isNaN(recordData.bmi))) {
        // Get current record to use existing height/weight if not provided
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
      
      // Auto-enable certificate for healthy BMI range if not specified
      let certificateEnabled = recordData.certificateEnabled;
      if (certificateEnabled === undefined && bmi) {
        certificateEnabled = (bmi >= 18.5 && bmi < 25);
      }
      
      // 1. Update medical record
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
        params.push(certificateEnabled);
      }
      
      // Add updated_at to the SET clause
      setClause.push('updated_at = NOW()');
      
      if (setClause.length > 0) {
        params.push(id);
        await connection.query(
          `UPDATE medical_records SET ${setClause.join(', ')} WHERE id = ?`,
          params
        );
      }
      
      // 2. Update medications if provided
      if (recordData.medications) {
        // Delete existing medications
        await connection.query(
          'DELETE FROM medications WHERE medical_record_id = ?',
          [id]
        );
        
        // Insert new medications
        for (const medication of recordData.medications) {
          await connection.query(
            'INSERT INTO medications (id, medical_record_id, medication_name) VALUES (?, ?, ?)',
            [uuidv4(), id, medication]
          );
        }
      }
      
      // 3. Update vital signs if provided
      if (recordData.vitalSigns) {
        // Check if vital signs already exist
        const [existingVitalSigns] = await connection.query(
          'SELECT id FROM vital_signs WHERE medical_record_id = ?',
          [id]
        );
        
        if (existingVitalSigns.length > 0) {
          // Update existing vital signs
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
          // Insert new vital signs
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
      
      // Get updated record
      return await this.getById(id);
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
      
      // Delete related medications
      await connection.query(
        'DELETE FROM medications WHERE medical_record_id = ?',
        [id]
      );
      
      // Delete related vital signs
      await connection.query(
        'DELETE FROM vital_signs WHERE medical_record_id = ?',
        [id]
      );
      
      // Delete medical record
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
