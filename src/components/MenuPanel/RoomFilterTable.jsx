import React, { useState } from 'react';
import useRoomStore from '../../stores/roomStore';
import { useFilters } from '../../hooks/useFilters';
import { useProfile } from '../../hooks/useProfile';

const RoomFilterTable = ({ autoHideEnabled = false }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  
  const { 
    allRooms,
    selectedRooms,
    toggleRoom,
    getSelectedRoomsCount,
    getTotalRoomsCount
  } = useRoomStore();

  const { saveFilter, isSavingFilter } = useFilters();
  const { currentFilter } = useProfile();
  
  // Disable checkboxes when a filter is active or auto-hide is enabled
  const isDisabled = autoHideEnabled || !!currentFilter;

  const handleDisplayToggle = async (room) => {
    setLoadingStates(prev => ({ ...prev, [`display-${room}`]: true }));
    
    
    try {
      await toggleRoom(room);
    } finally {
      // Small delay to show loading state
      setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, [`display-${room}`]: false }));
      }, 150);
    }
  };



  const handleSaveFilter = async () => {
    if (!presetName.trim()) return;
    
    console.log('Saving filter:', {
      name: presetName.trim(),
      selectedRooms
    });
    
    try {
      await saveFilter(presetName.trim(), selectedRooms);
      console.log('Filter saved successfully');
      setPresetName('');
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Failed to save filter:', error);
      alert('Failed to save filter: ' + error.message);
    }
  };

  return (
    <div className="bg-white/30 dark:bg-gray-800/30 rounded-xl p-4 shadow-lg border border-white/30 dark:border-white/10 backdrop-blur-sm">
      <div className="mb-3 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filter Events by Room</h3>
        {!isDisabled && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-xl text-blue-700 dark:text-blue-300 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 hover:border-blue-400/50 backdrop-blur-sm transition-all duration-200 hover:scale-105"
          >
            💾 Save
          </button>
        )}
      </div>
      

      

      
      {/* Summary Stats - Always visible */}
      <div className="flex justify-center text-sm text-gray-600 dark:text-gray-400 mb-4">
        <span>Include Rooms: {getSelectedRoomsCount()}/{getTotalRoomsCount()}</span>
      </div>

      {/* Scrollable Room List */}
      <div className="h-80 overflow-y-auto space-y-1">
        {allRooms.map((room) => {
          const isSelected = selectedRooms.includes(room);
          const isLoading = loadingStates[`display-${room}`];
          
          return (
            <div
              key={room}
              onClick={() => !isDisabled && !isLoading && handleDisplayToggle(room)}
              className={`relative flex items-center justify-between p-3 rounded-xl border backdrop-blur-sm transition-all duration-200 ${
                isSelected
                  ? 'border-blue-400/50 bg-blue-500/20 text-blue-900 dark:text-blue-100 shadow-lg shadow-blue-500/20 scale-[1.02]'
                  : 'border-white/20 dark:border-white/10 bg-white/20 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300'
              } ${
                isDisabled
                  ? 'cursor-default opacity-75'
                  : 'cursor-pointer hover:border-blue-400/30 hover:bg-blue-500/10 hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center flex-1">
                {/* Selection indicator */}
                <div className={`w-3 h-3 rounded-full mr-3 transition-colors ${
                  isSelected 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`} />
                
                <span className="font-medium">{room}</span>
              </div>
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="ml-2">
                  <div className="w-4 h-4 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Check mark for selected items */}
              {isSelected && !isLoading && (
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="max-w-md w-full mx-4 p-6 rounded-2xl shadow-2xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 text-gray-900 dark:text-white">
            <h3 className="text-lg font-medium mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Save Filter</h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name..."
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/30 dark:bg-gray-700/30 border-white/30 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-200"
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 bg-white/20 dark:bg-gray-700/20 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/30 dark:hover:bg-gray-600/30 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFilter}
                disabled={!presetName.trim() || isSavingFilter}
                className={`px-4 py-2 text-sm font-medium rounded-xl backdrop-blur-sm border transition-all duration-200 ${
                  !presetName.trim() || isSavingFilter
                    ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed border-gray-400/20'
                    : 'bg-blue-500/30 text-white hover:bg-blue-500/50 border-blue-400/30 hover:border-blue-400/50 hover:scale-105'
                }`}
              >
                {isSavingFilter ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomFilterTable; 