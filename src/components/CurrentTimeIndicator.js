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
        className="absolute w-0.5 bg-red-500 z-20"
        style={{ 
          left: currentPosition,
          animation: 'pulse 2s infinite',
          top: 0,
          bottom: 0,
          height: '100%'
        }}
      >
        <div className="absolute -top-1.5 -translate-x-[4.5px] w-3 h-3 bg-red-500 rounded-full" />
      </div>
    );
  }
  return null;
} 