
const medicineModel = require('../models/medicineModel');

exports.getAllMedicines = async (req, res) => {
  try {
    const medicines = await medicineModel.getAll();
    res.json(medicines);
  } catch (error) {
    console.error('Error in getAllMedicines controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const medicineId = req.params.id;
    const medicine = await medicineModel.getById(medicineId);
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    res.json(medicine);
  } catch (error) {
    console.error('Error in getMedicineById controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createMedicine = async (req, res) => {
  try {
    const medicineData = req.body;
    const newMedicine = await medicineModel.create(medicineData);
    res.status(201).json(newMedicine);
  } catch (error) {
    console.error('Error in createMedicine controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const medicineId = req.params.id;
    const medicineData = req.body;
    const updatedMedicine = await medicineModel.update(medicineId, medicineData);
    
    if (!updatedMedicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    res.json(updatedMedicine);
  } catch (error) {
    console.error('Error in updateMedicine controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const medicineId = req.params.id;
    const deleted = await medicineModel.delete(medicineId);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Error in deleteMedicine controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
