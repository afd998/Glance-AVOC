import React from 'react';
import { Database } from '../../types/supabase';
import { getEventTypeInfo } from '../../utils/eventUtils';

type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface EventContentProps {
  event: Event;
  facultyMember: FacultyMember | null | undefined;
  isFacultyLoading: boolean;
  isHovering: boolean;
}

export default function EventContent({ 
  event, 
  facultyMember, 
  isFacultyLoading, 
  isHovering 
}: EventContentProps) {
  // Extract department code from event name (first 4 characters)
  const departmentCode = event.event_name?.substring(0, 4);
  
  // For lecture events, split the name and handle the last two parts
  const isLecture = event.event_type === 'Lecture';
  let mainEventName, additionalInfo;
  
  if (isLecture) {
    const parts = event.event_name?.substring(4).split(' ');
    if (parts && parts.length >= 2) {
      // Get the last two parts
      const lastTwoParts = parts.slice(-2).join(' ');
      // Get everything except the last two parts
      mainEventName = parts.slice(0, -2).join(' ');
      additionalInfo = lastTwoParts;
    } else {
      mainEventName = event.event_name?.substring(4);
    }
  } else {
    mainEventName = event.event_name;
  }

  // Get event type info for background color
  const { bgColor } = getEventTypeInfo(event);

  // Generate a deterministic random tilt (+2 or -2 degrees) based on instructorName
  function getDeterministicTilt(name: string | null) {
    if (!name) return 2;
    // Simple hash: sum char codes, even = +2, odd = -2
    const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return sum % 2 === 0 ? 2 : -2;
  }
  const avatarTilt = getDeterministicTilt(event.instructor_name);

  // Generate a consistent but varied rotation based on instructor name (for the whole card, not used for avatar now)
  const getRotationAngle = (name: string | null) => {
    if (!name) return 0;
    const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return (charSum % 17) - 8; // Range from -8 to 8 degrees
  };
  const rotationAngle = getRotationAngle(event.instructor_name);

  return (
    <div className="flex gap-2 relative transition-all duration-200 ease-in-out">
      {isLecture ? (
        // Lecture event layout
        <div className="flex flex-row bg-[#6b5b95] h-16 w-full rounded absolute inset-0 p-1 transition-all duration-200 ease-in-out">
          {event.instructor_name && (
            <div 
              className="flex flex-col items-center justify-center gap-0.5 py-0.5 bg-[#3d3659] rounded p-1 h-16 z-10 transition-all duration-200 ease-in-out"
              style={{
                transform: `rotate(${avatarTilt}deg)`
              }}
            >
              {facultyMember?.kelloggdirectory_image_url ? (
                <div className="relative transition-all duration-200 ease-in-out">
                  <img 
                    src={facultyMember.kelloggdirectory_image_url} 
                    alt={event.instructor_name}
                    className="h-8 w-8 rounded-full object-cover filter grayscale opacity-80 transition-all duration-200 ease-in-out"
                    style={{
                      transform: 'scale(1)'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 rounded-full bg-[#886ec4] mix-blend-overlay opacity-30"></div>
                </div>
              ) : (
                <span 
                  className="text-sm transition-all duration-200 ease-in-out"
                  style={{
                    transform: 'scale(1)'
                  }}
                >
                  👤
                </span>
              )}
              <span 
                className="text-[10px] leading-tight font-medium opacity-90 text-center whitespace-normal w-16 -mt-0.5 line-clamp-2 transition-all duration-200 ease-in-out"
              >
                {event.instructor_name}
              </span>
            </div>
          )}

          <div className="flex flex-col min-w-0 pl-1 flex-1 gap-0.5 transition-all duration-200 ease-in-out">
            <div className="flex items-center transition-all duration-200 ease-in-out">
              <span 
                className="text-xs text-white mr-1 transition-all duration-200 ease-in-out"
                style={{
                  transform: isHovering ? 'scale(1.1)' : 'scale(1)',
                  transformOrigin: 'left center'
                }}
              >
                {departmentCode}
              </span>
              <span 
                className="truncate font-medium text-white transition-all duration-200 ease-in-out"
                style={{
                  transform: isHovering ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'left center'
                }}
              >
                {mainEventName}
                {additionalInfo && (
                  <span 
                    className="text-xs text-gray-400 ml-1 transition-all duration-200 ease-in-out"
                  >
                    {additionalInfo}
                  </span>
                )}
              </span>
            </div>
            {event.lecture_title && (
              <span 
                className="text-[11px] text-white opacity-90 whitespace-normal break-words leading-tight transition-all duration-200 ease-in-out"
              >
                {event.lecture_title}
              </span>
            )}
          </div>
        </div>
      ) : event.event_type === 'Exam' ? (
        // Exam event layout
        <div className="absolute inset-0 bg-red-600 rounded p-1.5 transition-all duration-200 ease-in-out">
          <div className="flex items-center justify-center h-full transition-all duration-200 ease-in-out">
            <span 
              className="text-sm font-medium text-white truncate px-2 transition-all duration-200 ease-in-out"
              style={{
                transform: isHovering ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {mainEventName}
            </span>
          </div>
        </div>
      ) : event.event_type === 'Lab' ? (
        // Lab event layout
        <div className="absolute inset-0 bg-green-600 rounded p-1.5 transition-all duration-200 ease-in-out">
          <div className="flex items-center justify-center h-full transition-all duration-200 ease-in-out">
            <span 
              className="text-sm font-medium text-white truncate px-2 transition-all duration-200 ease-in-out"
              style={{
                transform: isHovering ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {mainEventName}
            </span>
          </div>
        </div>
      ) : (
        // Default event layout (no background)
        <div className="absolute inset-0 rounded p-1.5 transition-all duration-200 ease-in-out">
          <div className="flex items-center justify-center h-full transition-all duration-200 ease-in-out">
            <span 
              className="text-sm font-medium text-white truncate px-2 transition-all duration-200 ease-in-out"
              style={{
                transform: isHovering ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {mainEventName}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 