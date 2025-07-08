import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import NotificationSettings from './NotificationSettings';
import NotificationTest from './NotificationTest';
import RoomFilterTable from './RoomFilterTable';
import useRoomStore from '../stores/roomStore';
import { parseRoomName } from '../utils/eventUtils';
import { useEvents } from '../hooks/useEvents';

const FilterPanel = ({ selectedDate = new Date() }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [autoHideEmpty, setAutoHideEmpty] = useState(() => {
    // Load auto-hide setting from localStorage on component mount
    const saved = localStorage.getItem('autoHideEmpty');
    return saved ? JSON.parse(saved) : false;
  });
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { selectedRooms, setSelectedRooms, allRooms } = useRoomStore();
  const { events } = useEvents(selectedDate);

  // Save auto-hide setting to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('autoHideEmpty', JSON.stringify(autoHideEmpty));
  }, [autoHideEmpty]);

  // Auto-hide empty rooms logic
  useEffect(() => {
    if (!autoHideEmpty || !events) return;

    // Get rooms that have events for the current day
    const roomsWithEvents = new Set();
    events.forEach(event => {
      const roomName = parseRoomName(event.subject_itemName);
      if (roomName) {
        roomsWithEvents.add(roomName);
      }
    });

    // When auto-hide is enabled, show only rooms with events
    if (autoHideEmpty) {
      const roomsToShow = allRooms.filter(room => roomsWithEvents.has(room));
      setSelectedRooms(roomsToShow);
    }
  }, [events, selectedDate, autoHideEmpty, allRooms, setSelectedRooms]);

  return (
    <>
      {/* Hamburger Menu Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 right-4 flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors z-50 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Menu</span>
        </button>
      )}

      {/* Menu Panel */}
      {isOpen && (
        <div style={{zIndex:60}} className="fixed top-0 right-0 h-screen w-80 bg-gray-100 dark:bg-gray-800 shadow-lg z-50">
          <div className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Room Filter Table */}
              <RoomFilterTable autoHideEnabled={autoHideEmpty} />

              {/* Notification Settings Section */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Notifications</h3>
                <NotificationSettings />
              </div>

              {/* Quick Actions Section */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                <div className="space-y-3">
                  {/* Auto-hide Empty Rooms */}
                  <div className="flex items-center justify-between px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600">
                    <span>Auto-hide Empty Rooms</span>
                    <input
                      type="checkbox"
                      checked={autoHideEmpty}
                      onChange={(e) => setAutoHideEmpty(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  {/* Theme Toggle */}
              <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                  >
                    <span>Theme</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {isDarkMode ? 'Dark' : 'Light'}
                    </span>
              </button>

                  {/* Notification Test */}
                  <NotificationTest />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-gray-300 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                <p>Event notifications appear 15 minutes before events with staff assistance or web conferencing.</p>
                <p className="mt-1">Only events in selected notification rooms will trigger alerts.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterPanel; 
