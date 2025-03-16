const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { testConnection } = require('./db/config');
const userRoutes = require('./routes/userRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables from .env file
dotenv.config();

// Create server PID file to help with management
const PID_FILE = path.join(__dirname, 'server.pid');
fs.writeFileSync(PID_FILE, process.pid.toString());
console.log(`Process ID ${process.pid} written to ${PID_FILE}`);

const app = express();

// In cPanel, use the PORT that cPanel provides via environment variables
// If running locally, use the port from .env file or default to 8080
const PORT = parseInt(process.env.PORT || 8080, 10);

// Production check
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

// Log startup information to help with debugging
console.log('=== SERVER STARTUP ===');
console.log(`Time: ${new Date().toISOString()}`);
console.log(`Node version: ${process.version}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`PORT: ${PORT}`);
console.log('=====================');

// For API-only server, use empty base path
const BASE_PATH = '';
console.log(`Using base path: "${BASE_PATH}"`);

// Enhanced CORS configuration - temporarily allow all origins for troubleshooting
// This is more permissive to help diagnose connection issues
const corsOptions = {
  origin: '*', // Allow all origins for now
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

console.log('CORS: Temporarily allowing all origins for troubleshooting');
app.use(cors(corsOptions));

// Log all requests to help with debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} (IP: ${req.ip})`);
  next();
});

// Middleware
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// Add request timeout middleware
app.use((req, res, next) => {
  // Set timeout to 60 seconds instead of 30
  req.setTimeout(60000, () => {
    console.error(`Request timeout: ${req.method} ${req.originalUrl}`);
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
    console.log('Testing database connection...');
    dbConnected = await testConnection();
    console.log('Database connection status:', dbConnected ? 'Connected' : 'Disconnected');
    
    // If connection fails, retry every 30 seconds
    if (!dbConnected) {
      console.log('Will retry database connection in 30 seconds...');
      setTimeout(initializeDB, 30000);
    } else {
      // Only start listening for requests if DB is connected
      startServer();
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    console.log('Will retry database connection in 30 seconds...');
    setTimeout(initializeDB, 30000);
  }
}

// API Routes - keep them at root level for the API subdomain
app.use(`/api/users`, userRoutes);
app.use(`/api/medical-records`, medicalRecordRoutes);
app.use(`/api/appointments`, appointmentRoutes);
app.use(`/api/medicines`, medicineRoutes);

// Health check endpoint with detailed information
app.get(`/api/health`, (req, res) => {
  const serverInfo = {
    status: dbConnected ? 'OK' : 'WARNING',
    timestamp: new Date().toISOString(),
    server: {
      running: true,
      version: process.env.npm_package_version || 'unknown',
      nodeVersion: process.version,
      uptime: process.uptime() + ' seconds',
      environment: isProduction ? 'production' : 'development',
      basePath: BASE_PATH,
      port: PORT,
      processId: process.pid
    },
    database: {
      connected: dbConnected,
      message: dbConnected ? 'Database is connected' : 'Database is not connected - check MySQL service and credentials',
      host: process.env.DB_HOST || 'localhost',
      name: process.env.DB_NAME || 'not set'
    },
    request: {
      ip: req.ip,
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      host: req.get('host') || 'unknown'
    }
  };

  console.log('Health check requested. Server info:', serverInfo);
  res.json(serverInfo);
});

// Root endpoint with detailed documentation
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'ClimaSys API Server',
    version: process.env.npm_package_version || '1.0.0',
    environment: isProduction ? 'production' : 'development',
    documentation: 'API endpoints are available at /api/*',
    availableEndpoints: [
      '/api/health',
      '/api/users',
      '/api/medical-records',
      '/api/appointments',
      '/api/medicines'
    ],
    timestamp: new Date().toISOString()
  });
});

