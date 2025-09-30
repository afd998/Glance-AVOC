import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from "react-datepicker";
import { useTheme } from '../../../contexts/ThemeContext';
import { useAcademicCalendarRange, getAcademicEventsForDate } from '../hooks/useAcademicCalendarRange';
import { Info } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

// Custom date formatter function for vertical display
const formatDateVertical = (date) => {
  const month = date.getMonth(); // 0-indexed, so October is 9
  const day = date.getDate();
  
  // Check if it's October 31st
  if (month === 9 && day === 31) {
    return "Halloween";
  }
  
  // For vertical display, show each part on its own line
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthAbbr = date.toLocaleDateString('en-US', { month: 'short' });
  const dayNum = date.getDate().toString();
  const yearNum = date.getFullYear().toString();
  
  // Return each part on its own line with explicit line breaks
  return weekday + '\n' + monthAbbr + '\n' + dayNum + '\n' + yearNum;
};

const CustomInputVertical = React.forwardRef(({ value, onClick, disabled, selectedDate }, ref) => {
  
  const displayValue = selectedDate ? formatDateVertical(selectedDate) : value;
  
  // Check if the value is "Halloween" to apply special styling
  const isHalloween = displayValue === "Halloween";
  
  return (
    <button
      className={`w-12 h-48 px-1 py-2 border backdrop-blur-sm rounded-xl shadow-lg focus:outline-none transition-all duration-200 hover:shadow-xl hover:scale-[1.02] text-xs font-semibold flex items-center justify-center ${
        disabled
          ? 'opacity-50 cursor-not-allowed border-gray-300/50 dark:border-gray-600/50 bg-gray-100/40 dark:bg-gray-700/40 text-gray-500 dark:text-gray-300'
          : 'border-gray-300/50 dark:border-gray-600/50 bg-gray-100/40 dark:bg-gray-700/40 text-gray-700 dark:text-gray-200 hover:border-gray-400/50 dark:hover:border-gray-400/50 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
      }`}
      onClick={onClick}
      ref={ref}
      disabled={disabled}
    >
      <div 
        style={isHalloween ? { fontFamily: 'HalloweenInline' } : {}}
        className="text-sm whitespace-pre-line leading-tight text-center"
        dangerouslySetInnerHTML={{ __html: displayValue.replace(/\n/g, '<br>') }}
      />
    </button>
  );
});

// Tooltip component for academic calendar events
const AcademicTooltip = ({ events, isDarkMode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);

  const handleMouseEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 10,
        left: rect.right + 10
      });
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const tooltipContent = isVisible && createPortal(
    <div
      style={{
        position: 'fixed',
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        minWidth: '200px',
        maxWidth: '300px',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        zIndex: 2147483647,
        borderRadius: '0.75rem',
        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '12px',
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        color: isDarkMode ? '#f9fafb' : '#1f2937',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        pointerEvents: 'none'
      }}
    >
      {events.map((event, index) => (
        <div key={index} style={{ 
          fontSize: '12px', 
          marginBottom: '4px', 
          wordBreak: 'break-word' 
        }}>
          {events.length > 1 ? '• ' : ''}{event.label}
        </div>
      ))}
    </div>,
    document.getElementById('root') || document.body
  );

  return (
    <>
      <div
        ref={iconRef}
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          zIndex: 10
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Info
          size={10}
          style={{
            color: '#8b5cf6',
            transition: 'all 0.2s ease-in-out',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
            cursor: 'pointer'
          }}
        />
      </div>
      {tooltipContent}
    </>
  );
};

const DatePickerVertical = ({ selectedDate, setSelectedDate, isLoading, onCalendarOpen, onCalendarClose }) => {
  const { isDarkMode } = useTheme();

  // Create a new date object for the DatePicker
  const displayDate = new Date(selectedDate);
  const timezoneOffset = displayDate.getTimezoneOffset();
  displayDate.setMinutes(displayDate.getMinutes() + timezoneOffset);

  // Calculate date range for academic calendar (wider range to cover multiple months)
  const startOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() - 2, 1);
  const endOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 3, 0);
  
  // Fetch academic calendar events for the month
  const { data: academicEvents = [], isLoading: academicLoading } = useAcademicCalendarRange(startOfMonth, endOfMonth);

  const handleDateChange = (date) => {
    // Create a new date object and set it to midnight in local time
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
  };

  // Custom day renderer to show "Today" on the actual current date and academic calendar info
  const renderDayContents = (day, date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    // Get academic events for this date
    const dayEvents = getAcademicEventsForDate(academicEvents, date);
    const hasAcademicEvents = dayEvents.length > 0;
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className={isToday ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>
          {day}
        </span>
        {hasAcademicEvents && (
          <AcademicTooltip events={dayEvents} isDarkMode={isDarkMode} />
        )}
      </div>
    );
  };

  // Custom popper class for glassmorphism effect
  const customPopperClassName = isDarkMode 
    ? "z-[9999] react-datepicker-glassmorphism-dark" 
    : "z-[9999] react-datepicker-glassmorphism";

  return (
    <>
      <DatePicker
        selected={displayDate}
        onChange={handleDateChange}
        customInput={<CustomInputVertical disabled={isLoading} selectedDate={displayDate} />}
        dateFormat="EEE, MMM d, yyyy"
        popperClassName={customPopperClassName}
        popperPlacement="right-start"
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
        renderDayContents={renderDayContents}
        onCalendarOpen={onCalendarOpen}
        onCalendarClose={onCalendarClose}
      />
    </>
  );
};

export default DatePickerVertical;
