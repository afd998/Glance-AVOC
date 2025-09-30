import React from 'react';
import { useProfile } from '../../../core/User/useProfile';
import useModalStore from '../../../stores/modalStore';

interface CurrentFilterLinkVerticalProps {
  onModalOpen?: () => void;
}

const CurrentFilterLinkVertical: React.FC<CurrentFilterLinkVerticalProps> = ({ onModalOpen }) => {
  const { profile } = useProfile();
  const { openFilterRoomsModal } = useModalStore();

  const currentFilter = profile?.current_filter;
  const autoHide = profile?.auto_hide;

  // Determine what text to display
  const displayText = currentFilter || (autoHide ? "Empty Rooms Hidden" : "All Rooms");

  return (
    <button
      onClick={() => {
        console.log('Filter button clicked!');
        onModalOpen?.();
        openFilterRoomsModal();
      }}
      className="h-10 w-10 p-2 rounded-lg transition-all duration-200 flex flex-col items-center justify-center bg-gray-100/40 dark:bg-gray-700/40 backdrop-blur-sm border border-gray-300/30 dark:border-gray-600/30 shadow-lg hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] hover:bg-gray-200/50 dark:hover:bg-gray-600/50 hover:scale-105 active:scale-95 relative z-10 cursor-pointer"
      title="Current Filter"
    >
      <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
      </svg>
      <span className="text-xs text-gray-700 dark:text-gray-300 text-center leading-tight">
        Filter
      </span>
    </button>
  );
};

export default CurrentFilterLinkVertical;
