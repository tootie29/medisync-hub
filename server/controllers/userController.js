const userModel = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create email transporter based on environment
const getEmailTransporter = async () => {
  try {
    // First try to require nodemailer - this will fail if not installed
    const nodemailer = require('nodemailer');
    console.log('Nodemailer package successfully loaded');
    
    // Check if SMTP settings are available
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      console.log('SMTP configuration found:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER ? 'Provided' : 'Missing',
        pass: process.env.SMTP_PASS ? 'Provided' : 'Missing'
      });
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        // Add debug option to see detailed SMTP communication logs
        debug: true
      });
      
      console.log('Testing SMTP connection...');
      try {
        // Test the connection before returning the transporter
        await transporter.verify();
        console.log('SMTP connection verified successfully');
        return transporter;
      } catch (smtpError) {
        console.error('SMTP connection test failed:', smtpError);
        throw smtpError;
      }
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
  } catch (error) {
    console.error('Nodemailer setup error:', error.message);
    // Return null if nodemailer is not available
    return null;
  }
};

// Function to send verification email
const sendVerificationEmail = async (recipientEmail, verificationLink) => {
  try {
    console.log(`Attempting to send verification email to RECIPIENT: ${recipientEmail}`);
    console.log(`Verification link: ${verificationLink}`);
    
    const transporter = await getEmailTransporter();
    
    // If transporter is null, nodemailer is not available
    if (!transporter) {
      console.error('Email functionality is not available - nodemailer not installed');
      return { 
        success: false, 
        error: 'Email functionality is not available. Please install nodemailer package.',
        requiresManualVerification: true
      };
    }
    
    const nodemailer = require('nodemailer');
    
    // Ensure we're explicitly setting the recipient to the user's email address
    const mailOptions = {
      from: process.env.SMTP_FROM || '"MediSync System" <noreply@medisync.com>',
      to: recipientEmail, // This should be the registering user's email
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
    
    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to, // Log the recipient's email for debugging
      subject: mailOptions.subject
    });
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sending result:', info);
    
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
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response
    });
    return { 
      success: false, 
      error: error.message || 'Failed to send verification email',
      errorDetails: {
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
        response: error.response
      },
      requiresManualVerification: true
    };
  }
};

