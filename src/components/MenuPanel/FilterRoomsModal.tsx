import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import RoomFilterTable from './RoomFilterTable';
import PresetManager from './PresetManager';
import { useProfile } from '../../hooks/useProfile';

interface FilterRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FilterRoomsModal: React.FC<FilterRoomsModalProps> = ({ isOpen, onClose }) => {
  const { autoHide, updateAutoHide, currentFilter } = useProfile();
  const { isDarkMode } = useTheme();

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className={`max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-900/40 backdrop-blur-xl border-white/10 text-white' 
            : 'bg-white/40 backdrop-blur-xl border-white/20 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b backdrop-blur-sm ${
          isDarkMode 
            ? 'border-white/10 bg-gray-800/20' 
            : 'border-gray-200/30 bg-white/20'
        }`}>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Filter Events
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
              isDarkMode
                ? 'text-gray-300 hover:text-white hover:bg-white/10'
                : 'text-gray-600 hover:text-gray-900 hover:bg-black/10'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Responsive Layout: Stacked on mobile, side-by-side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preset Manager */}
            <PresetManager />

            {/* Room Filter Table or Message */}
            {currentFilter === 'My Events' ? (
              <div className={`rounded-xl p-4 shadow-lg border backdrop-blur-sm ${
                isDarkMode 
                  ? 'bg-gray-800/30 border-white/10' 
                  : 'bg-white/30 border-white/30'
              }`}>
                <h3 className={`text-lg font-medium mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Filter Events by Room</h3>
                <div className={`flex items-center justify-center h-80 rounded-xl border backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-gray-900/20 border-white/5' 
                    : 'bg-white/20 border-gray-200/30'
                }`}>
                  <div className="text-center">
                    <svg className={`w-12 h-12 mx-auto mb-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      This filter will only show<br />
                      events assigned to you
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <RoomFilterTable autoHideEnabled={autoHide} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t backdrop-blur-sm ${
          isDarkMode 
            ? 'border-white/10 bg-gray-800/20' 
            : 'border-gray-200/30 bg-white/20'
        }`}>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-white bg-gray-700/30 hover:bg-gray-600/40 border-white/10 hover:border-white/20' 
                  : 'text-gray-700 hover:text-gray-900 bg-white/30 hover:bg-white/50 border-gray-200/30 hover:border-gray-300/50'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterRoomsModal; 