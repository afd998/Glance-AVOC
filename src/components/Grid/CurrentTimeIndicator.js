import React from 'react';

export default function CurrentTimeIndicator({ currentTime, startHour, endHour, pixelsPerMinute }) {
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const totalCurrentMinutes = (currentHour - startHour) * 60 + currentMinute;
  const currentPosition = totalCurrentMinutes * pixelsPerMinute;

  // Only show if within the visible time range
  if (currentHour >= startHour && currentHour <= endHour) {
    return (
      <div
        className="absolute w-0.5 bg-red-500 animate-pulse"
        style={{ 
          left: currentPosition,
          top: 0,
          bottom: 0,
          height: '100%',
          zIndex: 1000,
          boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)',
          pointerEvents: 'none'
        }}
      >
        <div 
          className="absolute -top-1.5 -translate-x-[4.5px] w-2 h-2 bg-red-500 rounded-full shadow-lg animate-pulse"
          style={{ 
            zIndex: 1000,
            pointerEvents: 'none'
          }} 
        />
      </div>
    );
  }
  return null;
} 