// Function to send password reset email
const sendPasswordResetEmail = async (recipientEmail, resetLink) => {
  try {
    console.log(`Attempting to send password reset email to RECIPIENT: ${recipientEmail}`);
    console.log(`Reset link: ${resetLink}`);
    
    const transporter = await getEmailTransporter();
    
    // If transporter is null, nodemailer is not available
    if (!transporter) {
      console.error('Email functionality is not available - nodemailer not installed');
      return { 
        success: false, 
        error: 'Email functionality is not available. Please install nodemailer package.',
        requiresManualReset: true
      };
    }
    
    const nodemailer = require('nodemailer');
    
    // FIXED: Ensure we're explicitly setting the recipient to the user's email address
    const mailOptions = {
      from: process.env.SMTP_FROM || '"MediSync System" <noreply@medisync.com>',
      to: recipientEmail, // This should be the email of the user who requested the reset
      subject: 'Reset your MediSync password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d6efd;">MediSync Password Reset</h2>
          <p>You requested to reset your password. Click the link below to set a new password:</p>
          <p>
            <a 
              href="${resetLink}" 
              style="background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"
            >
              Reset Password
            </a>
          </p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
          <p>Best regards,<br>MediSync Team</p>
        </div>
      `
    };
    
    console.log('Sending password reset email with options:', {
      from: mailOptions.from,
      to: mailOptions.to, // Log the recipient's email for debugging
      subject: mailOptions.subject
    });
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sending result:', info);
    
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
    console.error('Error sending password reset email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response
    });
    return { 
      success: false, 
      error: error.message || 'Failed to send password reset email',
      errorDetails: {
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
        response: error.response
      },
      requiresManualReset: true
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
      tokenExpiry: tokenExpiry,
      consentGiven: userData.consent_given || userData.consentGiven || false
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
      // FIXED: Make sure we're using the user's email address, not the admin email
      // This is the critical fix - ensure the email is sent to the registering user
      emailResult = await sendVerificationEmail(userDataForDb.email, verificationLink);
      console.log('Email sending result:', emailResult);
    }
    
    // Don't send the password back in the response
    const { password, ...userWithoutPassword } = newUser;
    
    // Special case for missing nodemailer dependency
    if (emailResult.requiresManualVerification) {
      return res.status(201).json({
        ...userWithoutPassword,
        message: 'Registration successful but email verification system is currently offline. Please contact admin to verify your account.',
        verificationLink, // Include the link so admins can manually verify
        emailSent: false,
        requiresManualVerification: true
      });
    }
    
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
      staffId: userData.staffId || userData.staffId,
      position: userData.position,
      faculty: userData.faculty,
      password: userData.password,
      emailVerified: userData.emailVerified || userData.email_verified,
      verificationToken: userData.verificationToken || userData.verification_token,
      tokenExpiry: userData.tokenExpiry || userData.token_expiry,
      consentGiven: userData.consent_given || userData.consentGiven
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
    
    // Check if the request is from a browser (has accept header for html)
    const isHtmlRequest = req.headers.accept && req.headers.accept.includes('text/html');
    
    if (result.success) {
      // If it's a browser request, redirect to the login page
      if (isHtmlRequest) {
        // Determine the frontend URL based on the request origin or host
        let frontendUrl = 'https://climasys.entrsolutions.com';
        
        // Try to determine the origin domain from the request
        const origin = req.headers.origin;
        const host = req.headers.host;
        
        if (origin && origin.includes('climasys.entrsolutions.com')) {
          frontendUrl = origin;
        } else if (host && !host.includes('api.')) {
          // If host doesn't include 'api.', it might be the frontend
          frontendUrl = `${req.protocol}://${host}`;
        }
        
        // Add a success parameter to show a message on the login page
        return res.redirect(`${frontendUrl}/login?verified=true&email=${encodeURIComponent(result.email)}`);
      }
      
      // For API requests, return a JSON response
      res.status(200).json({ 
        message: 'Email verified successfully! You can now log in.', 
        email: result.email 
      });
    } else {
      // For failed verification with browser request
      if (isHtmlRequest) {
        // Determine the frontend URL as above
        let frontendUrl = 'https://climasys.entrsolutions.com';
        
        const origin = req.headers.origin;
        const host = req.headers.host;
        
        if (origin && origin.includes('climasys.entrsolutions.com')) {
          frontendUrl = origin;
        } else if (host && !host.includes('api.')) {
          frontendUrl = `${req.protocol}://${host}`;
        }
        
        return res.redirect(`${frontendUrl}/login?verified=false&message=${encodeURIComponent(result.message)}`);
      }
      
      // For API requests, return error message
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error in verifyEmail controller:', error);
    
    // If it's a browser request, redirect to login page with error
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect('https://climasys.entrsolutions.com/login?verified=false&message=Server%20error%20during%20verification');
    }
    
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
    
    console.log('Resend verification request for email:', email);
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
    console.log('New verification link generated:', verificationLink);
    
    // In development or testing, use a more direct approach for email verification
    const isTestEnvironment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    
    let emailResult = { success: false };
    
    // Only attempt to send email if not in test mode
    if (!isTestEnvironment) {
      try {
        // FIXED: Make sure we're sending to the user's email who needs verification
        // This is the critical fix - ensure the email is sent to the user who requested verification
        emailResult = await sendVerificationEmail(email, verificationLink);
        console.log('Email resending result:', emailResult);
      } catch (error) {
        console.error('Error sending verification email:', error);
        emailResult = { 
          success: false, 
          error: error.message, 
          requiresManualVerification: true 
        };
      }
    }
    
    // Special case for missing nodemailer dependency or failed email sending
    if (emailResult.requiresManualVerification || !emailResult.success) {
      return res.json({ 
        message: 'Email verification system could not send the email. Please use the verification link provided.',
        verificationLink, // Include the link so users can manually verify
        emailSent: false,
        requiresManualVerification: true,
        errorDetails: emailResult.errorDetails || null
      });
    }
    
    res.json({
      message: 'Verification email sent! Please check your inbox.',
      verificationLink: isTestEnvironment ? verificationLink : undefined,
      emailSent: emailResult.success,
      emailPreviewUrl: emailResult.previewUrl
    });
  } catch (error) {
    console.error('Error in resendVerification controller:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      requiresManualVerification: true,
      // Include a verification link even when there's an error, as a fallback
      verificationLink: error.verificationLink
    });
  }
};

