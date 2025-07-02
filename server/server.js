
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for PDF data
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Root route handler - fix for "Cannot GET /"
app.get('/', (req, res) => {
  res.json({ 
    message: 'MediHub API Server is running!',
    version: '1.0.0',
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

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/medical-records', require('./routes/medicalRecordRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/logos', require('./routes/logoRoutes'));
app.use('/api/email', require('./routes/emailRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
