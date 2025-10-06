import React from 'react';

export default function VerticalLines({ startHour, endHour, pixelsPerMinute, actualRowCount = 0, rowHeightPx = 96 }) {
  // Calculate the actual content height based on row count (header is outside)
  const actualContentHeight = (actualRowCount * rowHeightPx);
  
  const verticalLines = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
    // Skip first and last lines
    if (i === 0 || i === endHour - startHour) {
      return null;
    }
    
    const left = i * 60 * pixelsPerMinute;
    return (
      <div 
        key={i}
        className="absolute top-0 w-px bg-gray-300/40 dark:bg-gray-800/70 transition-all duration-200 ease-in-out"
        style={{ 
          left: `${left}px`,
          height: `${actualContentHeight}px`,
          zIndex: 40
        }}
      />
    );
  }).filter(Boolean);

  return (
    <div className="absolute inset-0">
      {verticalLines}
    </div>
  );
} 