// New function to check if an email is already registered
exports.checkEmailAvailability = async (req, res) => {
  try {
    const email = req.params.email;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    console.log('Checking email availability for:', email);
    const user = await userModel.getUserByEmail(email);
    
    if (user) {
      console.log('Email already exists:', email);
      return res.status(200).json({ available: false });
    }
    
    console.log('Email is available:', email);
    res.status(200).json({ available: true });
  } catch (error) {
    console.error('Error checking email availability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// New endpoint for forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    console.log('Forgot password request for email:', email);
    
    // Generate reset token
    const result = await userModel.generateResetToken(email);
    
    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }
    
    // FIXED: Create reset link properly pointing to the frontend URL instead of the API
    // Determine the correct frontend URL
    let frontendUrl = process.env.FRONTEND_URL;
    
    // Try to determine frontend URL from request origin
    const origin = req.headers.origin;
    
    // If origin exists and it's not the API domain, use it as the frontend URL
    if (origin && !origin.includes('api.')) {
      frontendUrl = origin;
    } 
    // If we still don't have a frontend URL, construct it from the host
    else if (!frontendUrl) {
      const host = req.get('host') || '';
      const apiSubdomain = host.startsWith('api.');
      
      if (apiSubdomain) {
        // Remove 'api.' prefix for the frontend domain
        frontendUrl = `${req.protocol}://${host.replace('api.', '')}`;
      } else {
        // Use the current host if it doesn't have 'api.' in it
        frontendUrl = `${req.protocol}://${host}`;
      }
    }
    
    // Ensure we have a proper URL with no double slashes
    if (frontendUrl.endsWith('/')) {
      frontendUrl = frontendUrl.slice(0, -1);
    }
    
    console.log('Using frontend URL for reset link:', frontendUrl);
    
    // Create proper reset link pointing to the frontend
    const resetLink = `${frontendUrl}/reset-password/${result.token}`;
    console.log('Reset link:', resetLink);
    
    // In development or testing, use a more direct approach for reset
    const isTestEnvironment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    
    let emailResult = { success: false };
    
    // Only attempt to send email if not in test mode
    if (!isTestEnvironment) {
      // FIXED: Make sure we're sending to the user's email who requested the reset
      emailResult = await sendPasswordResetEmail(email, resetLink);
      console.log('Email sending result:', emailResult);
    }
    
    // Special case for missing nodemailer dependency
    if (emailResult.requiresManualReset) {
      return res.status(200).json({
        message: 'Password reset link generated but email system is currently offline. Please use the link provided.',
        resetLink,
        emailSent: false,
        requiresManualReset: true
      });
    }
    
    res.status(200).json({
      message: 'Password reset instructions sent to your email.',
      resetLink: isTestEnvironment ? resetLink : undefined,
      emailSent: emailResult.success,
      emailPreviewUrl: emailResult.previewUrl
    });
  } catch (error) {
    console.error('Error in forgotPassword controller:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      resetLink: error.resetLink
    });
  }
};

// Validate reset token
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const result = await userModel.validateResetToken(token);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error validating reset token:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    const result = await userModel.resetPassword(token, password);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Error in resetPassword controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
