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
         className="absolute text-center text-xs text-white font-bold px-2 py-1"
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
        className="absolute top-1 w-px h-4 bg-white"
        style={{ 
          left: `${left}px`,
          zIndex: 70
        }}
      />
    );
  }).filter(Boolean);

  return (
    <div className="sticky top-0 w-full h-6 backdrop-blur-sm border-b border-purple-400/20 dark:border-purple-500/50 z-50 flex items-center" style={{ 
      zIndex: 60, 
      background: 'rgba(255, 255, 255, 0.2)'
    }}>
      {hourLabels}
      {shortVerticalLines}
    </div>
  );
} 