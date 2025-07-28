import React, { useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useFilters, Filter } from '../../hooks/useFilters';
import { useTheme } from '../../contexts/ThemeContext';
import useRoomStore from '../../stores/roomStore';

const PresetManager: React.FC = () => {
  const { 
    currentFilter,
    updateCurrentFilter,
    autoHide,
    updateAutoHide
  } = useProfile();
  
  const { 
    filters,
    userFilters,
    defaultFilters,
    isLoading: loading,
    loadFilter,
    deleteFilter,
    isDeletingFilter,
    isLoadingFilter
  } = useFilters();
  
  const { selectedRooms, notificationRooms } = useRoomStore();
  const { isDarkMode } = useTheme();
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleLoadFilter = async (filter: Filter) => {
    setIsCreatingNew(false);
    await loadFilter(filter);
  };

  const handleDeleteFilter = async (filterId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this filter?')) {
      try {
        await deleteFilter(filterId);
      } catch (error) {
        console.error('Failed to delete filter:', error);
      }
    }
  };



  const handleLoadMyEvents = async () => {
    setIsCreatingNew(false);
    try {
      await updateCurrentFilter('My Events');
    } catch (error) {
      console.error('Failed to set My Events filter:', error);
    }
  };

  const handleCreateNewFilter = async () => {
    console.log('Creating new filter - clearing current filter');
    setIsCreatingNew(true);
    // Clear current filter to enable room selection
    try {
      await updateCurrentFilter(null);
      console.log('Current filter cleared successfully');
    } catch (error) {
      console.error('Failed to clear current filter:', error);
      alert('Failed to clear current filter: ' + (error as Error).message);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">My Filters</h3>
      
      <div className="space-y-3">
        {/* Filters List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {/* My Events - Special built-in filter */}
          <div
            onClick={() => handleLoadMyEvents()}
            className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
              currentFilter === 'My Events'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-center flex-1">
              {currentFilter === 'My Events' && (
                <svg className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <div>
                <h4 className={`text-sm font-medium ${
                  currentFilter === 'My Events'
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  My Events
                </h4>
                <p className={`text-xs ${
                  currentFilter === 'My Events'
                    ? 'text-green-600 dark:text-green-300' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  Show only events assigned to me
                </p>
              </div>
            </div>
          </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading filters...</p>
              </div>
          ) : filters.length === 0 ? (
              <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">No filters saved yet</p>
              </div>
            ) : (
            filters.map((filter) => {
              const isCurrentFilter = currentFilter === filter.name;
              return (
                <div
                  key={filter.id}
                  onClick={() => handleLoadFilter(filter)}
                  className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                    isCurrentFilter
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center flex-1">
                    {isCurrentFilter && (
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <div>
                      <h4 className={`text-sm font-medium ${
                        isCurrentFilter 
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {filter.name}
                        {filter.isDefault && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Default)</span>
                        )}
                    </h4>
                      <p className={`text-xs ${
                        isCurrentFilter 
                          ? 'text-green-600 dark:text-green-300' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {filter.display.length} rooms
                      </p>
                    </div>
                  </div>
                  {!filter.isDefault && (
                  <button
                      onClick={(e) => handleDeleteFilter(filter.id, e)}
                      className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                  >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                  </button>
                  )}
                </div>
              );
            })
            )}
            
            {/* Add New Filter Button */}
            <div
              onClick={handleCreateNewFilter}
              className={`flex items-center justify-between p-3 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                isCreatingNew
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-25 dark:hover:bg-blue-900/10 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center flex-1">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <div>
                  <h4 className={`text-sm font-medium ${
                    isCreatingNew 
                      ? 'text-blue-800 dark:text-blue-200' 
                      : 'text-blue-700 dark:text-blue-300'
                  }`}>
                    Add New Filter
                  </h4>
                  <p className={`text-xs ${
                    isCreatingNew 
                      ? 'text-blue-600 dark:text-blue-300' 
                      : 'text-blue-500 dark:text-blue-400'
                  }`}>
                    Create custom room filter
                  </p>
                </div>
              </div>
            </div>
          </div>

        {/* Auto-hide Setting */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoHide}
              onChange={(e) => updateAutoHide(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Hide room rows without filtered events
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default PresetManager; 