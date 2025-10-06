import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const UserProfileButton: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <button
      onClick={() => navigate('/account')}
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
        isDarkMode
          ? 'bg-gray-800 hover:bg-gray-700 text-white'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
      }`}
      style={{ cursor: 'pointer' }}
    >
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
        {user.email?.charAt(0).toUpperCase() || 'U'}
      </div>
      <div className="flex flex-col items-start min-w-0 flex-1">
        <span className="text-sm font-medium truncate w-full">{user.email}</span>
        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Account Settings</span>
      </div>
    </button>
  );
};

export default UserProfileButton;


