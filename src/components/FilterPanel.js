import React from 'react';
import DatePicker from "react-datepicker";
import { useTheme } from '../contexts/ThemeContext';

function FilterPanel({ 
  selectedDate, 
  setSelectedDate, 
  rooms,
  selectedRooms,
  setSelectedRooms
}) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className="flex items-start space-x-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border dark:border-gray-700">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          className="block w-40 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300"
          dateFormat="MMM d, yyyy"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter Rooms</label>
        <div className="max-h-32 overflow-y-auto border dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700">
          <div className="grid grid-cols-2 gap-x-4">
            {rooms.map((room) => (
              <label key={room} className="flex items-center space-x-2 py-0.5 hover:bg-gray-50 dark:hover:bg-gray-600 px-2 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRooms.includes(room)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRooms([...selectedRooms, room]);
                    } else {
                      setSelectedRooms(selectedRooms.filter(r => r !== room));
                    }
                  }}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{room}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? '🌞' : '🌙'}
        </button>
        <button
          className="p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

export default FilterPanel; 