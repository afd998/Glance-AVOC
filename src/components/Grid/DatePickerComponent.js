import React from 'react';
import DatePicker from "react-datepicker";
import { useTheme } from '../../contexts/ThemeContext';
import "react-datepicker/dist/react-datepicker.css";

const CustomInput = React.forwardRef(({ value, onClick, disabled }, ref) => (
  <button
    className={`w-40 sm:w-64 px-2 py-1 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white text-center whitespace-nowrap transition-all duration-200 hover:shadow-md text-base sm:text-lg font-semibold ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 dark:hover:border-blue-400'
    }`}
    onClick={onClick}
    ref={ref}
    disabled={disabled}
  >
    <div>
      {value}
    </div>
  </button>
));

const DatePickerComponent = ({ selectedDate, setSelectedDate, isLoading }) => {
  const { isDarkMode } = useTheme();

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate()-1);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
  };

  const handleGoToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
  };

  // Create a new date object for the DatePicker
  const displayDate = new Date(selectedDate);
  const timezoneOffset = displayDate.getTimezoneOffset();
  displayDate.setMinutes(displayDate.getMinutes() + timezoneOffset);

  const handleDateChange = (date) => {
    // Create a new date object and set it to midnight in local time
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
  };

  // Custom CSS classes for dark mode
  const customPopperClassName = isDarkMode 
    ? "z-[9999] react-datepicker-dark" 
    : "z-[9999]";

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleGoToToday}
        disabled={isLoading}
        className={`px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 ${
          isLoading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 shadow-md hover:shadow-lg transform hover:scale-105'
        }`}
        aria-label="Go to today"
      >
        Today
      </button>

      <button
        onClick={handlePreviousDay}
        disabled={isLoading}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isLoading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-sm'
        }`}
        aria-label="Previous day"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <DatePicker
        selected={displayDate}
        onChange={handleDateChange}
        customInput={<CustomInput disabled={isLoading} />}
        dateFormat="EEE, MMM d, yyyy"
        popperClassName={customPopperClassName}
        popperPlacement="bottom-start"
        popperModifiers={[
          {
            name: "preventOverflow",
            enabled: true,
            options: {
              boundary: "viewport"
            }
          }
        ]}
        portalId="root"
        withPortal
        disabled={isLoading}
        calendarClassName={isDarkMode ? "react-datepicker-dark" : ""}
      />

      <button
        onClick={handleNextDay}
        disabled={isLoading}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isLoading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-sm'
        }`}
        aria-label="Next day"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default DatePickerComponent; 
