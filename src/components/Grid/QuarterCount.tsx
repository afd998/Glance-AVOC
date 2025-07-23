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

  // Find the closest quarter start date that comes before the selected date (within 70 days)
  const findClosestQuarterStart = (): Date | null => {
    if (quarterStartDates.length === 0) {
      return null;
    }

    const seventyDaysInMs = 70 * 24 * 60 * 60 * 1000; // 70 days in milliseconds
    const cutoffDate = new Date(selectedDate.getTime() - seventyDaysInMs);

    // Filter dates that come before the selected date and within 70 days
    const validDates = quarterStartDates.filter(date => 
      date <= selectedDate && date >= cutoffDate
    );

    if (validDates.length === 0) {
      return null;
    }

    // Return the most recent date (closest to selected date)
    const closest = validDates.reduce((closest, current) => 
      current > closest ? current : closest
    );
    return closest;
  };

  const closestQuarterStart = findClosestQuarterStart();

  if (isLoading) {
    return null; // Don't show anything while loading
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

  // Determine quarter name based on the month of the quarter start date
  const getQuarterName = (date: Date): string => {
    const month = date.getMonth(); // 0-11
    
    // Academic year quarters typically start in:
    // Fall: September (8), October (9), November (10)
    // Winter: December (11), January (0), February (1) 
    // Spring: March (2), April (3), May (4)
    // Summer: June (5), July (6), August (7)
    
    if (month >= 8 && month <= 10) return 'Fall'; // Sep, Oct, Nov
    if (month === 11 || month <= 1) return 'Winter'; // Dec, Jan, Feb
    if (month >= 2 && month <= 4) return 'Spring'; // Mar, Apr, May
    return 'Summer'; // Jun, Jul, Aug
  };

  // Format the quarter start date for display
  const formatQuarterStartDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const quarterName = getQuarterName(closestQuarterStart);

  return (
    <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
      Week {weeksSinceQuarterStart + 1} • {quarterName} Quarter
    </div>
  );
};

export default QuarterCount; 