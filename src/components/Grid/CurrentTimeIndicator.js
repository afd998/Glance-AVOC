import React from 'react';

export default function CurrentTimeIndicator({ currentTime, startHour, endHour, pixelsPerMinute }) {
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const totalCurrentMinutes = (currentHour - startHour) * 60 + currentMinute;
  // Match event positioning - don't add room label width offset
  const currentPosition = totalCurrentMinutes * pixelsPerMinute;



  // Only show if within the visible time range and position is valid
  if (currentHour >= startHour && currentHour <= endHour && currentPosition >= 0) {
    return (
      <>
        {/* Sticky playhead that follows TimeGrid pattern */}
        <div 
          className="sticky top-0 animate-pulse"
          style={{
            left: `${currentPosition - 8}px`, // Offset by half the triangle width (16px / 2 = 8px)
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '10px solid #d1d5db', // gray-300 - light gray triangle
            filter: 'drop-shadow(0 2px 4px rgba(209, 213, 219, 0.3))',
            zIndex: 1001,
            position: 'absolute',
            pointerEvents: 'none'
          }}
        />
        
        {/* Vertical line */}
        <div
          className="w-0.5 bg-gray-300 animate-pulse"
          style={{ 
            position: 'absolute',
            left: `${currentPosition}px`,
            top: '10px', // Start below the playhead
            height: 'calc(100% - 10px)', // Extend to bottom of container minus top offset
            boxShadow: '0 0 4px rgba(209, 213, 219, 0.5)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        />
      </>
    );
  }
  return null;
} 