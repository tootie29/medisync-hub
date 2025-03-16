
# MediHub Backend Server

This is the backend server for the MediHub application.

## Local Development Setup

### Prerequisites

- Node.js (v14 or later)
- MySQL (via MAMP or XAMPP)
- npm or yarn

### Database Setup

1. Start your MAMP or XAMPP MySQL server
2. Create a new database named `medi_hub`
3. Import the schema by running the SQL commands in `db/schema.sql`

### Server Setup

1. Copy `.env.example` to `.env`
```
cp .env.example .env
```

2. Update the database credentials in `.env` if needed
```
DB_HOST=localhost
DB_USER=root     # Default user for MAMP/XAMPP
DB_PASSWORD=     # Default is empty for XAMPP, "root" for MAMP
DB_NAME=medi_hub
PORT=8080
```

3. Install dependencies
```
npm install
```

4. Start the server
```
node server.js
```

Your server should now be running at http://localhost:8080

## Production Deployment Options

### Option 1: Separate Domain for API Server

#### Domain Setup

1. Configure two domains in your hosting:
   - Frontend: `app.climasys.entrsolutions.com` or `climasys.entrsolutions.com`
   - API Server: `api.climasys.entrsolutions.com`

2. Set up DNS records for both domains pointing to your hosting server

#### CORS Configuration for Separate Domains

When using separate domains for your frontend and API, you must properly configure CORS:

1. In your server's `.env` file, add:
```
CORS_ALLOWED_ORIGIN=https://climasys.entrsolutions.com
```

2. Your API server's CORS configuration (in server.js) should explicitly allow the frontend domain:
```javascript
app.use(cors({
  origin: ['https://climasys.entrsolutions.com', 'https://app.climasys.entrsolutions.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

#### cPanel Configuration for API Server

1. Log in to your cPanel account
2. Go to the Node.js section
3. Create a new Node.js application with the following settings:
   - Domain: Select your API domain (e.g., `api.climasys.entrsolutions.com`)
   - Node.js version: 14.x or higher
   - Application mode: Production
   - Application root: The directory where your server.js is located
   - Application URL: `/` (root of the domain)
   - Application startup file: `server.js`

#### Environment Setup

1. Create a `.env` file in the server directory with production settings:
```
DB_HOST=localhost
DB_USER=your_cpanel_username_databaseuser
DB_PASSWORD=your_database_password
DB_NAME=your_cpanel_username_databasename
NODE_ENV=production
APPLICATION_URL=
CORS_ALLOWED_ORIGIN=https://climasys.entrsolutions.com
```

Note: Leave `APPLICATION_URL` empty because the API is served from the root of its own domain.

2. Click "Run NPM Install" to install all dependencies
3. Click "Run JS Script" to start the server

#### Frontend Configuration

1. Update the API_BASE_URL in your frontend code:
```javascript
const API_BASE_URL = 'https://api.climasys.entrsolutions.com';
```

2. Build your frontend and upload to the frontend domain

### Option 2: Subdirectory for API Server

#### Domain Setup

1. Configure your main domain in your hosting (e.g., `climasys.entrsolutions.com`)

#### cPanel Configuration for API Server

1. Log in to your cPanel account
2. Go to the Node.js section
3. Create a new Node.js application with the following settings:
   - Domain: Select your main domain (e.g., `climasys.entrsolutions.com`)
   - Node.js version: 14.x or higher
   - Application mode: Production
   - Application root: The directory where your server.js is located
   - Application URL: `/server` (no trailing slash)
   - Application startup file: `server.js`

#### Environment Setup

1. Create a `.env` file in the server directory with production settings:
```
DB_HOST=localhost
DB_USER=your_cpanel_username_databaseuser
DB_PASSWORD=your_database_password
DB_NAME=your_cpanel_username_databasename
NODE_ENV=production
APPLICATION_URL=/server
```

2. Click "Run NPM Install" to install all dependencies
3. Click "Run JS Script" to start the server

### Troubleshooting CORS Issues

If you encounter CORS errors:

1. **Check Server Logs**
   - Look for CORS-related messages in your server logs
   - Verify that your frontend's origin is in the allowed list

2. **Check CORS Headers**
   - Use browser developer tools (Network tab) to inspect the response headers
   - Ensure `Access-Control-Allow-Origin` includes your frontend domain

3. **Check Server Configuration**
   - Verify the CORS configuration in `server.js`
   - Ensure the `origin` list includes your frontend domain

4. **Use Explicit Origin**
   - Replace regex patterns with explicit domain strings for reliability

5. **Test with curl**
   - Use curl to test API endpoints and check CORS headers:
   ```
   curl -H "Origin: https://climasys.entrsolutions.com" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: X-Requested-With" \
        -X OPTIONS --verbose \
        https://api.climasys.entrsolutions.com/api/health
   ```

### Verify Deployment

Visit your API health endpoint to check if the server is running correctly:
- Option 1: `https://api.climasys.entrsolutions.com/api/health`
- Option 2: `https://climasys.entrsolutions.com/server/api/health`

You should see a JSON response with server health information.

### Troubleshooting

If you encounter any issues:

1. **CORS Errors**
   - Ensure your server's CORS configuration includes your frontend domain
   - Check for any proxy or SSL configuration issues

2. **503 Service Unavailable**
   - Ensure the Node.js application is running (check if "Run JS Script" has been clicked)
   - Verify your Application URL is correct
   - Check cPanel error logs for Node.js errors

3. **Database Connection Issues**
   - Verify database credentials in the `.env` file
   - Check if the database exists and the user has proper permissions

4. **Path Issues**
   - Ensure the Application URL is correctly set
   - Make sure API requests use the correct path

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/role/:role` - Get users by role
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Medical Records
- `GET /api/medical-records` - Get all medical records
- `GET /api/medical-records/:id` - Get medical record by ID
- `GET /api/medical-records/patient/:patientId` - Get medical records by patient ID
- `POST /api/medical-records` - Create new medical record
- `PUT /api/medical-records/:id` - Update medical record
- `DELETE /api/medical-records/:id` - Delete medical record

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `GET /api/appointments/patient/:patientId` - Get appointments by patient ID
- `GET /api/appointments/doctor/:doctorId` - Get appointments by doctor ID
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Medicines
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `POST /api/medicines` - Create new medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

### Health Check
- `GET /api/health` - Check if server is running
