import React, { useState } from 'react';
import useRoomStore from '../../stores/roomStore';
import { useFilters } from '../../hooks/useFilters';

const RoomFilterTable = ({ autoHideEnabled = false }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  
  const { 
    allRooms,
    selectedRooms,
    notificationRooms,
    toggleRoom,
    toggleNotificationRoom,
    getSelectedRoomsCount,
    getTotalRoomsCount,
    getNotificationRoomsCount
  } = useRoomStore();

  const { saveFilter, isSavingFilter } = useFilters();

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

  const handleNotificationToggle = async (room) => {
    setLoadingStates(prev => ({ ...prev, [`notification-${room}`]: true }));
    
    
    try {
      await toggleNotificationRoom(room);
    } finally {
      // Small delay to show loading state
      setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, [`notification-${room}`]: false }));
      }, 150);
    }
  };

  const handleSaveFilter = async () => {
    if (!presetName.trim()) return;
    
    try {
      await saveFilter(presetName.trim(), selectedRooms, notificationRooms);
      setPresetName('');
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Failed to save filter:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
      <div className="mb-3 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Rooms</h3>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center px-3 py-1 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          💾 Save current selection as filter
        </button>
      </div>
      
      {/* Summary Stats - Always visible */}
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
        <span>Display: {getSelectedRoomsCount()}/{getTotalRoomsCount()}</span>
        <span>Notifications: {getNotificationRoomsCount()}/{getTotalRoomsCount()}</span>
      </div>

      {/* Scrollable Content */}
      <div className="h-80 overflow-y-auto">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Room</th>
                <th className="text-center py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Display</th>
                <th className="text-center py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Notifications</th>
              </tr>
            </thead>
            <tbody>
              {allRooms.map((room) => {
                const isDisplayLoading = loadingStates[`display-${room}`];
                const isNotificationLoading = loadingStates[`notification-${room}`];
                
                return (
                  <tr 
                    key={room} 
                    className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 bg-white dark:bg-gray-800"
                  >
                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                      {room}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="relative">
                        <input
                          type="checkbox"
                          id={`display-${room}`}
                          checked={selectedRooms.includes(room)}
                          onChange={() => handleDisplayToggle(room)}
                          disabled={isDisplayLoading || autoHideEnabled}
                          className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-opacity ${
                            isDisplayLoading || autoHideEnabled ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        />
                        {isDisplayLoading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="relative">
                        <input
                          type="checkbox"
                          id={`notification-${room}`}
                          checked={notificationRooms.includes(room)}
                          onChange={() => handleNotificationToggle(room)}
                          disabled={isNotificationLoading}
                          className={`h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded transition-opacity ${
                            isNotificationLoading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        />
                        {isNotificationLoading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 border border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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