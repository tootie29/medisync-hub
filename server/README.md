
# MediHub Backend Server

This is the backend server for the MediHub application.

## Setup Instructions

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
