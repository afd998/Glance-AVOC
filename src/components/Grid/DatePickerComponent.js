import React from 'react';
import DatePicker from "react-datepicker";
import { useTheme } from '../../contexts/ThemeContext';
import "react-datepicker/dist/react-datepicker.css";

const CustomInput = React.forwardRef(({ value, onClick, disabled }, ref) => (
  <button
    className={`w-40 sm:w-64 h-12 px-2 py-1 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white text-center whitespace-nowrap transition-all duration-200 hover:shadow-md text-base sm:text-lg font-semibold ${
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
    <>
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
    </>
  );
};

export default DatePickerComponent; 
