import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import PresetManager from './PresetManager';
import { useProfile } from '../../hooks/useProfile';

interface FilterRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FilterRoomsModal: React.FC<FilterRoomsModalProps> = ({ isOpen, onClose }) => {
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
        className={`max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl border transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-900/40 backdrop-blur-xl border-white/10 text-white' 
            : 'bg-white/40 backdrop-blur-xl border-white/20 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex justify-between items-center p-4 border-b backdrop-blur-sm ${
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
        <div className="p-4">
          {/* Preset Manager */}
          <PresetManager />
        </div>

        {/* Footer */}
        <div className={`p-4 border-t backdrop-blur-sm ${
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