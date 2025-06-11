import React from 'react';
import DatePicker from "react-datepicker";
import { useTheme } from '../contexts/ThemeContext';

const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
  <button
    className="w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-200 dark:bg-gray-700 dark:text-white text-center whitespace-nowrap"
    onClick={onClick}
    ref={ref}
  >
    <div className="text-lg font-semibold">
      {value}
    </div>
  </button>
));

const DatePickerComponent = ({ selectedDate, setSelectedDate }) => {
  const { isDarkMode } = useTheme();

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Adjust the date to account for timezone offset
  const adjustedDate = new Date(selectedDate);
  adjustedDate.setDate(adjustedDate.getDate() + 1);

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handlePreviousDay}
        className="p-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Previous day"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <DatePicker
        selected={adjustedDate}
        onChange={date => {
          const newDate = new Date(date);
          newDate.setDate(newDate.getDate() - 1);
          setSelectedDate(newDate);
        }}
        customInput={<CustomInput />}
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
      />

      <button
        onClick={handleNextDay}
        className="p-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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