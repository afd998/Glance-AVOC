import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

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
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Authenticated</h1>
          <p className="mb-4">Please sign in to access your account.</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Manage your account preferences and settings
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-white hover:bg-gray-100 text-gray-700'
            } shadow-sm`}
          >
            ← Back to Schedule
          </button>
        </div>

        {/* Profile Content */}
          <div className={`rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
              
              {/* User Info */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{user.email}</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Signed in with magic link
                    </p>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Preferences</h3>
                  
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
                    <div>
                      <p className="font-medium">Theme</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Choose your preferred appearance
                      </p>
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {isDarkMode ? '🌙 Dark' : '☀️ Light'}
                    </button>
                  </div>
                </div>

                {/* Sign Out Section */}
                <div className="border-t border-gray-300 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium mb-4">Account Actions</h3>
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                      isSigningOut
                        ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
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
                  </button>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default AccountPage; 