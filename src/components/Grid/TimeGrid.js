import React from 'react';

export default function TimeGrid({ startHour, endHour, pixelsPerMinute }) {
  const hours = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i
  );

  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  };

  const hourLabels = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
    const hour = startHour + i;
    const left = i * 60 * pixelsPerMinute;
    return (
      <div
        key={hour}
        className="absolute text-center text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 rounded px-1 dark:border-gray-700"
        style={{ 
          left: left,
          top: '0px',
          zIndex: 53
        }}
      >
        {formatHour(hour)}
      </div>
    );
  });

  const verticalLines = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
    const left = i * 60 * pixelsPerMinute;
    return (
      <div 
        key={i}
        className="absolute top-5 w-px h-[calc(100vh-8rem)] bg-gray-300 dark:bg-gray-700"
        style={{ 
          left: `${left}px`,
          zIndex: 1
        }}
      />
    );
  });

  return (
    <div className="sticky top-0 bg-white dark:bg-gray-800 transform -translate-y-5 w-full" style={{ zIndex: 53 }}>
      {/* Y-axis background */}
      <div 
        className="absolute h-5 bg-gray-300 dark:bg-gray-800" 
        style={{ 
          width: `${(endHour - startHour + 1) * 60 * pixelsPerMinute}px`,
          top: '0',
          zIndex: 52
        }}
      />
      {hourLabels}
      <div className="h-[1px] bg-gray-200 dark:bg-gray-700 transform translate-y-5" style={{ width: `${(endHour - startHour + 1) * 60 * pixelsPerMinute}px` }}></div>
    </div>
  );
} 