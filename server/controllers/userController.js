const userModel = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create email transporter based on environment
const getEmailTransporter = () => {
  // Check if SMTP settings are available
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    console.log('Using SMTP configuration for email');
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  console.log('No SMTP configuration found, using ethereal test account');
  // If no SMTP settings, create a test account with Ethereal
  return new Promise((resolve, reject) => {
    nodemailer.createTestAccount().then(testAccount => {
      console.log('Created Ethereal test account:', testAccount.user);
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      resolve(transporter);
    }).catch(error => {
      console.error('Failed to create test email account:', error);
      reject(error);
    });
  });
};

// Function to send verification email
const sendVerificationEmail = async (email, verificationLink) => {
  try {
    const transporter = await getEmailTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || '"MediSync System" <noreply@medisync.com>',
      to: email,
      subject: 'Verify your MediSync account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d6efd;">Welcome to MediSync!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
          <p>
            <a 
              href="${verificationLink}" 
              style="background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"
            >
              Verify Email Address
            </a>
          </p>
          <p>If you did not create an account, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>MediSync Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    
    // If using Ethereal, log the preview URL
    if (info.ethereal) {
      console.log('Email preview URL:', nodemailer.getTestMessageUrl(info));
      return {
        success: true,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send verification email' 
    };
  }
};

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
    
    // Generate a verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);
    
    // Token expires in 24 hours
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);
    
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
      faculty: userData.faculty,
      password: userData.password,
      emailVerified: false,
      verificationToken: verificationToken,
      tokenExpiry: tokenExpiry
    };
    
    console.log('Processed user data for DB:', userDataForDb);
    
    const newUser = await userModel.create(userDataForDb);
    
    // Create verification link
    const verificationLink = `${req.protocol}://${req.get('host')}/api/users/verify/${verificationToken}`;
    console.log('Verification link:', verificationLink);
    
    // In development or testing, use a more direct approach for email verification
    const isTestEnvironment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    
    let emailResult = { success: false };
    
    // Only attempt to send email if not in test mode
    if (!isTestEnvironment) {
      emailResult = await sendVerificationEmail(userData.email, verificationLink);
      console.log('Email sending result:', emailResult);
    }
    
    // Don't send the password back in the response
    const { password, ...userWithoutPassword } = newUser;
    res.status(201).json({
      ...userWithoutPassword,
      message: 'Registration successful! Please verify your email.',
      verificationLink: isTestEnvironment ? verificationLink : undefined,
      emailSent: emailResult.success,
      emailPreviewUrl: emailResult.previewUrl
    });
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
      faculty: userData.faculty,
      password: userData.password
    };
    
    const updatedUser = await userModel.update(userId, userDataForDb);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send the password back in the response
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error in updateUser controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    console.log('Login attempt:', email);
    const user = await userModel.getUserByEmail(email);
    
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ 
        message: 'Email not verified. Please check your email for the verification link.',
        requiresVerification: true
      });
    }
    
    // Check if password matches
    console.log('Checking password match:', 
      user.password === password ? 'Password matches' : 'Password does not match');
    
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Don't include password in response
    const { password: userPassword, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error in login controller:', error);
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

// New endpoint for email verification
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    const result = await userModel.verifyEmail(token);
    
    if (result.success) {
      res.status(200).json({ 
        message: 'Email verified successfully! You can now log in.', 
        email: result.email 
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error in verifyEmail controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// New endpoint for resending verification email
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await userModel.getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.email_verified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Generate a new verification token
    const token = await userModel.generateVerificationToken(user.id);
    
    // Create verification link
    const verificationLink = `${req.protocol}://${req.get('host')}/api/users/verify/${token}`;
    
    // In development or testing, use a more direct approach for email verification
    const isTestEnvironment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    
    let emailResult = { success: false };
    
    // Only attempt to send email if not in test mode
    if (!isTestEnvironment) {
      emailResult = await sendVerificationEmail(email, verificationLink);
      console.log('Email resending result:', emailResult);
    }
    
    res.json({ 
      message: 'Verification email sent! Please check your inbox.',
      verificationLink: isTestEnvironment ? verificationLink : undefined,
      emailSent: emailResult.success,
      emailPreviewUrl: emailResult.previewUrl
    });
  } catch (error) {
    console.error('Error in resendVerification controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
