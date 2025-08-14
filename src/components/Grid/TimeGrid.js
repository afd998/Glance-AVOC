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
         className="absolute text-center text-xs text-gray-700 dark:text-gray-300 px-2 py-1"
         style={{ 
           left: `${left}px`,
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
        className="absolute top-5 w-px h-[calc(100vh-8rem)] bg-gray-900 dark:bg-gray-950"
        style={{ 
          left: `${left}px`,
          zIndex: 1
        }}
      />
    );
  });

  return (
    <div className="sticky top-0 w-full h-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50 z-50" style={{ zIndex: 53 }}>
      {hourLabels}
    </div>
  );
} 