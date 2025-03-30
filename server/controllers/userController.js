
const userModel = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAll();
    res.json(users);
  } catch (error) {
    console.error('Error in getAllUsers controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userModel.getById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error in getUserById controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const userData = req.body;
    console.log('Received user data:', userData);
    
    // Generate a UUID if one isn't provided
    if (!userData.id) {
      userData.id = uuidv4();
    }
    
    // Process the input data to match database column names
    const userDataForDb = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      dateOfBirth: userData.date_of_birth || userData.dateOfBirth,
      gender: userData.gender,
      address: userData.address,
      emergencyContact: userData.emergency_contact || userData.emergencyContact,
      studentId: userData.student_id || userData.studentId,
      department: userData.department,
      staffId: userData.staff_id || userData.staffId,
      position: userData.position,
    };
    
    console.log('Processed user data for DB:', userDataForDb);
    
    const newUser = await userModel.create(userDataForDb);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error in createUser controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = req.body;
    
    // Process the input data to match database column names
    const userDataForDb = {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      dateOfBirth: userData.date_of_birth || userData.dateOfBirth,
      gender: userData.gender,
      address: userData.address,
      emergencyContact: userData.emergency_contact || userData.emergencyContact,
      studentId: userData.student_id || userData.studentId,
      department: userData.department,
      staffId: userData.staff_id || userData.staffId,
      position: userData.position,
    };
    
    const updatedUser = await userModel.update(userId, userDataForDb);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error in updateUser controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deleted = await userModel.delete(userId);
    
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUsersByRole = async (req, res) => {
  try {
    const role = req.params.role;
    const users = await userModel.getUsersByRole(role);
    res.json(users);
  } catch (error) {
    console.error('Error in getUsersByRole controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
