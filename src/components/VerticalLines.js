import React from 'react';

export default function VerticalLines({ startHour, endHour, pixelsPerMinute }) {
  const verticalLines = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
    const left = i * 60 * pixelsPerMinute;
    return (
      <div 
        key={i}
        className="absolute top-0 w-px h-full bg-gray-300 dark:bg-gray-700"
        style={{ 
          left: `${left}px`,
          zIndex: 1
        }}
      />
    );
  });

  return (
    <div className="absolute inset-0">
      {verticalLines}
    </div>
  );
} 