import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import NotificationSettings from './NotificationSettings';
import NotificationTest from './NotificationTest';

import FilterRoomsModal from './FilterRoomsModal';
import useRoomStore from '../../stores/roomStore';

import UserProfile from '../UserProfile';
import { Database } from '../../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

interface FilterPanelProps {
  selectedDate: Date;
  events: Event[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({ selectedDate = new Date(), events = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();



  return (
    <>
      {/* Hamburger Menu Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 right-4 flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors z-50 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
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

            {/* User Profile Section */}
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Account</h3>
              <UserProfile />
            </div>

                        {/* Main Content */}
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Filter Rooms Button */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                <button
                  onClick={() => setShowFilterModal(true)}
                  className="w-full flex items-center justify-center px-4 py-3 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  🔧 Filter Rooms
                </button>
              </div>

              {/* Notification Settings Section */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Notifications</h3>
                <NotificationSettings />
              </div>

              {/* Quick Actions Section */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                <div className="space-y-3">
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

      {/* Filter Rooms Modal */}
      <FilterRoomsModal 
        isOpen={showFilterModal} 
        onClose={() => setShowFilterModal(false)} 
      />
    </>
  );
};

export default FilterPanel; 