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
      className="px-2 py-1 transition-all duration-200 hover:scale-105 text-white hover:text-gray-200"
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