import React from 'react';
import DatePicker from "react-datepicker";
import { useTheme } from '../contexts/ThemeContext';

const CustomInput = React.forwardRef(({ value, onClick, disabled }, ref) => (
  <button
    className={`w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-200 dark:bg-gray-700 dark:text-white text-center whitespace-nowrap ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    }`}
    onClick={onClick}
    ref={ref}
    disabled={disabled}
  >
    <div className="text-lg font-semibold">
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

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handlePreviousDay}
        disabled={isLoading}
        className={`p-2 rounded-lg transition-colors ${
          isLoading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-300 dark:hover:bg-gray-600'
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
        popperClassName="z-[9999]"
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
      />

      <button
        onClick={handleNextDay}
        disabled={isLoading}
        className={`p-2 rounded-lg transition-colors ${
          isLoading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-300 dark:hover:bg-gray-600'
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