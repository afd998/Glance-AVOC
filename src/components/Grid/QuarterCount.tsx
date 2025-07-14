import React from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useQuarterStartDates } from '../../hooks/useQuarterStartDates';

const QuarterCount: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { date } = useParams<{ date: string }>();
  const { data: quarterStartDates = [], isLoading, error } = useQuarterStartDates();

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
  console.log('[QuarterCount] Selected date from URL:', selectedDate);

  // Find the closest quarter start date that comes before the selected date (within 10 weeks)
  const findClosestQuarterStart = (): Date | null => {
    if (quarterStartDates.length === 0) return null;

    const tenWeeksInMs = 10 * 7 * 24 * 60 * 60 * 1000; // 10 weeks in milliseconds
    const cutoffDate = new Date(selectedDate.getTime() - tenWeeksInMs);

    // Filter dates that come before the selected date and within 10 weeks
    const validDates = quarterStartDates.filter(date => 
      date <= selectedDate && date >= cutoffDate
    );

    if (validDates.length === 0) return null;

    // Return the most recent date (closest to selected date)
    const closest = validDates.reduce((closest, current) => 
      current > closest ? current : closest
    );
    console.log('[QuarterCount] Closest quarter start:', closest);
    return closest;
  };

  const closestQuarterStart = findClosestQuarterStart();

  if (isLoading) {
    return (
      <div className={`ml-4 p-2 rounded-lg border ${
        isDarkMode 
          ? 'bg-gray-800/20 border-gray-300/30 text-gray-300' 
          : 'bg-gray-50/50 border-gray-200/50 text-gray-600'
      }`}>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-current"></div>
          <span className="text-xs">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Don't show anything on error
  }

  if (!closestQuarterStart) {
    return null; // Don't show anything if no valid quarter start found
  }

  // Calculate weeks since quarter start
  const weeksSinceQuarterStart = Math.floor(
    (selectedDate.getTime() - closestQuarterStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  console.log('[QuarterCount] Weeks since quarter start:', weeksSinceQuarterStart + 1);

  return (
    <div className={`ml-4 p-2 rounded-lg border ${
      isDarkMode 
        ? 'bg-blue-900/20 border-blue-300/30 text-blue-200' 
        : 'bg-blue-50/50 border-blue-200/50 text-blue-700'
    }`}>
      <div className="flex items-center gap-2">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span className="text-xs">
          Week {weeksSinceQuarterStart + 1}
        </span>
      </div>
    </div>
  );
};

export default QuarterCount; 