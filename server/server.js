
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { testConnection } = require('./db/config');
const userRoutes = require('./routes/userRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Production check
const isProduction = process.env.NODE_ENV === 'production' || process.env.PRODUCTION === 'true';
console.log(`Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

// Log startup information to help with debugging
console.log('=== SERVER STARTUP ===');
console.log(`Time: ${new Date().toISOString()}`);
console.log(`Node version: ${process.version}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`PORT: ${PORT}`);
console.log('=====================');

// Get base path for production in cPanel
const getBasePath = () => {
  if (isProduction) {
    // For direct domain access (https://medisync.entrsolutions.com/)
    // you would use an empty string '' here
    return '';
  }
  return '';
};

const BASE_PATH = getBasePath();
console.log(`Using base path: "${BASE_PATH}"`);

// Enhanced CORS configuration for production and development
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:3000',
    'https://medisync.entrsolutions.com',
    /\.lovableproject\.com$/, // Allow all Lovable preview domains
    /\.entrsolutions\.com$/ // Allow all entrsolutions subdomains
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Log all requests to help with debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} (IP: ${req.ip})`);
  next();
});

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
    
    // Log environment variables (without sensitive data)
    console.log('DB_HOST:', process.env.DB_HOST || 'not set');
    console.log('DB_USER:', process.env.DB_USER ? '(set)' : 'not set');
    console.log('DB_NAME:', process.env.DB_NAME || 'not set');
    
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

// Create a simple welcome page at root level for easier diagnostics
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>MediSync API Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
          .success { color: #059669; }
          .warning { color: #d97706; }
          code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>MediSync API Server</h1>
        <div class="card">
          <h2>Server Status: <span class="success">Running</span></h2>
          <p>The server is operational. If you're trying to access the API, use the base path: 
          <code>${BASE_PATH}/api</code></p>
          <p>For health check information, visit: <a href="${BASE_PATH}/api/health">${BASE_PATH}/api/health</a></p>
        </div>
        <div class="card">
          <h2>Environment</h2>
          <p>Running in: <strong>${isProduction ? 'Production' : 'Development'}</strong> mode</p>
          <p>Base Path: <code>${BASE_PATH}</code></p>
          <p>Database: <strong>${dbConnected ? 
            '<span class="success">Connected</span>' : 
            '<span class="warning">Not Connected</span>'}</strong></p>
        </div>
        <div class="card">
          <h2>API Endpoints</h2>
          <ul>
            <li><code>${BASE_PATH}/api/users</code> - User management</li>
            <li><code>${BASE_PATH}/api/medical-records</code> - Medical records</li>
            <li><code>${BASE_PATH}/api/appointments</code> - Appointments</li>
            <li><code>${BASE_PATH}/api/medicines</code> - Medicines inventory</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Health check endpoint with detailed information
app.get(`${BASE_PATH}/api/health`, (req, res) => {
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

// Basic root route for easy verification
app.get(`${BASE_PATH}/`, (req, res) => {
  res.json({ 
    status: 'running',
    message: 'MediSync API server is running. Use /api endpoints for data access.',
    healthCheck: `${BASE_PATH}/api/health`,
    timestamp: new Date().toISOString(),
    basePath: BASE_PATH,
    database: {
      connected: dbConnected,
      message: dbConnected ? 'Database is connected' : 'Database connection issue - check configuration'
    }
  });
});

// Routes - update all routes with the base path
app.use(`${BASE_PATH}/api/users`, userRoutes);
app.use(`${BASE_PATH}/api/medical-records`, medicalRecordRoutes);
app.use(`${BASE_PATH}/api/appointments`, appointmentRoutes);
app.use(`${BASE_PATH}/api/medicines`, medicineRoutes);

// Special route for cPanel verification
app.get('/server', (req, res) => {
  res.redirect(`${BASE_PATH}/`);
});

// Catch-all route for debugging path issues in production
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested URL ${req.originalUrl} was not found on this server.`,
    basePath: BASE_PATH,
    suggestedEndpoints: {
      root: BASE_PATH ? BASE_PATH : '/',
      health: `${BASE_PATH}/api/health`,
      users: `${BASE_PATH}/api/users`
    },
    requestInfo: {
      path: req.path,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      host: req.get('host') || 'unknown'
    },
    timestamp: new Date().toISOString()
  });
});

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
  console.log(`Health check available at: http://localhost:${PORT}${BASE_PATH}/api/health`);
  if (isProduction) {
    console.log(`Running in production mode. Base path: ${BASE_PATH}`);
    console.log(`Production URL: https://medisync.entrsolutions.com${BASE_PATH}/api/health`);
  }
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
