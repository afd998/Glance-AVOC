import React, { useState } from 'react';
import useRoomStore from '../../stores/roomStore';

const RoomFilterTable = ({ autoHideEnabled = false }) => {
  const [loadingStates, setLoadingStates] = useState({});
  
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

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Room Filters</h3>
      </div>
      
      {/* Summary Stats - Always visible */}
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
        <span>Display: {getSelectedRoomsCount()}/{getTotalRoomsCount()}</span>
        <span>Notifications: {getNotificationRoomsCount()}/{getTotalRoomsCount()}</span>
      </div>

      {/* Scrollable Content */}
      <div className="h-64 overflow-y-auto">
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
                    className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
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
    </div>
  );
};

export default RoomFilterTable; 