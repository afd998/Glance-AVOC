import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import NotificationSettings from './NotificationSettings';

import FilterRoomsModal from './FilterRoomsModal';
import useRoomStore from '../../stores/roomStore';
import useModalStore from '../../stores/modalStore';
import SessionAssignmentsModal from './SessionAssignmentsModal';
import NotificationsModal from './NotificationsModal';
import BackgroundSelectorModal from './BackgroundSelectorModal';
import UserProfileButton from './UserProfileButton';
import { Database } from '../../types/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { useBackground } from '../../hooks/useBackground';

interface MenuPanelProps {
  selectedDate: Date;
  events: Database['public']['Tables']['events']['Row'][] | undefined;
}

const MenuPanel: React.FC<MenuPanelProps> = ({ selectedDate = new Date(), events = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { openFilterRoomsModal, isFilterRoomsModalOpen, closeFilterRoomsModal } = useModalStore();

  const [isSessionAssignmentsOpen, setIsSessionAssignmentsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isBackgroundSelectorOpen, setIsBackgroundSelectorOpen] = useState(false);
  const navigate = useNavigate();
  const { date } = useParams();
  const { currentBackground, setCurrentBackground } = useBackground();

  // Handle menu open animation
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the element is rendered before animation starts
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Modern Menu Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-300 rounded-xl bg-white/40 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/20 transition-all duration-200 z-[9999] shadow-lg hover:shadow-xl transform hover:scale-105 group"
          aria-label="Open menu"
        >
          <div className="flex flex-col items-center justify-center space-y-1">
            <div className="w-4 h-0.5 bg-current rounded-full transition-all duration-200 group-hover:w-5"></div>
            <div className="w-4 h-0.5 bg-current rounded-full transition-all duration-200 group-hover:w-3"></div>
            <div className="w-4 h-0.5 bg-current rounded-full transition-all duration-200 group-hover:w-5"></div>
          </div>
        </button>
      )}
      {/* Menu Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-[9998] animate-in fade-in duration-300"
            onClick={() => {
              setIsAnimating(false);
              setTimeout(() => setIsOpen(false), 150);
            }}
          />
          {/* Menu Panel */}
          <div 
            style={{
              zIndex: 9999,
              transform: isAnimating ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transformOrigin: 'right center'
            }} 
            className="fixed top-0 right-0 h-screen w-80"
          >
            <div className="p-6 h-full flex flex-col">
              {/* Header */}
              <div className="mb-6">
              </div>
              {/* User Profile Section */}
              <div className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-md rounded-lg p-4 shadow-lg border border-white/20 dark:border-gray-600/30 mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Account</h3>
                <UserProfileButton />
              </div>
              {/* Main Content */}
              <div className="flex-1 overflow-y-auto space-y-6">
                {/* Filter Rooms Button */}
                <div className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-md rounded-lg p-4 shadow-lg border border-white/20 dark:border-gray-600/30">
                  <button
                    onClick={openFilterRoomsModal}
                    className="w-full flex items-center justify-center px-4 py-3 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter Rooms
                  </button>
                  {/* Faculty List Button */}
                  <button
                    onClick={() => navigate(`/${date}/faculty`)}
                    className="w-full flex items-center justify-center mt-3 px-4 py-3 border border-green-300 dark:border-green-600 text-sm font-medium rounded-md text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 01-8 0m8 0a4 4 0 00-8 0m8 0V8a4 4 0 00-8 0v4m8 0v4a4 4 0 01-8 0v-4" />
                    </svg>
                    Faculty List
                  </button>
                  {/* Session Assignments Button */}
                  <button
                    onClick={() => setIsSessionAssignmentsOpen(true)}
                    className="w-full flex items-center justify-center mt-3 px-4 py-3 border border-purple-300 dark:border-purple-600 text-sm font-medium rounded-md text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Session Assignments
                  </button>
                  {/* Notifications Button */}
                  <button
                    onClick={() => setIsNotificationsOpen(true)}
                    className="w-full flex items-center justify-center mt-3 px-4 py-3 border border-orange-300 dark:border-orange-600 text-sm font-medium rounded-md text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4a2 2 0 00-2 2v9a2 2 0 002 2h5l5-5V9a2 2 0 00-2-2z" />
                    </svg>
                    Scheduled Notifications
                  </button>
                </div>
                {/* Notification Settings Section */}
                <div className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-md rounded-lg p-4 shadow-lg border border-white/20 dark:border-gray-600/30">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Notifications</h3>
                  <NotificationSettings />
                </div>
                {/* Quick Actions Section */}
                <div className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-md rounded-lg p-4 shadow-lg border border-white/20 dark:border-gray-600/30">
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
                    {/* Background Selector */}
                    <button
                      onClick={() => setIsBackgroundSelectorOpen(true)}
                      className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                    >
                      <span>Background</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {currentBackground ? currentBackground.replace(/\.(avif|jpeg|jpg|png)$/i, '') : 'Loading...'}
                      </span>
                    </button>

                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="pt-6 border-t border-white/20 dark:border-gray-600/30">
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  <p>Event notifications appear 15 minutes before events with staff assistance or web conferencing.</p>
                  <p className="mt-1">Only events in selected notification rooms will trigger alerts.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Filter Rooms Modal */}
      <FilterRoomsModal 
        isOpen={isFilterRoomsModalOpen} 
        onClose={closeFilterRoomsModal} 
      />
      {/* Session Assignments Modal */}
      <SessionAssignmentsModal 
        isOpen={isSessionAssignmentsOpen} 
        onClose={() => setIsSessionAssignmentsOpen(false)} 
      />
      {/* Notifications Modal */}
      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
      {/* Background Selector Modal */}
      <BackgroundSelectorModal 
        isOpen={isBackgroundSelectorOpen} 
        onClose={() => setIsBackgroundSelectorOpen(false)}
      />
    </>
  );
};

export default MenuPanel; 