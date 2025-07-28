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
    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
      <div className="mb-3 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filter Events by Room</h3>
        {!isDisabled && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center px-3 py-1 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
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
              className={`relative flex items-center justify-between p-3 rounded-md border transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              } ${
                isDisabled
                  ? 'cursor-default'
                  : 'cursor-pointer hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10'
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-md w-full mx-4 p-6 rounded-lg shadow-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <h3 className="text-lg font-medium mb-4">Save Filter</h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFilter}
                disabled={!presetName.trim() || isSavingFilter}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  !presetName.trim() || isSavingFilter
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
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