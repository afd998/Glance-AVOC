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
  const { autoHide } = useProfile();
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className={`max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold">Filter Rooms</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Preset Manager */}
            <PresetManager />

            {/* Room Filter Table */}
            <RoomFilterTable autoHideEnabled={autoHide} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-gray-100' 
                  : 'text-gray-700 hover:text-gray-900'
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