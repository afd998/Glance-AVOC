import React from 'react';
import { useProfile } from '../../../core/User/useProfile';
import useModalStore from '../../../stores/modalStore';
import { useTheme } from '../../../contexts/ThemeContext';

interface CurrentFilterLinkProps {
  onModalOpen?: () => void;
}

const CurrentFilterLink: React.FC<CurrentFilterLinkProps> = ({ onModalOpen }) => {
  const { profile } = useProfile();
  const { openFilterRoomsModal } = useModalStore();
  const { isDarkMode } = useTheme();

  const currentFilter = profile?.current_filter;
  const autoHide = profile?.auto_hide;

  // Determine what text to display
  const displayText = currentFilter || (autoHide ? "Empty Rooms Hidden" : "All Rooms");

  return (
    <div className="group relative inline-block">
      <button
        onClick={() => {
          onModalOpen?.();
          openFilterRoomsModal();
        }}
        className={`text-xs px-3 py-1.5 rounded-full backdrop-blur-md border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer relative overflow-hidden ${
          isDarkMode
            ? 'bg-white/10 border-white/20 text-gray-200 hover:bg-white/15'
            : 'bg-white/30 border-white/40 text-gray-800 hover:bg-white/40'
        }`}
        title="Current Filter"
      >
        {/* Glassmorphic shine effect */}
        <div className="absolute inset-0 bg-linear-to-r from-white/20 via-white/5 to-transparent rounded-full"></div>
        <div className="relative z-10 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          <span className="font-medium opacity-75 whitespace-nowrap">
            {displayText}
          </span>
        </div>
      </button>
    </div>
  );
};

export default CurrentFilterLink; 