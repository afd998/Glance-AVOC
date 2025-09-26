import React, { useState, useEffect, useRef } from 'react';

export default function CurrentTimeIndicator({ startHour, endHour, pixelsPerMinute }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const currentTimeRef = useRef(new Date());

  useEffect(() => {
    // Initial time set
    const now = new Date();
    currentTimeRef.current = now;
    setCurrentTime(now);
    
    // Update every 30 seconds for more responsive indicator
    const timer = setInterval(() => {
      const newTime = new Date();
      currentTimeRef.current = newTime;
      setCurrentTime(newTime);
    }, 30000);
    return () => { clearInterval(timer); };
  }, []);
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
            left: `${currentPosition - 6}px`, // Offset by half the triangle width (12px / 2 = 6px)
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '8px solid #ef4444', // red-500 - red triangle
            filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 16px rgba(239, 68, 68, 0.4))',
            zIndex: 1001,
            position: 'absolute',
            pointerEvents: 'none'
          }}
        />
        
        {/* Vertical line */}
        <div
          className="w-px  bg-red-500 animate-pulse "
          style={{ 
            position: 'absolute',
            left: `${currentPosition}px`,
            top: '10px', // Start below the playhead
            height: 'calc(100% - 10px)', // Extend to bottom of container minus top offset
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.8), 0 0 16px rgba(239, 68, 68, 0.4), 0 0 24px rgba(239, 68, 68, 0.2)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        />
      </>
    );
  }
  return null;
} 