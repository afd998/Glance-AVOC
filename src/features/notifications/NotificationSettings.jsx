import React from 'react';
import { useNotifications } from './useNotifications';

export default function NotificationSettings() {
  const { 
    isSupported, 
    permission, 
    requestPermission, 
    scheduleNotificationsForEvents 
  } = useNotifications();

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      // You could show a success message here
      
    } else {
      // You could show an error message here
      
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <div className="flex items-center">
          <div className="shrink-0">
            <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-2">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Notifications not supported in this browser
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="shrink-0">
            {permission === 'granted' ? (
              <svg className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : permission === 'denied' ? (
              <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {permission === 'granted' 
                ? 'Notifications enabled'
                : permission === 'denied'
                ? 'Notifications blocked'
                : 'Enable notifications'
              }
            </p>
          </div>
        </div>
        
        {permission === 'default' && (
          <button
            onClick={handleEnableNotifications}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Enable
          </button>
        )}
        
        {permission === 'denied' && (
          <div className="text-xs text-red-600 dark:text-red-400">
            Blocked
          </div>
        )}
        
        {permission === 'granted' && (
          <div className="text-xs text-green-600 dark:text-green-400">
            Enabled
          </div>
        )}
      </div>
      
      {permission === 'granted' && (
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <svg className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          10 minutes before events with staff assistance
        </div>
      )}
    </div>
  );
} 