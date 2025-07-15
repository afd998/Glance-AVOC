import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const AboutPage: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            About Glance AVOC
          </h1>
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Glance AVOC (Audio Visual Operations Center) is a comprehensive scheduling and management system 
              for the Kellogg School of Management's AV equipment and room bookings. This web application 
              provides real-time access to room schedules, faculty information, and AV setup requirements.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Features
            </h2>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
              <li>Real-time room scheduling and availability</li>
              <li>Faculty profile management with setup preferences</li>
              <li>AV equipment tracking and configuration</li>
              <li>Push notifications for upcoming events</li>
              <li>Dark mode support for better viewing experience</li>
              <li>Mobile-responsive design for all devices</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Install on iPhone
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You can install Glance AVOC on your iPhone to access it like a native app. Here's how:
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                How iPhone Users Can Install:
              </h3>
              <ol className="list-decimal list-inside text-blue-800 dark:text-blue-200 space-y-3">
                <li>
                  <strong>Open Safari</strong> on iPhone
                </li>
                <li>
                  <strong>Navigate</strong> to your webapp
                </li>
                <li>
                  <strong>Tap the Share button</strong> (square with arrow)
                </li>
                <li>
                  <strong>Select "Add to Home Screen"</strong>
                </li>
                <li>
                  <strong>Customize the name</strong> (optional)
                </li>
                <li>
                  <strong>Tap "Add"</strong>
                </li>
              </ol>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                💡 Pro Tip
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200">
                Once installed, Glance AVOC will appear on your home screen like a native app. 
                It will open in full-screen mode without Safari's interface, providing a seamless 
                experience for managing your AV operations.
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              System Requirements
            </h2>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
              <li>Modern web browser (Chrome, Safari, Firefox, Edge)</li>
              <li>iOS 12.0 or later for iPhone installation</li>
              <li>Internet connection for real-time data</li>
              <li>Northwestern email address for authentication</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Support
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              For technical support or questions about Glance AVOC, please contact the 
              Kellogg School of Management IT department or your AV operations team.
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                © 2024 Kellogg School of Management, Northwestern University. 
                All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 