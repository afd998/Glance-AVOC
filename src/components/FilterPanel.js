import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const FilterPanel = ({ 
  rooms, 
  selectedRooms, 
  setSelectedRooms,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRoomsExpanded, setIsRoomsExpanded] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  console.log('FilterPanel rendered, isOpen:', isOpen); // Debug log

  return (
    <>
      {/* Filter Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 right-4 flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors z-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filters</span>
        </button>
      )}

      {/* Filter Panel */}
      {isOpen && (
        <div style={{zIndex:60}} className="fixed top-0 right-0 h-screen w-80 bg-gray-100 dark:bg-gray-800 shadow-lg z-50">
          <div className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Filters</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Room Selection */}
            <div className={`flex-1 overflow-y-auto bg-gray-200 dark:bg-gray-700 rounded-lg p-4 transition-all duration-200 ${isRoomsExpanded ? 'h-auto' : 'h-12'}`}>
              <button
                onClick={() => setIsRoomsExpanded(!isRoomsExpanded)}
                className="w-full flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <span>Select Rooms</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${isRoomsExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isRoomsExpanded && (
                <div className="space-y-2 mt-3">
                  {rooms.map((room) => (
                    <div key={room} className="flex items-center">
                      <input
                        type="checkbox"
                        id={room}
                        checked={selectedRooms.includes(room)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRooms([...selectedRooms, room]);
                          } else {
                            setSelectedRooms(selectedRooms.filter((r) => r !== room));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={room}
                        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {room}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterPanel; 