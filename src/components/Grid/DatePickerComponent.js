import React from 'react';
import DatePicker from "react-datepicker";
import { useTheme } from '../../contexts/ThemeContext';
import "react-datepicker/dist/react-datepicker.css";

// Custom date formatter function
const formatDate = (date) => {
  const month = date.getMonth(); // 0-indexed, so October is 9
  const day = date.getDate();
  
  // Check if it's October 31st
  if (month === 9 && day === 31) {
    return "Halloween";
  }
  
  // Default format for other dates
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const CustomInput = React.forwardRef(({ value, onClick, disabled, selectedDate }, ref) => {
  // Format the date using our custom formatter
  const displayValue = selectedDate ? formatDate(selectedDate) : value;
  
  // Check if the value is "Halloween" to apply special styling
  const isHalloween = displayValue === "Halloween";
  
  return (
    <button
      className={`w-40 sm:w-64 h-12 px-2 py-1 sm:px-4 sm:py-2 border backdrop-blur-sm rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] text-base sm:text-lg font-semibold ${
        disabled 
          ? 'opacity-50 cursor-not-allowed border-gray-300/50 dark:border-gray-600/50 bg-gray-100/80 dark:bg-gray-700/80 text-gray-500 dark:text-gray-300' 
          : 'border-gray-300/70 dark:border-gray-600/70 bg-gray-100/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 hover:border-gray-400/70 dark:hover:border-gray-400/70 hover:bg-gray-200/80 dark:hover:bg-gray-600/80'
      }`}
      onClick={onClick}
      ref={ref}
      disabled={disabled}
    >
      <div style={isHalloween ? { fontFamily: 'HalloweenInline' } : {}}>
        {displayValue}
      </div>
    </button>
  );
});

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

  // Custom CSS classes for glassmorphism
  const customPopperClassName = isDarkMode 
    ? "z-[9999] react-datepicker-dark react-datepicker-glassmorphism" 
    : "z-[9999] react-datepicker-glassmorphism";

  return (
    <>
      <DatePicker
        selected={displayDate}
        onChange={handleDateChange}
        customInput={<CustomInput disabled={isLoading} selectedDate={displayDate} />}
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
        calendarClassName={isDarkMode ? "react-datepicker-dark react-datepicker-glassmorphism" : "react-datepicker-glassmorphism"}
      />
    </>
  );
};

export default DatePickerComponent; 
