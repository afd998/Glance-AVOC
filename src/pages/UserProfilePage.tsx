import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';

const AccountPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>Please sign in to access your account.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/auth')}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your account preferences and settings
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Back to Schedule
          </Button>
        </div>

        {/* Profile Content */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            {/* User Info */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16" size="lg" >
                  <AvatarFallback className="text-xl font-bold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{user.email}</h3>
                  <p className="text-sm text-muted-foreground">
                    Signed in with magic link
                  </p>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Preferences</h3>
                
                {/* Theme Toggle */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Theme</p>
                        <p className="text-sm text-muted-foreground">
                          Choose your preferred appearance
                        </p>
                      </div>
                      <Button variant="outline" onClick={toggleDarkMode}>
                        {isDarkMode ? '🌙 Dark' : '☀️ Light'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sign Out Section */}
              <Separator />
              <div className="pt-6">
                <h3 className="text-lg font-medium mb-4">Account Actions</h3>
                <Button
                  variant="destructive"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full"
                >
                  {isSigningOut ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing out...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Account Page Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <div className="flex items-center space-x-4">
            <div className="text-sm bg-background/80 backdrop-blur-sm border rounded-full px-3 py-1">
              Timezone: Chicago Standard Time
            </div>
            <Button variant="ghost" size="sm" asChild className="bg-background/80 backdrop-blur-sm border rounded-full">
              <Link to="/about" className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>About</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="bg-background/80 backdrop-blur-sm border rounded-full">
              <a
                href="https://forms.office.com/Pages/ResponsePage.aspx?id=YdN2fXeCCEekd2ToNmzRvLxLY25yMfNIg7aQOhsW0dRUOEVQRFBaQkxCTE0zWEFGQzA5MVJHRUZPUC4u"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Report a Bug</span>
              </a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AccountPage; 