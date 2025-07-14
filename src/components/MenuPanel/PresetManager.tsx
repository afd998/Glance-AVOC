import React, { useState } from 'react';
import { useProfile, Preset } from '../../hooks/useProfile';
import { useTheme } from '../../contexts/ThemeContext';
import useRoomStore from '../../stores/roomStore';

interface PresetManagerProps {
  autoHideEmpty: boolean;
  onAutoHideChange: (value: boolean) => void;
}

const PresetManager: React.FC<PresetManagerProps> = ({ autoHideEmpty, onAutoHideChange }) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const { 
    presets, 
    isLoading: loading, 
    savePreset, 
    loadPreset, 
    deletePreset,
    isSavingPreset,
    isDeletingPreset,
    isLoadingPreset,
    currentFilter
  } = useProfile();
  const { selectedRooms, notificationRooms } = useRoomStore();
  const { isDarkMode } = useTheme();

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    
    try {
      savePreset(presetName.trim(), selectedRooms, notificationRooms);
      setPresetName('');
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  };

  const handleLoadPreset = async (preset: Preset) => {
    await loadPreset(preset);
    setShowPresets(false);
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
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Presets</h3>
      
      {/* Current Preset Display */}
      {currentFilter && (
        <div className="mb-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Current: {currentFilter}
          </span>
        </div>
      )}
      
      <div className="space-y-3">
        {/* Save and Load Buttons - Side by Side */}
        <div className="flex gap-2">
          {/* Save Current Configuration */}
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex-1 flex items-center justify-center px-4 py-2 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            💾 Save
          </button>

          {/* Load Presets */}
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
          >
            📂 Load ({presets.length})
          </button>
        </div>

        {/* Presets List */}
        {showPresets && (
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
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
              presets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset)}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {preset.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {preset.selectedRooms.length} rooms, {preset.notificationRooms.length} notifications
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    className="ml-2 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-md w-full mx-4 p-6 rounded-lg shadow-xl ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <h3 className="text-lg font-medium mb-4">Save Preset</h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowSaveDialog(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-gray-100' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  !presetName.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresetManager; 