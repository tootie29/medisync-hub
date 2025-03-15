
const { pool } = require('../db/config');
const { v4: uuidv4 } = require('uuid');

class MedicineModel {
  async getAll() {
    try {
      const [rows] = await pool.query(`
        SELECT 
          id, name, category, quantity, threshold, unit,
          description, dosage, expiry_date, supplier,
          created_at, updated_at
        FROM medicines
        ORDER BY name
      `);
      
      // Transform from snake_case to camelCase
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        quantity: row.quantity,
        threshold: row.threshold,
        unit: row.unit,
        description: row.description,
        dosage: row.dosage,
        expiryDate: row.expiry_date,
        supplier: row.supplier,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error fetching medicines:', error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT 
          id, name, category, quantity, threshold, unit,
          description, dosage, expiry_date, supplier,
          created_at, updated_at
        FROM medicines 
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
        name: row.name,
        category: row.category,
        quantity: row.quantity,
        threshold: row.threshold,
        unit: row.unit,
        description: row.description,
        dosage: row.dosage,
        expiryDate: row.expiry_date,
        supplier: row.supplier,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error fetching medicine by ID:', error);
      throw error;
    }
  }

  async create(medicineData) {
    try {
      const id = medicineData.id || uuidv4();
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      await pool.query(
        `INSERT INTO medicines (
          id, name, category, quantity, threshold, unit,
          description, dosage, expiry_date, supplier,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          medicineData.name,
          medicineData.category,
          medicineData.quantity,
          medicineData.threshold,
          medicineData.unit,
          medicineData.description || null,
          medicineData.dosage || null,
          medicineData.expiryDate || null,
          medicineData.supplier || null,
          now,
          now
        ]
      );
      
      return {
        id,
        ...medicineData,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('Error creating medicine:', error);
      throw error;
    }
  }

  async update(id, medicineData) {
    try {
      const setClause = [];
      const params = [];
      
      if (medicineData.name !== undefined) {
        setClause.push('name = ?');
        params.push(medicineData.name);
      }
      
      if (medicineData.category !== undefined) {
        setClause.push('category = ?');
        params.push(medicineData.category);
      }
      
      if (medicineData.quantity !== undefined) {
        setClause.push('quantity = ?');
        params.push(medicineData.quantity);
      }
      
      if (medicineData.threshold !== undefined) {
        setClause.push('threshold = ?');
        params.push(medicineData.threshold);
      }
      
      if (medicineData.unit !== undefined) {
        setClause.push('unit = ?');
        params.push(medicineData.unit);
      }
      
      if (medicineData.description !== undefined) {
        setClause.push('description = ?');
        params.push(medicineData.description);
      }
      
      if (medicineData.dosage !== undefined) {
        setClause.push('dosage = ?');
        params.push(medicineData.dosage);
      }
      
      if (medicineData.expiryDate !== undefined) {
        setClause.push('expiry_date = ?');
        params.push(medicineData.expiryDate);
      }
      
      if (medicineData.supplier !== undefined) {
        setClause.push('supplier = ?');
        params.push(medicineData.supplier);
      }
      
      // Add updated_at
      setClause.push('updated_at = NOW()');
      
      if (setClause.length > 0) {
        params.push(id);
        await pool.query(
          `UPDATE medicines SET ${setClause.join(', ')} WHERE id = ?`,
          params
        );
      }
      
      // Get updated medicine
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating medicine:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM medicines WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting medicine:', error);
      throw error;
    }
  }
}

module.exports = new MedicineModel();
