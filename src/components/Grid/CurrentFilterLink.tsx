import React from 'react';
import { useProfile } from '../../hooks/useProfile';
import useModalStore from '../../stores/modalStore';
import { useTheme } from '../../contexts/ThemeContext';

const CurrentFilterLink: React.FC = () => {
  const { profile } = useProfile();
  const { openFilterRoomsModal } = useModalStore();
  const { isDarkMode } = useTheme();

  const currentFilter = profile?.current_filter;
  const autoHide = profile?.auto_hide;

  // Don't show anything if no filter is set and auto-hide is off
  if (!currentFilter && !autoHide) {
    return null;
  }

  // Determine what text to display
  const displayText = currentFilter || (autoHide ? "Empty Rooms Hidden" : "");

  return (
    <button
      onClick={openFilterRoomsModal}
      className="ml-4 p-2 rounded-xl backdrop-blur-sm border transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/20"
    >
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">{displayText}</span>
      </div>
    </button>
  );
};

export default CurrentFilterLink; 