import React from 'react';

export default function TimeGrid({ startHour, endHour, pixelsPerMinute }) {
  const hourLabels = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    const minutes = (hour - startHour) * 60;
    const left = minutes * pixelsPerMinute;
    const displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hourLabels.push(
      <div
        key={hour}
        className="absolute text-sm text-gray-600 dark:text-gray-300 -translate-x-1/2 whitespace-nowrap"
        style={{ 
          left: left,
          top: '0px'
        }}
      >
        {displayHour}:00 {ampm}
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 transform -translate-y-5">
      {hourLabels}
    </div>
  );
} 