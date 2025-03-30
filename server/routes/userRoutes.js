
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get all users
router.get('/', userController.getAllUsers);

// Get users by role - this needs to come BEFORE the ID route
router.get('/role/:role', userController.getUsersByRole);

// Get user by ID
router.get('/:id', userController.getUserById);

// Login user
router.post('/login', userController.login);

// Create new user
router.post('/', userController.createUser);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
