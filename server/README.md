
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
PORT=3001
```

3. Install dependencies
```
npm install
```

4. Start the server
```
node server.js
```

Your server should now be running at http://localhost:3001

## cPanel Production Deployment

### cPanel Configuration

1. Log in to your cPanel account
2. Go to the Node.js section
3. Create a new Node.js application with the following settings:
   - Node.js version: 14.x or higher
   - Application mode: Production
   - Application root: The directory where your server.js is located (e.g., `/home/username/server`)
   - Application URL: `/server` (no trailing slash)
   - Application startup file: `server.js`

### Environment Setup

1. Create a `.env` file in the server directory with production settings:
```
DB_HOST=localhost
DB_USER=your_cpanel_username_databaseuser
DB_PASSWORD=your_database_password
DB_NAME=your_cpanel_username_databasename
NODE_ENV=production
```

> **Note:** cPanel often prefixes database names and users with your cPanel username. 
> Example: If your cPanel username is "medisync" and you created a database named "medi_hub" 
> with a user "admin", your configuration might be:
> ```
> DB_USER=medisync_admin
> DB_NAME=medisync_medi_hub
> ```

2. Click "Run NPM Install" to install all dependencies
3. Click "Run JS Script" to start the server

### Verify Deployment

Visit `https://yourdomain.com/server/api/health` to check if the server is running correctly.

You should see a JSON response with server health information.

### Troubleshooting

If you encounter any issues:

1. **503 Service Unavailable**
   - Ensure the Node.js application is running (check if "Run JS Script" has been clicked)
   - Verify your Application URL is set to `/server` (without a trailing slash)
   - Check cPanel error logs for Node.js errors

2. **Database Connection Issues**
   - Verify database credentials in the `.env` file
   - Check if the database exists and the user has proper permissions
   - Try running a manual MySQL connection test

3. **Path Issues**
   - Ensure the Application URL is set to `/server`
   - Make sure all API requests use the correct path: `/server/api/...`

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
