# Authentication Troubleshooting Guide

## 🔍 Quick Debug Steps

1. **Check the debug panel** - Look for the black debug panel in the bottom-right corner (development only)
2. **Check browser console** - Look for authentication-related errors
3. **Check Supabase dashboard** - Verify your project settings

## 🚨 Common Issues & Solutions

### 1. Environment Variables Missing

**Symptoms:**
- Console shows "Missing" for Supabase URL or Key
- Authentication completely fails

**Solution:**
Create a `.env` file in your `frontend` directory:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to get these values:**
1. Go to your Supabase dashboard
2. Click on your project
3. Go to Settings > API
4. Copy the URL and anon key

### 2. Redirect URL Mismatch

**Symptoms:**
- Magic link works but callback fails
- "Authentication failed" error

**Solution:**
In your Supabase dashboard:
1. Go to Authentication > Settings
2. Set **Site URL** to: `http://localhost:3000` (development)
3. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/callback/`

### 3. Email Templates Not Configured

**Symptoms:**
- Magic link email not received
- Email goes to spam

**Solution:**
1. Go to Authentication > Email Templates
2. Edit the "Magic Link" template
3. Make sure the template includes the magic link properly

### 4. CORS Issues

**Symptoms:**
- Network errors in console
- Authentication requests fail

**Solution:**
1. Go to Authentication > Settings
2. Add your domain to **Additional Redirect URLs**
3. For development: `http://localhost:3000`

### 5. Session Storage Issues

**Symptoms:**
- Authentication works but session doesn't persist
- User gets logged out immediately

**Solution:**
The app is configured to persist sessions. If issues persist:
1. Clear browser storage
2. Check if browser blocks cookies
3. Try incognito mode

## 🛠️ Manual Testing Steps

### Step 1: Check Environment Variables
```javascript
// In browser console
console.log('SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY);
```

### Step 2: Test Supabase Connection
```javascript
// In browser console
import { supabase } from './lib/supabase';
supabase.auth.getSession().then(console.log);
```

### Step 3: Test Magic Link
1. Go to `/auth`
2. Enter your email
3. Check email for magic link
4. Click the link
5. Check URL parameters in browser

## 🔧 Advanced Debugging

### Check URL Parameters
When you click a magic link, the URL should look like:
```
http://localhost:3000/auth/callback?access_token=...&refresh_token=...&type=recovery
```

### Check Browser Console
Look for these log messages:
- `🔐 Attempting magic link sign in for:`
- `📍 Redirect URL:`
- `✅ Magic link sent successfully`
- `❌ Magic link error:`

### Check Network Tab
1. Open browser dev tools
2. Go to Network tab
3. Try authentication
4. Look for failed requests to Supabase

## 📧 Email Issues

### Email Not Received
1. Check spam folder
2. Verify email address is correct
3. Check Supabase email settings
4. Try a different email address

### Email Template Issues
1. Go to Supabase dashboard
2. Authentication > Email Templates
3. Edit "Magic Link" template
4. Make sure it includes: `{{ .ConfirmationURL }}`

## 🔐 Supabase Dashboard Checklist

- [ ] **Authentication enabled** (Settings > Auth)
- [ ] **Email auth enabled** (Settings > Auth > Providers)
- [ ] **Site URL set** (Settings > Auth > URL Configuration)
- [ ] **Redirect URLs configured** (Settings > Auth > URL Configuration)
- [ ] **Email templates configured** (Settings > Auth > Email Templates)

## 🚀 Production Deployment

For production, update these settings:

1. **Environment Variables:**
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Supabase Settings:**
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/auth/callback`

3. **Email Templates:**
   - Update with your domain
   - Test email delivery

## 📞 Still Having Issues?

1. **Check the debug panel** for specific error information
2. **Share console logs** with error details
3. **Check Supabase logs** in the dashboard
4. **Try with a different browser** to rule out browser issues

## 🔄 Reset Authentication

If all else fails:

1. Clear browser storage:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. Clear Supabase session:
   ```javascript
   supabase.auth.signOut();
   ```

3. Restart the development server:
   ```bash
   npm start
   ``` 