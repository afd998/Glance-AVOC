import React from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAcademicCalendar } from '../../hooks/useAcademicCalendar';
import { GraduationCap } from 'lucide-react';

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
    <div className="group relative inline-block">
      {/* Container with info icon - matching QuarterCount style */}
      <div
        className={`text-xs mt-1 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-help relative overflow-hidden ${
          isDarkMode
            ? 'bg-white/10 border-white/20 text-purple-300 hover:bg-white/15'
            : 'bg-white/30 border-white/40 text-purple-600 hover:bg-white/40'
        }`}
      >
        {/* Glassmorphic shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/5 to-transparent rounded-full"></div>
        <div className="relative z-10 flex items-center gap-2">
        {/* Graduation cap icon */}
        <GraduationCap className="w-4 h-4 flex-shrink-0" />

        {/* Hover indicator */}
        <span className="font-medium opacity-75">
          {calendarItems.length} item{calendarItems.length !== 1 ? 's' : ''}
        </span>
        </div>
      </div>

      {/* Expanded content on hover - slides out to the right */}
      <div className="absolute left-full top-0 ml-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 ease-out transform translate-x-0 group-hover:translate-x-0 z-[100]">
        <div className={`flex items-center gap-2 p-3 rounded-lg border backdrop-blur-sm shadow-xl ${
          isDarkMode
            ? 'bg-gray-800/95 border-gray-600/50 text-gray-200'
            : 'bg-white/95 border-gray-300/50 text-gray-800'
        }`}>
          <div className="flex flex-wrap items-center gap-2">
            {calendarItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <span className="text-current opacity-50">•</span>}
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label || 'No label'}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicCalendarInfo; 