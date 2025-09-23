import React from 'react';
import { useParams } from 'react-router-dom';

interface DateDisplayProps {
  className?: string;
  style?: React.CSSProperties;
  isHeaderHovered?: boolean; // Whether the header is currently hovered
}

export default function DateDisplay({ className = '', style = {}, isHeaderHovered = false }: DateDisplayProps) {
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

  // Format the date for display
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  const displayDate = formatDate(selectedDate);

  return (
    <div 
      className={`inline-block text-left text-xs font-medium text-white px-2 py-1 bg-black rounded-md transition-opacity duration-300 ${className}`}
      style={{
        ...style,
        opacity: isHeaderHovered ? 0 : 1,
        pointerEvents: isHeaderHovered ? 'none' : 'auto'
      }}
    >
      {displayDate}
    </div>
  );
}
