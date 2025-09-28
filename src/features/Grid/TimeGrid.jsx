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
    // Skip first and last labels
    if (i === 0 || i === endHour - startHour) {
      return null;
    }
    
    const hour = startHour + i;
    const left = i * 60 * pixelsPerMinute;
    return (
             <div
         key={hour}
         className="absolute text-center text-xs text-gray-700 font-bold px-2 py-1"
         style={{ 
           left: `${left}px`,
           top: '0px',
           zIndex: 53
         }}
       >
        {formatHour(hour)}
      </div>
    );
  }).filter(Boolean);

  const shortVerticalLines = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
    // Skip first and last lines to match the labels
    if (i === 0 || i === endHour - startHour) {
      return null;
    }
    
    const left = i * 60 * pixelsPerMinute;
    return (
      <div 
        key={i}
        className="absolute top-1 w-px h-4 bg-gray-700"
        style={{ 
          left: `${left}px`,
          zIndex: 70
        }}
      />
    );
  }).filter(Boolean);

  return (
    <div className="sticky top-0 w-full h-6 bg-white/90 dark:bg-gray-900/90 z-50 flex items-center relative overflow-hidden" style={{ 
      zIndex: 60, 
      opacity: 1.0
    }}>
      {hourLabels}
      {shortVerticalLines}
    </div>
  );
} 