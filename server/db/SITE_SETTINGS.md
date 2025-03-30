
# Site Settings Structure

This document explains the site settings structure that has been implemented in the Medi-Hub application.

## Database Schema

The site settings are stored in two main tables:

### 1. `logos` Table

Stores the clinic logos used throughout the application, particularly on the login and registration pages.

```sql
CREATE TABLE IF NOT EXISTS logos (
  id VARCHAR(36) PRIMARY KEY,
  url VARCHAR(255) NOT NULL,
  position ENUM('primary', 'secondary') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. `site_settings` Table

Stores various site-wide settings for configuring the application behavior and appearance.

```sql
CREATE TABLE IF NOT EXISTS site_settings (
  id VARCHAR(36) PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type ENUM('text', 'number', 'boolean', 'json', 'color') NOT NULL DEFAULT 'text',
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Logo Storage Structure

Logos are now stored in a professional directory structure:

```
/server
  /uploads
    /assets
      /logos
        - logo-1234567890.png
        - logo-0987654321.png
        - default-logo.png
```

## Default Site Settings

The following default settings are preconfigured:

1. `site_name`: "Olivarez Clinic" - The name of the clinic
2. `site_tagline`: "Health at Your Fingertips" - The tagline displayed on login pages
3. `primary_color`: "#10b981" - Primary brand color
4. `secondary_color`: "#059669" - Secondary brand color
5. `accent_color`: "#047857" - Accent brand color
6. `show_appointment_reminders`: "true" - Whether to show appointment reminders
7. `appointment_reminder_hours`: "24" - Hours before appointment to send reminder
8. `clinic_contact_info`: JSON with contact details
9. `clinic_hours`: JSON with clinic operating hours

## How to Use Site Settings

### Accessing Site Settings

You can fetch site settings through the API:

```javascript
// Example fetching site settings
const response = await axios.get('/api/site-settings');
const settings = response.data;
```

### Logo Management

Logo management is handled through the existing logo API endpoints:

- `GET /api/logos` - Get all logos
- `GET /api/logos/:position` - Get logo by position ('primary' or 'secondary')
- `POST /api/logos` - Upload new logos

## Migration

A migration script has been created to:

1. Move existing logos to the new directory structure
2. Update database paths
3. Create the site_settings table
4. Add default settings

Run the migration with:

```
node server/db/migrate_logo_paths.js
```

## Future Enhancements

Future enhancements could include:

1. A comprehensive site settings management UI
2. User preference settings linked to user accounts
3. Theme customization options
4. Email template management
5. Notification settings per user role
