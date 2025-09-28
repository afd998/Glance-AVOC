import React, { useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useFilters, Filter } from '../../hooks/useFilters';
import { useTheme } from '../../contexts/ThemeContext';

const PresetManager: React.FC = () => {
  const { 
    currentFilter,
    updateCurrentFilter,
    autoHide,
    updateAutoHide
  } = useProfile();
  
  const { 
    filters,
 

    isLoading: loading,
    loadFilter,

    isLoadingFilter
  } = useFilters();
  
  const { isDarkMode } = useTheme();
  
  // Track which filter is being loaded
  const [loadingFilterName, setLoadingFilterName] = useState<string | null>(null);

  const handleLoadFilter = async (filter: Filter) => {
    console.log('Starting to load filter:', filter.name);
    setLoadingFilterName(filter.name);
    try {
      // Add a minimum loading time to make spinner visible
      const [result] = await Promise.all([
        loadFilter(filter),
        new Promise(resolve => setTimeout(resolve, 500)) // Minimum 500ms loading time
      ]);
      console.log('Filter loaded successfully:', filter.name);
    } catch (error) {
      console.error('Failed to load filter:', error);
    } finally {
      setLoadingFilterName(null);
      console.log('Loading state cleared for:', filter.name);
    }
  };



  const handleLoadMyEvents = async () => {
    console.log('Starting to load My Events filter');
    setLoadingFilterName('My Events');
    try {
      // Add a minimum loading time to make spinner visible
      const [result] = await Promise.all([
        updateCurrentFilter('My Events'),
        new Promise(resolve => setTimeout(resolve, 500)) // Minimum 500ms loading time
      ]);
      console.log('My Events filter loaded successfully');
    } catch (error) {
      console.error('Failed to set My Events filter:', error);
    } finally {
      setLoadingFilterName(null);
      console.log('Loading state cleared for My Events');
    }
  };

  // Debug logging
  console.log('PresetManager render - loadingFilterName:', loadingFilterName, 'currentFilter:', currentFilter);

  return (
    <div className="space-y-3 overflow-hidden">
        {/* Filters List */}
        <div className="space-y-2 max-h-80 overflow-y-auto overflow-x-hidden px-1">
          {/* My Events - Special built-in filter */}
          <div
            onClick={() => !loadingFilterName && handleLoadMyEvents()}
            className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] backdrop-blur-sm ${
              (loadingFilterName === 'My Events') || (!loadingFilterName && currentFilter === 'My Events')
                ? 'border-green-400/50 bg-green-500/20 hover:bg-green-500/30 shadow-lg shadow-green-500/20'
                : isDarkMode
                ? 'border-white/10 hover:border-white/20 bg-gray-700/30 hover:bg-gray-600/40'
                : 'border-gray-200/30 hover:border-gray-300/50 bg-white/30 hover:bg-white/50'
            } ${loadingFilterName ? 'opacity-75' : ''}`}
          >
            <div className="flex items-center flex-1">
              {(loadingFilterName === 'My Events') || (!loadingFilterName && currentFilter === 'My Events') && (
                <div className="mr-2">
                  {loadingFilterName === 'My Events' ? (
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}
              <div>
                <h4 className={`text-sm font-medium ${
                  (loadingFilterName === 'My Events') || (!loadingFilterName && currentFilter === 'My Events')
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  My Events
                </h4>
                <p className={`text-xs ${
                  (loadingFilterName === 'My Events') || (!loadingFilterName && currentFilter === 'My Events')
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
              const isLoadingThisFilter = loadingFilterName === filter.name;
              const isSelected = isLoadingThisFilter || (!loadingFilterName && isCurrentFilter);
              
              return (
                <div
                  key={filter.id}
                  onClick={() => !loadingFilterName && handleLoadFilter(filter)}
                  className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] backdrop-blur-sm ${
                    isSelected
                      ? 'border-green-400/50 bg-green-500/20 hover:bg-green-500/30 shadow-lg shadow-green-500/20'
                      : isDarkMode
                      ? 'border-white/10 hover:border-white/20 bg-gray-700/30 hover:bg-gray-600/40'
                      : 'border-gray-200/30 hover:border-gray-300/50 bg-white/30 hover:bg-white/50'
                  } ${loadingFilterName ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-center flex-1">
                    {isSelected && (
                      <div className="mr-2">
                        {isLoadingThisFilter ? (
                          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                    <div>
                      <h4 className={`text-sm font-medium ${
                        isSelected
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {filter.name}
                        {filter.isDefault && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Default)</span>
                        )}
                    </h4>
                      <p className={`text-xs ${
                        isSelected
                          ? 'text-green-600 dark:text-green-300' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {filter.display.length} rooms
                      </p>
                    </div>
                  </div>
                  
                </div>
              );
            })
            )}
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
  );
};

export default PresetManager; 