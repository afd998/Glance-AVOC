import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Starting...');
        console.log('AuthCallback: Current URL:', window.location.href);
        console.log('AuthCallback: URL search params:', window.location.search);
        console.log('AuthCallback: URL hash:', window.location.hash);
        
        // Check for error in URL hash first
        const hash = window.location.hash;
        if (hash.includes('error=')) {
          const urlParams = new URLSearchParams(hash.substring(1));
          const error = urlParams.get('error');
          const errorDescription = urlParams.get('error_description');
          console.log('AuthCallback: Error in URL:', { error, errorDescription });
          setError(errorDescription || error || 'Authentication failed');
          return;
        }

        console.log('AuthCallback: Checking for session...');
        
        // For implicit flow magic links, the session should be automatically created
        // Just check if we have a session after the redirect
        const { data, error } = await supabase.auth.getSession();
        
        console.log('AuthCallback: Session check result:', { 
          hasSession: !!data.session, 
          sessionUser: data.session?.user?.email,
          error 
        });
        
        if (error) {
          console.error('AuthCallback: Session error:', error);
          setError(error.message || 'Authentication failed');
          return;
        }

        if (data.session) {
          console.log('AuthCallback: Session found, navigating to /');
          navigate('/');
        } else {
          console.log('AuthCallback: No session found');
          setError('Authentication failed. Please try again.');
        }
      } catch (err) {
        console.error('AuthCallback: Unexpected error:', err);
        setError('An unexpected error occurred.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full mx-4 p-8 rounded-2xl shadow-xl ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
            <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-2xl shadow-xl ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h1 className="text-2xl font-bold mb-4">Signing you in...</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Please wait while we complete your authentication.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback; 