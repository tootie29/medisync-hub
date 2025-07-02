
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

console.log('Starting MediHub API Server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for PDF data
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Root route handler - fix for "Cannot GET /"
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.json({ 
    message: 'MediHub API Server is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      medicalRecords: '/api/medical-records',
      appointments: '/api/appointments',
      medicines: '/api/medicines',
      logos: '/api/logos',
      email: '/api/email'
    }
  });
});

// Health check endpoint - moved before other routes for easier debugging
app.get('/api/health', (req, res) => {
  console.log('Health check accessed');
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes with error handling
try {
  console.log('Loading routes...');
  app.use('/api/email', require('./routes/emailRoutes'));
  console.log('Email routes loaded successfully');
  
  // Load other routes with individual error handling
  try {
    app.use('/api/users', require('./routes/userRoutes'));
    console.log('User routes loaded');
  } catch (err) {
    console.log('Warning: Could not load user routes:', err.message);
  }
  
  try {
    app.use('/api/medical-records', require('./routes/medicalRecordRoutes'));
    console.log('Medical record routes loaded');
  } catch (err) {
    console.log('Warning: Could not load medical record routes:', err.message);
  }
  
  try {
    app.use('/api/appointments', require('./routes/appointmentRoutes'));
    console.log('Appointment routes loaded');
  } catch (err) {
    console.log('Warning: Could not load appointment routes:', err.message);
  }
  
  try {
    app.use('/api/medicines', require('./routes/medicineRoutes'));
    console.log('Medicine routes loaded');
  } catch (err) {
    console.log('Warning: Could not load medicine routes:', err.message);
  }
  
  try {
    app.use('/api/logos', require('./routes/logoRoutes'));
    console.log('Logo routes loaded');
  } catch (err) {
    console.log('Warning: Could not load logo routes:', err.message);
  }
  
} catch (error) {
  console.error('Error loading routes:', error);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: [
      '/',
      '/api/health',
      '/api/email/send-pdf'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Root endpoint: http://localhost:${PORT}/`);
});

module.exports = app;
