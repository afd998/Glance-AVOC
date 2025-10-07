import React from 'react';
import { Separator } from '../../../components/ui/separator';

export default function TimeGrid({pageZoom, startHour, endHour, pixelsPerMinute, sticky = true }) {
  
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
         className="absolute text-foreground text-center text-xs font-bold px-2 transition-all duration-200 ease-in-out"
         style={{ 
           left: `${left}px`,
           top: '-12px', // Adjust top position to center the scaled text
           zIndex: 53,
           height: '48px', // Give enough height for the scaled text
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center'
         }}
       >
        <span style={{ transform: `scaleY(${1/pageZoom})` }}> {formatHour(hour)}</span>
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
      <Separator 
        key={i}
        orientation="vertical"
        className="absolute top-1 h-4 transition-all duration-200 ease-in-out"
        style={{ 
          left: `${left}px`,
          zIndex: 70
        }}
      />
    );
  }).filter(Boolean);

  const baseProps = {
    className: `${sticky ? 'sticky top-0' : ''} w-full h-6 bg-background/50  border-b z-50 flex items-center relative overflow-hidden`,
    style: { zIndex: 60, opacity: 1.0 }
  };

  return (
    <div {...baseProps}>
      {hourLabels}
      {shortVerticalLines}
    </div>
  );
} 