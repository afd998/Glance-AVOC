# Authentication Setup

This app uses Supabase authentication with magic links (no passwords required).

## Features

- **Magic Link Authentication**: Users sign in by entering their email and receiving a secure link
- **No Passwords**: Eliminates password management and security concerns
- **Protected Routes**: All app routes require authentication
- **User Profile**: Shows user email and sign out functionality
- **Dark Mode Support**: Authentication pages support dark/light theme

## File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Authentication context and hooks
├── components/
│   ├── ProtectedRoute.tsx       # Route protection component
│   └── UserProfile.tsx          # User profile dropdown
├── pages/
│   ├── LandingPage.tsx          # Login/signup page
│   └── AuthCallback.tsx         # Magic link callback handler
└── App.tsx                      # Updated with auth routes
```

## Configuration

### 1. Supabase Setup

Make sure your Supabase project has the following environment variables:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Authentication Settings

In your Supabase dashboard:

1. Go to **Authentication** > **Settings**
2. Enable **Email Auth**
3. Configure **Site URL** to your app's domain
4. Set **Redirect URLs** to include:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

### 3. Email Templates

Customize the magic link email template in Supabase:
- Go to **Authentication** > **Email Templates**
- Edit the **Magic Link** template
- Include your app branding and clear instructions

## Usage

### For Users

1. Navigate to `/auth` (or any protected route will redirect there)
2. Enter your Northwestern email address
3. Check your email for the magic link
4. Click the link to sign in
5. You'll be redirected to the main app

### For Developers

The authentication system is automatically integrated:

- **AuthProvider**: Wraps the entire app and manages auth state
- **ProtectedRoute**: Protects all app routes
- **useAuth hook**: Access auth state and methods in components
- **UserProfile**: Shows user info and sign out option

## Security Features

- **Session Management**: Automatic session handling with Supabase
- **Route Protection**: All app routes require authentication
- **Magic Links**: Time-limited, single-use authentication links
- **Email Verification**: Only verified email addresses can sign in

## Customization

### Styling

The authentication pages use Tailwind CSS and support dark mode. You can customize:

- Colors and branding in `LandingPage.tsx`
- Layout and styling in `AuthCallback.tsx`
- User profile appearance in `UserProfile.tsx`

### Email Domain Restriction

To restrict sign-ups to Northwestern emails only, modify the `signInWithMagicLink` function in `AuthContext.tsx`:

```typescript
const signInWithMagicLink = async (email: string) => {
  // Check if email is from Northwestern
  if (!email.endsWith('@northwestern.edu')) {
    return { error: { message: 'Only Northwestern email addresses are allowed' } };
  }
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { error };
};
```

## Troubleshooting

### Common Issues

1. **Magic link not working**: Check Supabase redirect URL settings
2. **Email not received**: Check spam folder and Supabase email settings
3. **Authentication errors**: Verify environment variables are set correctly

### Development

- Use `http://localhost:3000` for local development
- Test with real email addresses (magic links won't work with fake emails)
- Check browser console for authentication errors 