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
5. Frontend shows popup: "Admin successfully created"

## Implementation Notes

The current implementation includes:
- Mock authentication for demonstration purposes
- API route for admin creation (`/app/api/admin/route.ts`)
- Proper routing and middleware for protection
- Responsive UI components using shadcn/ui

## Setup

1. Install dependencies: `npm install`
2. Set up Supabase environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run development server: `npm run dev`

## Database Schema

The application expects a `users` table with the following structure:
- `id` (string) - User ID from Supabase Auth
- `email` (string) - User email
- `role` (string) - User role ('admin' or 'superadmin')
- `permissions` (string array) - User permissions
- `created_at` (timestamp) - Account creation timestamp
- `last_login` (timestamp, optional) - Last login timestamp