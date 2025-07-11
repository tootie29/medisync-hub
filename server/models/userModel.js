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
      if (!id) {
        console.log('No ID provided to getById');
        return null;
      }

      // Normalize the ID by removing the 'user-' prefix if it exists
      let userId = id;
      if (id.startsWith('user-')) {
        userId = id.replace('user-', '');
      }
      
      console.log(`Looking up user with ID: ${id}, normalized to: ${userId}`);
      
      // First try with the normalized ID
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
      
      // If not found, try with the original ID format
      if (rows.length === 0) {
        console.log(`No user found with normalized ID: ${userId}, trying with original ID`);
        const [originalRows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        
        if (originalRows.length === 0) {
          console.log(`No user found with either ID format: ${id}`);
          return null;
        }
        
        console.log(`Found user with original ID: ${id}, name: ${originalRows[0].name}`);
        return originalRows[0];
      }
      
      console.log(`Found user with normalized ID: ${userId}, name: ${rows[0].name}`);
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
        staffId, position, faculty, password,
        emailVerified, verificationToken, tokenExpiry, consentGiven
      } = userData;

      // Log the password to verify it's being passed correctly
      console.log('Creating user with password:', password ? 'Password provided' : 'No password provided');
      console.log('Faculty/College value:', faculty || 'Not provided');
      console.log('Verification token:', verificationToken || 'Not provided');
      console.log('Consent given:', consentGiven ? 'Yes' : 'No');

      const [result] = await pool.query(
        `INSERT INTO users (
          id, email, name, role, phone, date_of_birth, gender, 
          address, emergency_contact, student_id, department, staff_id, position, faculty, password,
          email_verified, verification_token, token_expiry, consent_given
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, email, name, role, phone, dateOfBirth, gender, 
          address, emergencyContact, studentId, department, staffId, position, faculty, password,
          emailVerified || false, verificationToken || null, tokenExpiry || null, consentGiven || false
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
        staffId, position, faculty, password,
        emailVerified, verificationToken, tokenExpiry, consentGiven
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
          faculty = IFNULL(?, faculty),
          password = IFNULL(?, password),
          email_verified = IFNULL(?, email_verified),
          verification_token = ?,
          token_expiry = ?,
          consent_given = IFNULL(?, consent_given)
        WHERE id = ?`,
        [
          email, name, role, phone, dateOfBirth, gender, 
          address, emergencyContact, studentId, department, 
          staffId, position, faculty, password,
          emailVerified, verificationToken, tokenExpiry, consentGiven, id
        ]
      );

      // Return the updated user data
      return await this.getById(id);
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
  
  async verifyEmail(token) {
    try {
      // Check if the token exists and is not expired
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE verification_token = ? AND token_expiry > NOW()',
        [token]
      );
      
      if (rows.length === 0) {
        return { success: false, message: 'Invalid or expired verification token' };
      }
      
      // Update the user to mark email as verified
      const userId = rows[0].id;
      await pool.query(
        'UPDATE users SET email_verified = TRUE, verification_token = NULL, token_expiry = NULL WHERE id = ?',
        [userId]
      );
      
      return { success: true, email: rows[0].email };
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  }
  
  async generateVerificationToken(userId) {
    try {
      // Generate a random token
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      // Token expires in 24 hours
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24);
      
      // Update the user with the new token
      await pool.query(
        'UPDATE users SET verification_token = ?, token_expiry = ? WHERE id = ?',
        [token, expiry, userId]
      );
      
      return token;
    } catch (error) {
      console.error('Error generating verification token:', error);
      throw error;
    }
  }
  
  async generateResetToken(email) {
    try {
      // Find user by email
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      
      if (rows.length === 0) {
        return { success: false, message: 'No account found with that email address' };
      }
      
      // Generate a random token
      const token = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
      
      // Token expires in 1 hour
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1);
      
      try {
        // Check if the reset_password_token column exists in the users table
        const [columns] = await pool.query('SHOW COLUMNS FROM users LIKE ?', ['reset_password_token']);
        
        if (columns.length === 0) {
          console.error('Column reset_password_token does not exist in users table');
          // Attempt to add the columns if they don't exist
          try {
            await pool.query(`
              ALTER TABLE users 
              ADD COLUMN reset_password_token VARCHAR(100) DEFAULT NULL,
              ADD COLUMN reset_token_expiry TIMESTAMP DEFAULT NULL
            `);
            console.log('Added reset_password_token and reset_token_expiry columns to users table');
          } catch (alterError) {
            console.error('Failed to add columns to users table:', alterError);
            return { 
              success: false, 
              message: 'Password reset functionality is not available. Database schema needs to be updated.',
              error: alterError.message
            };
          }
        }
        
        // Update the user with the new reset token
        await pool.query(
          'UPDATE users SET reset_password_token = ?, reset_token_expiry = ? WHERE id = ?',
          [token, expiry, rows[0].id]
        );
        
        return { 
          success: true, 
          token,
          email: rows[0].email,
          userId: rows[0].id
        };
      } catch (dbError) {
        console.error('Database error while setting reset token:', dbError);
        return { 
          success: false,
          message: 'Failed to generate reset token due to database error',
          error: dbError.message
        };
      }
    } catch (error) {
      console.error('Error generating reset token:', error);
      throw error;
    }
  }
  
  async validateResetToken(token) {
    try {
      // Check if the reset_password_token column exists
      const [columns] = await pool.query('SHOW COLUMNS FROM users LIKE ?', ['reset_password_token']);
      
      if (columns.length === 0) {
        console.error('Column reset_password_token does not exist in users table');
        return { 
          success: false, 
          message: 'Password reset functionality is not available. Database schema needs to be updated.'
        };
      }
      
      // Check if the token exists and is not expired
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE reset_password_token = ? AND reset_token_expiry > NOW()',
        [token]
      );
      
      if (rows.length === 0) {
        return { success: false, message: 'Invalid or expired reset token' };
      }
      
      return { 
        success: true, 
        userId: rows[0].id,
        email: rows[0].email 
      };
    } catch (error) {
      console.error('Error validating reset token:', error);
      return { 
        success: false, 
        message: 'Failed to validate token due to database error',
        error: error.message
      };
    }
  }
  
  async resetPassword(token, newPassword) {
    try {
      // Check if the reset_password_token column exists
      const [columns] = await pool.query('SHOW COLUMNS FROM users LIKE ?', ['reset_password_token']);
      
      if (columns.length === 0) {
        console.error('Column reset_password_token does not exist in users table');
        return { 
          success: false, 
          message: 'Password reset functionality is not available. Database schema needs to be updated.'
        };
      }
      
      // Validate the token first
      const validation = await this.validateResetToken(token);
      
      if (!validation.success) {
        return validation;
      }
      
      // Update the user's password
      await pool.query(
        'UPDATE users SET password = ?, reset_password_token = NULL, reset_token_expiry = NULL WHERE id = ?',
        [newPassword, validation.userId]
      );
      
      return { 
        success: true, 
        message: 'Password has been reset successfully' 
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        message: 'Failed to reset password due to database error',
        error: error.message
      };
    }
  }
}

module.exports = new UserModel();
