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
      className={`ml-4 p-2 rounded-lg border transition-colors ${
        isDarkMode 
          ? 'bg-blue-900/20 border-blue-300/30 text-blue-200 hover:bg-blue-800/30' 
          : 'bg-blue-50/50 border-blue-200/50 text-blue-700 hover:bg-blue-100/70'
      }`}
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