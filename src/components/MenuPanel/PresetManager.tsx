import React, { useState } from 'react';
import { useProfile, Preset } from '../../hooks/useProfile';
import { useTheme } from '../../contexts/ThemeContext';
import useRoomStore from '../../stores/roomStore';

interface PresetManagerProps {
  autoHideEmpty: boolean;
  onAutoHideChange: (value: boolean) => void;
}

const PresetManager: React.FC<PresetManagerProps> = ({ autoHideEmpty, onAutoHideChange }) => {
  const { 
    presets, 
    isLoading: loading, 
    loadPreset, 
    deletePreset,
    isDeletingPreset,
    isLoadingPreset,
    currentFilter
  } = useProfile();
  const { selectedRooms, notificationRooms } = useRoomStore();
  const { isDarkMode } = useTheme();

  const handleLoadPreset = async (preset: Preset) => {
    await loadPreset(preset);
  };

  const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this preset?')) {
      try {
        await deletePreset(presetId);
      } catch (error) {
        console.error('Failed to delete preset:', error);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">My Presets</h3>
      
      <div className="space-y-3">
        {/* Presets List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading presets...</p>
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">No presets saved yet</p>
            </div>
          ) : (
            presets.map((preset) => {
              const isCurrentPreset = currentFilter === preset.name;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset)}
                  className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                    isCurrentPreset
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center flex-1">
                    {isCurrentPreset && (
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <div>
                      <h4 className={`text-sm font-medium ${
                        isCurrentPreset 
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {preset.name}
                      </h4>
                      <p className={`text-xs ${
                        isCurrentPreset 
                          ? 'text-green-600 dark:text-green-300' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {preset.selectedRooms.length} rooms, {preset.notificationRooms.length} notifications
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default PresetManager; 