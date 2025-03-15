
const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');

// Get all medicines
router.get('/', medicineController.getAllMedicines);

// Get medicine by ID
router.get('/:id', medicineController.getMedicineById);

// Create new medicine
router.post('/', medicineController.createMedicine);

// Update medicine
router.put('/:id', medicineController.updateMedicine);

// Delete medicine
router.delete('/:id', medicineController.deleteMedicine);

module.exports = router;
