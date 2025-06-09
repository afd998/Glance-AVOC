import React from 'react';

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
    <div className=" flex gap-2 relative">
      {isLecture ? (
        // Lecture event layout
        <div className="flex flex-row bg-[#6b5b95] h-16 w-full rounded absolute inset-0 p-1">
          {instructorName && (
            <div className="flex flex-col items-center justify-center gap-0.5 py-0.5 bg-[#3d3659] rounded p-1 h-14 z-10">
              {facultyMember?.imageUrl ? (
                <div className="relative">
                  <img 
                    src={facultyMember.imageUrl} 
                    alt={instructorName}
                    className="h-8 w-8 rounded-full object-cover filter grayscale opacity-80"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 rounded-full bg-[#886ec4] mix-blend-overlay opacity-30"></div>
                </div>
              ) : (
                <span className="text-sm">👤</span>
              )}
              <span className="text-[10px] leading-tight font-medium opacity-90 text-center whitespace-normal w-16 -mt-0.5 line-clamp-2">{instructorName}</span>
            </div>
          )}

          <div className="flex flex-col min-w-0 pl-1 flex-1 gap-0.5">
            <div className="flex items-center">
              <span className="text-xs text-white mr-1">{departmentCode}</span>
              <span className="truncate font-medium text-white">
                {mainEventName}
                {additionalInfo && (
                  <span className="text-xs text-gray-400 ml-1">{additionalInfo}</span>
                )}
              </span>
            </div>
            {lectureTitle && (
              <span className="text-[11px] text-white opacity-90 whitespace-normal break-words leading-tight">{lectureTitle}</span>
            )}
          </div>
        </div>
      ) : event.eventType === 'Exam' ? (
        // Exam event layout
        <div className="absolute inset-0 bg-red-600 rounded p-1.5">
          <div className="flex items-center justify-center h-full">
            <span className="text-sm font-medium text-white truncate px-2">{mainEventName}</span>
          </div>
        </div>
      ) : event.eventType === 'Lab' ? (
        // Lab event layout
        <div className="absolute inset-0 bg-green-600 rounded p-1.5">
          <div className="flex items-center justify-center h-full">
            <span className="text-sm font-medium text-white truncate px-2">{mainEventName}</span>
          </div>
        </div>
      ) : (
        // Default event layout (no background)
        <div className="absolute inset-0 rounded p-1.5">
          <div className="flex items-center justify-center h-full">
            <span className="text-sm font-medium text-white truncate px-2">{mainEventName}</span>
          </div>
        </div>
      )}
    </div>
  );
} 