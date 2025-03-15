
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { testConnection } = require('./db/config');
const userRoutes = require('./routes/userRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicineRoutes = require('./routes/medicineRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced CORS configuration with all possible domains
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:3000',
    'https://medisync.entrsolutions.com',
    /\.lovableproject\.com$/ // Allow all Lovable preview domains
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(bodyParser.json());

// Add request timeout middleware
app.use((req, res, next) => {
  // Set timeout to 30 seconds
  req.setTimeout(30000, () => {
    res.status(503).json({ 
      error: 'Request timeout', 
      message: 'The server is taking too long to respond. Please try again later.' 
    });
  });
  next();
});

// Database connection status
let dbConnected = false;

// Test database connection
async function initializeDB() {
  try {
    dbConnected = await testConnection();
    console.log('Database connection status:', dbConnected ? 'Connected' : 'Disconnected');
    
    // If connection fails, retry every 10 seconds
    if (!dbConnected) {
      console.log('Will retry database connection in 10 seconds...');
      setTimeout(initializeDB, 10000);
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    console.log('Will retry database connection in 10 seconds...');
    setTimeout(initializeDB, 10000);
  }
}

// Initialize database connection
initializeDB();

// Health check endpoint with detailed information
app.get('/api/health', (req, res) => {
  const serverInfo = {
    status: dbConnected ? 'OK' : 'WARNING',
    timestamp: new Date().toISOString(),
    server: {
      running: true,
      version: process.env.npm_package_version || 'unknown',
      nodeVersion: process.version,
      uptime: process.uptime() + ' seconds'
    },
    database: {
      connected: dbConnected,
      message: dbConnected ? 'Database is connected' : 'Database is not connected - check MySQL service'
    }
  };

  if (dbConnected) {
    res.json(serverInfo);
  } else {
    // Return a 200 OK but with a warning message if DB isn't connected
    res.json(serverInfo);
  }
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medicines', medicineRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  server.close(() => {
    console.log('Closed out remaining connections');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}
