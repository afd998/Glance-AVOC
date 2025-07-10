# Email Whitelist System Setup

This document explains how to set up and use the email whitelist system for the Glance application.

## 🎯 Overview

The whitelist system ensures that only authorized Northwestern email addresses can create accounts and access the system. This is implemented using Supabase Row Level Security (RLS) for maximum security.

## 📋 Setup Instructions

### 1. Database Setup

Run the SQL script in `WHITELIST_SETUP.sql` in your Supabase SQL editor:

```sql
-- Create whitelist table
CREATE TABLE IF NOT EXISTS public.email_whitelist (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    domain TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Insert example Northwestern emails
INSERT INTO public.email_whitelist (email, domain, role, created_by) VALUES
('admin@northwestern.edu', 'northwestern.edu', 'admin', 'system'),
('faculty@northwestern.edu', 'northwestern.edu', 'faculty', 'system'),
('student@northwestern.edu', 'northwestern.edu', 'student', 'system');

-- Enable RLS and create policies
ALTER TABLE public.email_whitelist ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Allow authenticated users to read whitelist" ON public.email_whitelist
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage whitelist" ON public.email_whitelist
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.email_whitelist 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin'
        )
    );

-- Create helper function
CREATE OR REPLACE FUNCTION public.is_email_whitelisted(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.email_whitelist 
        WHERE email = email_to_check 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_email_whitelisted(TEXT) TO authenticated;
```

### 2. Frontend Integration

The whitelist system is already integrated into the frontend with:

- **`useWhitelist` hook**: Checks if emails are authorized
- **`WhitelistManager` component**: Admin interface for managing the whitelist
- **Updated `LandingPage`**: Checks whitelist before sending magic links
- **Updated `FilterPanel`**: Includes whitelist management tab

## 🔧 How It Works

### Authentication Flow

1. **User enters email** on the landing page
2. **System checks domain**: Only `@northwestern.edu` emails are allowed
3. **System checks whitelist**: Verifies the specific email is in the whitelist
4. **If authorized**: Magic link is sent
5. **If not authorized**: Error message is shown

### Admin Management

Admins can manage the whitelist through the "Whitelist" tab in the filter panel:

- **Add new emails** with specific roles (user, faculty, admin)
- **Activate/deactivate** existing entries
- **Delete entries** from the whitelist
- **View all entries** with their status and roles

## 🛡️ Security Features

### Database Level Security
- **Row Level Security (RLS)**: Controls access to the whitelist table
- **Role-based policies**: Only admins can modify the whitelist
- **Domain restriction**: Only Northwestern emails are allowed

### Frontend Security
- **Pre-authentication checks**: Emails are verified before magic links are sent
- **Role-based UI**: Admin features only visible to admin users
- **Input validation**: Email format and domain validation

## 📝 Usage Examples

### Adding a New User

1. **Admin logs in** with an admin account
2. **Opens the filter panel** (hamburger menu)
3. **Clicks "Whitelist" tab**
4. **Enters email**: `newuser@northwestern.edu`
5. **Selects role**: `user`
6. **Clicks "Add"**

### Managing Existing Users

- **Activate/Deactivate**: Toggle user access without deleting
- **Change Roles**: Update user permissions
- **Delete**: Remove users from the system

## 🔍 Troubleshooting

### Common Issues

1. **"Email not authorized" error**
   - Check if the email is in the whitelist
   - Verify the email domain is `@northwestern.edu`
   - Ensure the entry is marked as `is_active = true`

2. **Admin can't access whitelist management**
   - Verify the admin email has `role = 'admin'` in the whitelist
   - Check RLS policies are properly configured

3. **Magic link not working**
   - Ensure Supabase redirect URLs are configured
   - Check email domain restrictions in Supabase settings

### Debug Steps

1. **Check whitelist table**: Verify email exists and is active
2. **Check RLS policies**: Ensure policies allow proper access
3. **Check Supabase logs**: Look for authentication errors
4. **Test with known good email**: Use an email that's definitely in the whitelist

## 🚀 Best Practices

### Security
- **Regular audits**: Review whitelist entries periodically
- **Role management**: Use appropriate roles for different user types
- **Domain restrictions**: Keep domain restrictions in place

### Management
- **Documentation**: Keep track of who has access and why
- **Regular cleanup**: Remove inactive users
- **Backup**: Export whitelist data regularly

### User Experience
- **Clear error messages**: Help users understand why access is denied
- **Quick onboarding**: Make it easy for admins to add new users
- **Role clarity**: Make it clear what different roles can do

## 📊 Database Schema

```sql
email_whitelist table:
- id: Serial primary key
- email: Unique email address
- domain: Email domain (auto-extracted)
- role: User role (user, faculty, admin)
- created_at: Timestamp when added
- created_by: Who added the entry
- is_active: Whether the entry is active
```

## 🔄 Future Enhancements

Potential improvements to consider:

1. **Bulk import**: Add multiple emails at once
2. **Domain-wide whitelist**: Allow entire domains
3. **Temporary access**: Time-limited whitelist entries
4. **Audit logging**: Track who added/removed entries
5. **Email notifications**: Notify when access is granted/revoked 



fernando.giles@kellogg.northwestern.edu,
atticus.deutsch@kellogg.northwestern.edu,
a-cruz3@kellogg.northwestern.edu,
lale.saparova@kellogg.northwestern.edu