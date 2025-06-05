import React from 'react';
import DepartmentTag from './DepartmentTag';

export default function EventContent({ 
  event, 
  lectureTitle, 
  instructorName, 
  facultyMember 
}) {
  // Extract department code from event name (first 4 characters)
  const departmentCode = event.itemName?.substring(0, 4);
  
  // For lecture events, split the name and handle the last two parts
  const isLecture = event.eventType === 'Lecture';
  let mainEventName, additionalInfo;
  
  if (isLecture) {
    const parts = event.itemName?.substring(4).split(' ');
    if (parts && parts.length >= 2) {
      // Get the last two parts
      const lastTwoParts = parts.slice(-2).join(' ');
      // Get everything except the last two parts
      mainEventName = parts.slice(0, -2).join(' ');
      additionalInfo = lastTwoParts;
    } else {
      mainEventName = event.itemName?.substring(4);
    }
  } else {
    mainEventName = event.itemName;
  }

  return (
    <div className="flex gap-2 mt-0.5">
      {instructorName && facultyMember?.imageUrl && (
        <img 
          src={facultyMember.imageUrl} 
          alt={instructorName}
          className="h-10 w-10 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center">
          {isLecture && <DepartmentTag code={departmentCode} />}
          <span className="truncate font-medium">
            {mainEventName}
            {isLecture && additionalInfo && (
              <span className="text-xs text-gray-400 ml-1">{additionalInfo}</span>
            )}
          </span>
        </div>
        {lectureTitle && (
          <span className="text-xs opacity-90 truncate">{lectureTitle}</span>
        )}
        {instructorName && (
          <div className="flex items-center gap-1">
            {!facultyMember?.imageUrl && (
              <span className="text-sm">👤</span>
            )}
            <span className="text-xs font-medium opacity-90 truncate">{instructorName}</span>
          </div>
        )}
      </div>
    </div>
  );
} 