import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';  
const ThemeExample: React.FC = () => {
  const { currentTheme, isDarkMode } = useTheme();

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Current Theme Info</h2>
      
      <div className="space-y-2">
        <div>
          <strong>Theme Name:</strong> {currentTheme.name}
        </div>
        <div>
          <strong>Background:</strong> {currentTheme.background}
        </div>
        <div>
          <strong>Mode:</strong> {isDarkMode ? 'Dark' : 'Light'}
        </div>
        <div>
          <strong>Is Dark Theme:</strong> {currentTheme.isDark ? 'Yes' : 'No'}
        </div>
      </div>

      {/* Example of using theme-aware styling */}
      <div className={`mt-4 p-4 rounded-lg border ${
        isDarkMode 
          ? 'bg-gray-800 text-white border-gray-600' 
          : 'bg-white text-gray-900 border-gray-200'
      }`}>
        <p>This component automatically adapts to the current theme!</p>
        <p className="text-sm mt-2">
          When you change backgrounds, this will automatically switch between light and dark modes.
        </p>
      </div>
    </div>
  );
};

export default ThemeExample;
