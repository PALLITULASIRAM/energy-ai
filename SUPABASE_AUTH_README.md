# Supabase Authentication Setup Guide

## Database Setup

1. Go to your Supabase project dashboard: https://ztmvoshrbqrgdhvyypvk.supabase.co
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-setup.sql`
4. Run the SQL script to create the `user_profiles` table with proper Row Level Security policies

## Environment Variables

The `.env` file has been configured with your Supabase credentials:
- `VITE_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `VITE_PUBLIC_SUPABASE_ANON_KEY`: Your public anon key

## Authentication Flow

### 1. **Sign Up / Sign In** (`/login`)
- Users can create a new account or sign in with existing credentials
- After successful authentication, users are redirected based on their profile status

### 2. **Onboarding** (`/onboarding`)
- New users must complete onboarding before accessing the dashboard
- Collects essential information in a step-by-step flow:
  1. **Region**: North, South, East, West, Central, or North-East India
  2. **State**: User's state/UT
  3. **Electricity Board**: Automatically filtered based on selected state
  4. **Service Number**: User's electricity service number

### 3. **Dashboard** (`/dashboard`)
- Only accessible after completing onboarding
- Displays user information and electricity board details
- Includes a sign-out option in the navigation menu

## Protected Routes

All routes are protected using the `ProtectedRoute` component:
- `/onboarding`: Requires authentication but NOT onboarding completion
- `/dashboard`: Requires authentication AND onboarding completion

## Database Schema

### `user_profiles` Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| region | TEXT | User's region (North, South, etc.) |
| state | TEXT | User's state/UT |
| electricity_board | TEXT | User's electricity board |
| service_number | TEXT | User's service number |
| onboarding_completed | BOOLEAN | Whether user completed onboarding |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Features

✅ **Secure Authentication**: Powered by Supabase Auth
✅ **Protected Routes**: Automatic redirection based on auth state
✅ **Multi-Step Onboarding**: Intuitive step-by-step user information collection
✅ **State-Based Electricity Boards**: Dynamic dropdown based on selected state
✅ **Profile Persistence**: User data stored securely in Supabase
✅ **Auto-Navigation**: Smart routing based on profile completion status
✅ **Sign Out**: Proper session cleanup and redirection

## Running the Application

```bash
# Install dependencies (if not already installed)
bun install

# Start the development server
bun run dev
```

## Testing

1. Create a new account at `/login`
2. Complete the onboarding flow
3. Access the dashboard
4. Sign out and sign back in to verify persistence

## Electricity Boards by State

The application includes a comprehensive mapping of all major electricity boards across India, organized by state/UT. This ensures users can accurately select their service provider during onboarding.

## Security

- Row Level Security (RLS) enabled on `user_profiles` table
- Users can only read/write their own profile data
- Environment variables for sensitive credentials
- Proper authentication checks on all protected routes
