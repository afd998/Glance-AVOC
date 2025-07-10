import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useWhitelist } from '../hooks/useWhitelist';

const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const { signInWithOtp, verifyOtp } = useAuth();
  const { checkEmailWhitelisted, isChecking: isWhitelistChecking } = useWhitelist();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!email) {
      setMessage('Please enter your email address');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      // Check whitelist first
      const whitelistResult = await checkEmailWhitelisted(email);
      
      if (!whitelistResult.isWhitelisted) {
        setMessage(whitelistResult.error || 'Email not authorized');
        setMessageType('error');
        setIsLoading(false);
        return;
      }

      // Send OTP if whitelist check passes
      const { error } = await signInWithOtp(email);
      
      if (error) {
        setMessage(error.message);
        setMessageType('error');
      } else {
        setMessage('Check your email for the verification code!');
        setMessageType('success');
        setOtpSent(true);
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!otpCode || otpCode.length !== 6) {
      setMessage('Please enter the 6-digit verification code');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      const { error, session } = await verifyOtp(email, otpCode);
      
      if (error) {
        setMessage(error.message);
        setMessageType('error');
      } else if (session) {
        setMessage('Verification successful! Redirecting...');
        setMessageType('success');
        // The AuthContext will handle the redirect automatically
        // But we can also navigate manually if needed
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setMessage('Verification failed. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (otpSent) {
      await handleVerifyOtp(e);
    } else {
      await handleSendOtp(e);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const { error } = await signInWithOtp(email);
      
      if (error) {
        setMessage(error.message);
        setMessageType('error');
      } else {
        setMessage('New verification code sent!');
        setMessageType('success');
        setOtpCode('');
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setOtpSent(false);
    setOtpCode('');
    setMessage('');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 text-white hover:bg-gray-600' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          } shadow-lg`}
        >
          {isDarkMode ? '🌞' : '🌙'}
        </button>
      </div>

      <div className="max-w-md w-full mx-4">
        <div className={`p-8 rounded-2xl shadow-xl ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">G</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Glance</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Northwestern University Room Scheduler
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!otpSent ? (
              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Northwestern Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@northwestern.edu"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  disabled={isLoading || isWhitelistChecking}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="otp" className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Verification Code
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  disabled={isLoading}
                  maxLength={6}
                />
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter the 6-digit code sent to {email}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isWhitelistChecking}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isLoading || isWhitelistChecking
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isLoading || isWhitelistChecking ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isWhitelistChecking ? 'Checking authorization...' : otpSent ? 'Verifying...' : 'Sending code...'}
                </div>
              ) : (
                otpSent ? 'Verify Code' : 'Send Verification Code'
              )}
            </button>

            {otpSent && (
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  ← Back to email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  Resend code
                </button>
              </div>
            )}
          </form>

          {/* Message */}
          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              messageType === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Only authorized Northwestern email addresses can access this system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 