// Create a route to handle 404 errors for API routes
app.use(`/api/*`, (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested API endpoint ${req.originalUrl} was not found.`,
    availableEndpoints: [`/api/health`, `/api/users`, `/api/medical-records`, `/api/appointments`, `/api/medicines`],
    timestamp: new Date().toISOString()
  });
});

// For any non-API route, return a message explaining the server structure
app.get('*', (req, res) => {
  res.status(200).json({
    message: 'ClimaSys API Server',
    note: 'This server only handles API endpoints. The React frontend is served from the root domain.',
    apiRoot: `/api`,
    availableEndpoints: [`/api/health`, `/api/users`, `/api/medical-records`, `/api/appointments`, `/api/medicines`],
    timestamp: new Date().toISOString()
  });
});

// Global error handler with more detailed error information
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Send more detailed error information in development mode
  if (!isProduction) {
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// Create a server reference at the top level scope
let serverInstance = null;

// Function to start the server after successful DB connection
function startServer() {
  console.log(`Attempting to start server on port ${PORT}`);
  
  try {
    serverInstance = app.listen(PORT, () => {
      console.log(`Server successfully running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
      if (isProduction) {
        console.log(`Running in production mode.`);
        console.log(`Production API URL: https://api.climasys.entrsolutions.com/api/health`);
      }
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        console.log('Try one of these solutions:');
        console.log('1. Stop any other Node.js applications that might be using this port');
        console.log(`2. Use the stop.js script to stop any existing server instances: node stop.js`);
        console.log('3. Update your .env file with a different PORT value');
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Improved graceful shutdown
function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  
  // Remove PID file
  if (fs.existsSync(PID_FILE)) {
    try {
      fs.unlinkSync(PID_FILE);
      console.log(`Removed PID file: ${PID_FILE}`);
    } catch (error) {
      console.error(`Failed to remove PID file: ${error.message}`);
    }
  }
  
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('Closed out remaining connections');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Graceful shutdown
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
process.on('SIGUSR2', shutDown); // For Nodemon restart

// Check if there's already a running server and try to stop it
const checkExistingServer = () => {
  if (fs.existsSync(PID_FILE)) {
    try {
      const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
      console.log(`Found existing server with PID ${pid}, attempting to stop it first...`);
      
      try {
        // Send SIGTERM to the process
        process.kill(parseInt(pid, 10), 'SIGTERM');
        console.log(`Signal sent to existing process ${pid}, waiting 2 seconds before starting new server...`);
        
        // Wait 2 seconds before continuing
        return new Promise(resolve => setTimeout(resolve, 2000))
          .then(() => initializeDB());
      } catch (error) {
        // If the process doesn't exist or we can't kill it, just remove the PID file
        if (error.code === 'ESRCH') {
          console.log(`No process found with PID ${pid}, removing stale PID file`);
          fs.unlinkSync(PID_FILE);
        } else {
          console.error(`Error stopping existing server: ${error.message}`);
        }
        initializeDB();
      }
    } catch (error) {
      console.error(`Error reading PID file: ${error.message}`);
      initializeDB();
    }
  } else {
    initializeDB();
  }
};

// Create a stopServer script to help with cPanel management
const STOP_SCRIPT = path.join(__dirname, 'stop.js');
fs.writeFileSync(STOP_SCRIPT, `
// Simple script to stop the server
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PID_FILE = path.join(__dirname, 'server.pid');

if (fs.existsSync(PID_FILE)) {
  const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
  console.log(\`Stopping server with PID \${pid}...\`);
  
  try {
    process.kill(parseInt(pid, 10), 'SIGTERM');
    console.log(\`Signal sent to process \${pid}\`);
  } catch (error) {
    console.error(\`Error stopping process: \${error.message}\`);
    
    // If the process doesn't exist, clean up the PID file
    if (error.code === 'ESRCH') {
      fs.unlinkSync(PID_FILE);
      console.log(\`Removed stale PID file\`);
    }
  }
} else {
  console.log('No server.pid file found. Server may not be running.');
}
`);

console.log(`Created stop script at ${STOP_SCRIPT}`);

// First check for existing server, then start the initialization process
checkExistingServer();
