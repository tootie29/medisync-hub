
const { pool } = require('../db/config');
const { v4: uuidv4 } = require('uuid');

class AppointmentModel {
  async getAll() {
    try {
      const [rows] = await pool.query(`
        SELECT 
          id, patient_id, doctor_id, date, 
          start_time, end_time, status, reason, 
          notes, created_at, updated_at
        FROM appointments
        ORDER BY date, start_time
      `);
      
      // Transform from snake_case to camelCase
      return rows.map(row => ({
        id: row.id,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        date: row.date,
        startTime: row.start_time.slice(0, 5), // Format: HH:MM
        endTime: row.end_time.slice(0, 5),     // Format: HH:MM
        status: row.status,
        reason: row.reason,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT 
          id, patient_id, doctor_id, date, 
          start_time, end_time, status, reason, 
          notes, created_at, updated_at
        FROM appointments 
        WHERE id = ?`,
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      
      // Transform from snake_case to camelCase
      return {
        id: row.id,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        date: row.date,
        startTime: row.start_time.slice(0, 5), // Format: HH:MM
        endTime: row.end_time.slice(0, 5),     // Format: HH:MM
        status: row.status,
        reason: row.reason,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error fetching appointment by ID:', error);
      throw error;
    }
  }

  async getByPatientId(patientId) {
    try {
      const [rows] = await pool.query(
        `SELECT 
          id, patient_id, doctor_id, date, 
          start_time, end_time, status, reason, 
          notes, created_at, updated_at
        FROM appointments 
        WHERE patient_id = ?
        ORDER BY date, start_time`,
        [patientId]
      );
      
      // Transform from snake_case to camelCase
      return rows.map(row => ({
        id: row.id,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        date: row.date,
        startTime: row.start_time.slice(0, 5), // Format: HH:MM
        endTime: row.end_time.slice(0, 5),     // Format: HH:MM
        status: row.status,
        reason: row.reason,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error fetching appointments by patient ID:', error);
      throw error;
    }
  }

  async getByDoctorId(doctorId) {
    try {
      const [rows] = await pool.query(
        `SELECT 
          id, patient_id, doctor_id, date, 
          start_time, end_time, status, reason, 
          notes, created_at, updated_at
        FROM appointments 
        WHERE doctor_id = ?
        ORDER BY date, start_time`,
        [doctorId]
      );
      
      // Transform from snake_case to camelCase
      return rows.map(row => ({
        id: row.id,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        date: row.date,
        startTime: row.start_time.slice(0, 5), // Format: HH:MM
        endTime: row.end_time.slice(0, 5),     // Format: HH:MM
        status: row.status,
        reason: row.reason,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error fetching appointments by doctor ID:', error);
      throw error;
    }
  }

  async create(appointmentData) {
    try {
      const id = appointmentData.id || uuidv4();
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // Check if this might be a sample/test user from the frontend 
      // (IDs contain 'user-' and timestamp indicating they're temporary)
      if (appointmentData.patientId && 
          (appointmentData.patientId.startsWith('user-') || 
           appointmentData.patientId.includes('-temp-'))) {
        console.log(`Detected temporary user ID: ${appointmentData.patientId}. Checking if user exists...`);
        
        // Check if user exists first
        const [userExists] = await pool.query(
          'SELECT COUNT(*) as count FROM users WHERE id = ?',
          [appointmentData.patientId]
        );
        
        // If user doesn't exist in the database, create a temporary entry
        if (userExists[0].count === 0) {
          console.log(`User ${appointmentData.patientId} doesn't exist. Creating temporary user entry.`);
          try {
            await pool.query(
              `INSERT INTO users (
                id, email, name, role, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?)`,
              [
                appointmentData.patientId,
                `temp-${appointmentData.patientId}@example.com`,
                `Temporary User ${appointmentData.patientId.substring(0, 8)}`,
                'student',
                now,
                now
              ]
            );
            console.log(`Created temporary user ${appointmentData.patientId}`);
          } catch (userError) {
            console.error(`Failed to create temporary user: ${userError.message}`);
            // Continue anyway - the appointment creation might still work if another
            // process created the user in the meantime
          }
        }
      }
      
      // Create the appointment
      await pool.query(
        `INSERT INTO appointments (
          id, patient_id, doctor_id, date, start_time, end_time, 
          status, reason, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          appointmentData.patientId,
          appointmentData.doctorId,
          appointmentData.date,
          appointmentData.startTime,
          appointmentData.endTime,
          appointmentData.status,
          appointmentData.reason,
          appointmentData.notes || null,
          now,
          now
        ]
      );
      
      return {
        id,
        ...appointmentData,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async update(id, appointmentData) {
    try {
      const setClause = [];
      const params = [];
      
      if (appointmentData.patientId !== undefined) {
        setClause.push('patient_id = ?');
        params.push(appointmentData.patientId);
      }
      
      if (appointmentData.doctorId !== undefined) {
        setClause.push('doctor_id = ?');
        params.push(appointmentData.doctorId);
      }
      
      if (appointmentData.date !== undefined) {
        setClause.push('date = ?');
        params.push(appointmentData.date);
      }
      
      if (appointmentData.startTime !== undefined) {
        setClause.push('start_time = ?');
        params.push(appointmentData.startTime);
      }
      
      if (appointmentData.endTime !== undefined) {
        setClause.push('end_time = ?');
        params.push(appointmentData.endTime);
      }
      
      if (appointmentData.status !== undefined) {
        setClause.push('status = ?');
        params.push(appointmentData.status);
      }
      
      if (appointmentData.reason !== undefined) {
        setClause.push('reason = ?');
        params.push(appointmentData.reason);
      }
      
      if (appointmentData.notes !== undefined) {
        setClause.push('notes = ?');
        params.push(appointmentData.notes);
      }
      
      // Add updated_at
      setClause.push('updated_at = NOW()');
      
      if (setClause.length > 0) {
        params.push(id);
        await pool.query(
          `UPDATE appointments SET ${setClause.join(', ')} WHERE id = ?`,
          params
        );
      }
      
      // Get updated appointment
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM appointments WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }
}

module.exports = new AppointmentModel();
