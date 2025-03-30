
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
    
    // Validate required fields based on role
    if (!userData.email || !userData.name || !userData.role) {
      return res.status(400).json({ message: 'Email, name, and role are required fields' });
    }
    
    // Role-specific validation
    if (userData.role === 'student' && !userData.student_id && !userData.studentId) {
      return res.status(400).json({ message: 'Student ID is required for student role' });
    }
    
    if (userData.role === 'staff' && !userData.staff_id && !userData.staffId) {
      return res.status(400).json({ message: 'Staff ID is required for staff role' });
    }
    
    if (userData.role === 'doctor' && !userData.staff_id && !userData.staffId) {
      return res.status(400).json({ message: 'Staff ID is required for doctor role' });
    }
    
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
      phone: userData.phone || null,
      dateOfBirth: userData.date_of_birth || userData.dateOfBirth || null,
      gender: userData.gender || null,
      address: userData.address || null,
      emergencyContact: userData.emergency_contact || userData.emergencyContact || null,
      studentId: userData.student_id || userData.studentId || null,
      department: userData.department || null,
      staffId: userData.staff_id || userData.staffId || null,
      position: userData.position || null,
    };
    
    console.log('Processed user data for DB:', userDataForDb);
    
    const newUser = await userModel.create(userDataForDb);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error in createUser controller:', error);
    
    // Handle duplicate email error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already exists', error: error.message });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = req.body;
    
    // Check for doctor role permission if not updating own profile
    if (userData.requestingUserRole && userData.requestingUserId) {
      const isDoctor = userData.requestingUserRole === 'doctor';
      const isAdmin = userData.requestingUserRole === 'admin';
      const isSelfUpdate = userData.requestingUserId === userId;
      
      // Remove metadata fields before updating
      delete userData.requestingUserRole;
      delete userData.requestingUserId;
      
      // If not self, doctor, or admin, reject the update
      if (!isSelfUpdate && !isDoctor && !isAdmin) {
        return res.status(403).json({ 
          message: 'Permission denied. Only doctors, admins, or the user themselves can update user data.'
        });
      }
    }
    
    // First check if user exists
    const existingUser = await userModel.getById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
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
    
    // Handle duplicate email error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already exists', error: error.message });
    }
    
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
    
    // Validate role parameter
    const validRoles = ['student', 'staff', 'doctor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role parameter. Must be one of: student, staff, doctor, admin' });
    }
    
    const users = await userModel.getUsersByRole(role);
    res.json(users);
  } catch (error) {
    console.error('Error in getUsersByRole controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add any sample users that don't exist yet
exports.ensureSampleUsers = async (req, res) => {
  try {
    console.log("Ensuring sample users exist...");
    
    // Sample users data
    const sampleUsers = [
      {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        phone: '123-456-7890',
        dateOfBirth: '1980-01-01',
        gender: 'male',
        address: '123 Admin St',
        emergencyContact: 'Jane Admin: 123-456-7890'
      },
      {
        id: '2',
        email: 'doctor@example.com',
        name: 'Dr. Smith',
        role: 'doctor',
        phone: '123-456-7891',
        dateOfBirth: '1975-05-15',
        gender: 'female',
        address: '456 Doctor Ave',
        emergencyContact: 'John Smith: 123-456-7892',
        staffId: 'DOC123',
        position: 'General Physician'
      },
      {
        id: '3',
        email: 'student@example.com',
        name: 'John Student',
        role: 'student',
        phone: '123-456-7893',
        dateOfBirth: '2000-10-20',
        gender: 'male',
        address: '789 Student Blvd',
        emergencyContact: 'Mary Student: 123-456-7894',
        studentId: '12345',
        department: 'Engineering'
      },
      {
        id: '4',
        email: 'staff@example.com',
        name: 'Sarah Staff',
        role: 'staff',
        phone: '123-456-7895',
        dateOfBirth: '1990-08-12',
        gender: 'female',
        address: '101 Staff Road',
        emergencyContact: 'Mike Staff: 123-456-7896',
        staffId: '67890',
        position: 'Nurse'
      }
    ];
    
    const results = [];
    
    // Try to add each sample user
    for (const user of sampleUsers) {
      try {
        // Check if user exists
        const existingUser = await userModel.getById(user.id);
        
        if (!existingUser) {
          const newUser = await userModel.create(user);
          results.push({ status: 'created', user: newUser });
        } else {
          results.push({ status: 'exists', userId: user.id });
        }
      } catch (error) {
        console.error(`Error adding sample user ${user.email}:`, error);
        results.push({ status: 'error', user: user.email, error: error.message });
      }
    }
    
    res.json({ message: 'Sample users check complete', results });
  } catch (error) {
    console.error('Error in ensureSampleUsers controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
