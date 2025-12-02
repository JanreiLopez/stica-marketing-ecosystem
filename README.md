# STICA Marketing Ecosystem - Admin Portal

This project implements an admin portal with superadmin capabilities for the STICA Marketing Ecosystem.

## Structure

- `/app/login` - Login page (moved outside admin directory)
- `/app/admin` - Admin dashboard and modules
- `/app/superadmin` - Superadmin dashboard
- `/app/api` - API routes for backend functionality

## Features

### Login Page
- Moved outside the admin directory as requested
- Supports both regular admin login and superadmin login
- Toggle between login and admin creation modes

### Superadmin Dashboard
- Create new admin accounts with temporary passwords
- View list of all admin accounts
- Logout functionality

### Admin Creation Flow
1. Superadmin enters admin personal email
2. System generates temporary password
3. Backend creates Supabase Auth user
4. Backend stores role = 'admin' and permissions in the database
5. System sends welcome email with temporary credentials (if SMTP configured)
6. Frontend shows popup with temporary password for manual sharing if needed

## Implementation Notes

The current implementation includes:
- Mock authentication for demonstration purposes
- API route for admin creation (`/app/api/admin/route.ts`)
- Proper routing and middleware for protection
- Responsive UI components using shadcn/ui

## Setup

1. Install dependencies: `npm install`
2. Set up environment variables by copying `.env.example` to `.env` and filling in the values:
   - Supabase configuration variables
   - SMTP configuration for sending emails (required for admin invitation emails)
     - For Gmail: Use an App Password instead of your regular password
     - See: https://support.google.com/accounts/answer/185833
3. Run development server: `npm run dev`

## Email Configuration

To enable automatic email sending for admin invitations:

1. Configure your SMTP settings in the `.env` file
2. For Gmail:
   - Enable 2-factor authentication on your Google account
   - Generate an App Password: https://myaccount.google.com/apppasswords
   - Use your Gmail address as `SMTP_USER` and the App Password as `SMTP_PASS`
3. For other providers like SendGrid, AWS SES, etc., configure the appropriate SMTP settings

## Database Schema

The application expects a `profiles` table with the following structure:
- `id` (string) - User ID from Supabase Auth
- `email` (string) - User email
- `role` (string) - User role ('admin' or 'superadmin')
- `permissions` (string array) - User permissions
- `first_name` (string, optional) - User's first name
- `last_name` (string, optional) - User's last name
- `name` (string, optional) - User's full name (first_name + last_name)
- `created_at` (timestamp) - Account creation timestamp
- `last_login` (timestamp, optional) - Last login timestamp