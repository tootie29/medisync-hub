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

// Load environment variables from .env file
dotenv.config();

const app = express();

// In cPanel, use the PORT that cPanel provides via environment variables
// If running locally, use the port from .env file or default to 8080
const PORT = process.env.PORT || 8080;

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
  // If APPLICATION_URL is set in .env, use it
  if (process.env.APPLICATION_URL) {
    return process.env.APPLICATION_URL;
  }
  // For API-only server, use empty base path
  return '';
};

const BASE_PATH = getBasePath();
console.log(`Using base path: "${BASE_PATH}"`);

// Enhanced CORS configuration with explicit allowed origins
const allowedOrigins = process.env.CORS_ALLOWED_ORIGIN ? 
  [process.env.CORS_ALLOWED_ORIGIN] : 
  [
    // Local development
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:3000',
    
    // Production domains - explicitly include full domain
    'https://climasys.entrsolutions.com',
    'https://app.climasys.entrsolutions.com',
    'https://www.climasys.entrsolutions.com',
    
    // Lovable preview domains
    /\.lovableproject\.com$/
  ];

console.log('CORS: Allowed origins configured:', allowedOrigins);

// Setup CORS with detailed configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log(`CORS: Allowing origin: ${origin}`);
      return callback(null, true);
    } else {
      console.log(`CORS: Blocking origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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

// API Routes - using BASE_PATH (which might be /server in production)
app.use(`${BASE_PATH}/api/users`, userRoutes);
app.use(`${BASE_PATH}/api/medical-records`, medicalRecordRoutes);
app.use(`${BASE_PATH}/api/appointments`, appointmentRoutes);
app.use(`${BASE_PATH}/api/medicines`, medicineRoutes);

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

// For production, only handle API routes - do not serve static files or handle other routes
if (isProduction) {
  console.log('Running in production mode - only handling API routes');
  
  // Create a route to handle 404 errors for API routes
  app.use(`${BASE_PATH}/api/*`, (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `The requested API endpoint ${req.originalUrl} was not found.`,
      availableEndpoints: [`${BASE_PATH}/api/health`, `${BASE_PATH}/api/users`, `${BASE_PATH}/api/medical-records`, `${BASE_PATH}/api/appointments`, `${BASE_PATH}/api/medicines`],
      timestamp: new Date().toISOString()
    });
  });
  
  // For any non-API route, return a message explaining the server structure
  app.get('*', (req, res) => {
    res.status(200).json({
      message: 'ClimaSys API Server',
      note: 'This server only handles API endpoints. The React frontend is served from the root domain.',
      apiRoot: `${BASE_PATH}/api`,
      availableEndpoints: [`${BASE_PATH}/api/health`, `${BASE_PATH}/api/users`, `${BASE_PATH}/api/medical-records`, `${BASE_PATH}/api/appointments`, `${BASE_PATH}/api/medicines`],
      timestamp: new Date().toISOString()
    });
  });
} else {
  // Create a simple welcome page at root level for development
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>ClimaSys API Server</title>
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
          <h1>ClimaSys API Server</h1>
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
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    timestamp: new Date().toISOString()
  });
});

// Try multiple ports if the initial one fails
// This helps in cPanel environments where the exact port might vary
const tryPort = (port, maxAttempts = 3) => {
  let currentAttempt = 1;
  
  const attemptListen = (port) => {
    console.log(`Attempting to start server on port ${port} (attempt ${currentAttempt}/${maxAttempts})`);
    
    try {
      return app.listen(port, () => {
        console.log(`Server successfully running on port ${port}`);
        console.log(`Health check available at: http://localhost:${port}${BASE_PATH}/api/health`);
        if (isProduction) {
          console.log(`Running in production mode. Base path: ${BASE_PATH}`);
          console.log(`Production API URL: https://climasys.entrsolutions.com${BASE_PATH}/api/health`);
        }
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use.`);
          
          if (currentAttempt < maxAttempts) {
            currentAttempt++;
            const nextPort = port + 1;
            console.log(`Trying next port: ${nextPort}`);
            return attemptListen(nextPort);
          } else {
            console.error('This may be due to cPanel port assignment or another process is using this port.');
            console.log('Try one of these solutions:');
            console.log('1. Stop any other Node.js applications in cPanel that might be using these ports');
            console.log(`2. Ask your hosting provider to free up ports ${PORT}-${PORT + maxAttempts - 1} or assign a different port`);
            console.log('3. Update your .env file with the PORT value shown in cPanel');
            process.exit(1);
          }
        } else {
          console.error('Server error:', err);
          process.exit(1);
        }
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  };
  
  return attemptListen(port);
};

// Start server with automatic port adjustment
let server = tryPort(PORT);

// Graceful shutdown
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  if (server) {
    server.close(() => {
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
