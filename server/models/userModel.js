
const { pool } = require('../db/config');
const { v4: uuidv4 } = require('uuid');

class UserModel {
  async getAll() {
    try {
      const [rows] = await pool.query('SELECT * FROM users');
      return rows;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  async create(userData) {
    try {
      const id = userData.id || uuidv4();
      const { 
        email, name, role, phone, dateOfBirth, gender, 
        address, emergencyContact, studentId, department, 
        staffId, position, password 
      } = userData;

      // Log the password to verify it's being passed correctly
      console.log('Creating user with password:', password ? 'Password provided' : 'No password provided');

      const [result] = await pool.query(
        `INSERT INTO users (
          id, email, name, role, phone, date_of_birth, gender, 
          address, emergency_contact, student_id, department, staff_id, position, password
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, email, name, role, phone, dateOfBirth, gender, 
          address, emergencyContact, studentId, department, staffId, position, password
        ]
      );

      return { id, ...userData };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async update(id, userData) {
    try {
      const { 
        email, name, role, phone, dateOfBirth, gender, 
        address, emergencyContact, studentId, department, 
        staffId, position, password
      } = userData;

      const [result] = await pool.query(
        `UPDATE users SET 
          email = IFNULL(?, email), 
          name = IFNULL(?, name), 
          role = IFNULL(?, role), 
          phone = IFNULL(?, phone), 
          date_of_birth = IFNULL(?, date_of_birth), 
          gender = IFNULL(?, gender), 
          address = IFNULL(?, address), 
          emergency_contact = IFNULL(?, emergency_contact), 
          student_id = IFNULL(?, student_id), 
          department = IFNULL(?, department), 
          staff_id = IFNULL(?, staff_id), 
          position = IFNULL(?, position),
          password = IFNULL(?, password)
        WHERE id = ?`,
        [
          email, name, role, phone, dateOfBirth, gender, 
          address, emergencyContact, studentId, department, 
          staffId, position, password, id
        ]
      );

      return { id, ...userData };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getUsersByRole(role) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE role = ?', [role]);
      return rows;
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      console.log('User found by email:', email, rows.length > 0 ? 'User exists' : 'No user found');
      return rows[0];
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }
}

module.exports = new UserModel();
