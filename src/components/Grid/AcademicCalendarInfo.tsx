import React from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAcademicCalendar } from '../../hooks/useAcademicCalendar';

const AcademicCalendarInfo: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { date } = useParams<{ date: string }>();

  // Get selected date from URL params
  const getSelectedDate = (): Date => {
    if (!date) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    }
    
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day, 12, 0, 0);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  };

  const selectedDate = getSelectedDate();
  const { data: calendarItems = [], isLoading, error } = useAcademicCalendar(selectedDate);

  if (isLoading) {
    return (
      <div className={`ml-4 p-2 rounded-lg border ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-600 text-gray-300' 
          : 'bg-gray-100 border-gray-300 text-gray-600'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
          <span className="text-sm">Loading calendar...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`ml-4 p-2 rounded-lg border ${
        isDarkMode 
          ? 'bg-red-900 border-red-600 text-red-200' 
          : 'bg-red-100 border-red-300 text-red-700'
      }`}>
        <span className="text-sm">Error: {error.message || 'Failed to fetch academic calendar'}</span>
      </div>
    );
  }

  if (calendarItems.length === 0) {
    return null;
  }

  return (
    <div className="ml-4 group relative">
      {/* Icon only - always visible */}
      <div className={`flex items-center justify-center p-2 rounded-lg border ${
        isDarkMode 
          ? 'bg-purple-900/20 border-purple-300/30 text-purple-200' 
          : 'bg-purple-50/50 border-purple-200/50 text-purple-700'
      }`}>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
      
                           {/* Expanded content - visible on hover */}
                <div className="absolute left-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
          <div className="p-3 min-w-max">
          
          <div className="flex flex-wrap gap-2">
            {calendarItems.map((item) => (
              <div 
                key={item.id} 
                className={`text-xs p-2 rounded whitespace-nowrap ${
                  isDarkMode 
                    ? 'bg-purple-800/40 hover:bg-purple-700/50 text-purple-200' 
                    : 'bg-purple-100/70 hover:bg-purple-200/80 text-purple-700'
                } transition-colors`}
              >
                {item.label || 'No label'}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicCalendarInfo; 