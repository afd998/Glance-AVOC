import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-800 py-2 px-4 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          © 2025 Scion Informatics
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">Timezone: Chicago Standard Time</span>
          <Link
            to="/about"
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>About</span>
          </Link>
          <a
            href="https://forms.office.com/Pages/ResponsePage.aspx?id=YdN2fXeCCEekd2ToNmzRvLxLY25yMfNIg7aQOhsW0dRUOEVQRFBaQkxCTE0zWEFGQzA5MVJHRUZPUC4u"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Report a Bug</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
