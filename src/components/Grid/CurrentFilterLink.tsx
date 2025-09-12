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
  const displayText = currentFilter || (autoHide ? "Empty Rooms Hidden" : "All Rooms");

  return (
    <button
      onClick={openFilterRoomsModal}
      className="h-8 px-2 py-1 text-xs font-medium rounded-xl backdrop-blur-sm border transition-all duration-200 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] transform hover:scale-105 border-gray-300/50 dark:border-gray-600/50 bg-gray-100/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/80 dark:hover:bg-gray-600/80"
      title="Current Filter"
    >
      <div className="flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
        </svg>
        <span className="text-xs font-medium">{displayText}</span>
      </div>
    </button>
  );
};

export default CurrentFilterLink; 