import React from 'react';
import { useProfile } from '../hooks/useProfile';
import { useFilters } from '../hooks/useFilters';
import useRoomStore from '../stores/roomStore';

interface NoEventsMessageProps {
  onClearFilter: () => void;
}

const NoEventsMessage: React.FC<NoEventsMessageProps> = ({ onClearFilter }) => {
  const { currentFilter } = useProfile();

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto">
        <div className="bg-white/20 dark:bg-gray-900/30 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl border border-white/30 dark:border-gray-600/40 max-w-md w-full mx-4 relative overflow-hidden">
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 dark:to-transparent rounded-2xl"></div>

          {/* Content */}
          <div className="relative z-10">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
              No Events Found
            </h3>
            <p className="text-gray-700 dark:text-gray-200 mb-8 text-center leading-relaxed">
              No events match the filter <span className="font-semibold text-gray-900 dark:text-white">{currentFilter || 'All Rooms'}</span> for this day.
            </p>
            <div className="flex justify-center">
              <button
                onClick={onClearFilter}
                className="px-8 py-3 bg-gradient-to-r from-purple-600/60 to-purple-700/60 hover:from-purple-500/70 hover:to-purple-600/70 text-white font-medium rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 border border-white/30 backdrop-blur-sm hover:backdrop-blur-md"
              >
                Clear Filter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoEventsMessage;
