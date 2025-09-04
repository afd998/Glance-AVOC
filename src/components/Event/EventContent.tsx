import React from 'react';
import { Database } from '../../types/supabase';
import { getEventTypeInfo } from '../../utils/eventUtils';
import { FacultyAvatar, MultipleFacultyAvatars } from '../FacultyAvatar';

// Helper function to extract last names from instructor names
const extractLastNames = (instructorNames: string[]): string => {
  return instructorNames.map(name => {
    // Split by space and get the last part (assuming it's the last name)
    const nameParts = name.trim().split(' ');
    return nameParts[nameParts.length - 1];
  }).join(', ');
};

type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface EventContentProps {
  event: Event;
  facultyMembers: FacultyMember[];
  instructorNames: string[];
  isFacultyLoading: boolean;
  isHovering: boolean;
  isMergedRoomEvent?: boolean;
}

// Lecture Event Component
function LectureEvent({ event, facultyMembers, instructorNames, isHovering, isMergedRoomEvent }: EventContentProps) {
  const eventNameCopy = event.event_name ? String(event.event_name) : '';
  const dashIndex = eventNameCopy.indexOf('-');
  const baseName = dashIndex !== -1 ? eventNameCopy.substring(0, dashIndex) : eventNameCopy;
  const parts = eventNameCopy.split(' ');
  const thirdPart = parts && parts.length >= 3 ? parts[2] : '';

  // Get theme colors for this event
  const { contentBgColor } = getEventTypeInfo(event);

  // Calculate avatar tilt based on first instructor name
  const getAvatarTilt = (name: string | undefined): number => {
    if (!name) return 2;
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return sum % 2 === 0 ? 2 : -2;
  };
  const avatarTilt = getAvatarTilt(instructorNames[0]);

  // Adjust height for merged room events
  const containerHeight = isMergedRoomEvent ? 'h-40' : 'h-16'; // h-40 = 160px for merged events
  const avatarContainerHeight = 'h-16'; // Keep avatar section the same height always

  // Find faculty member for first instructor (for single avatar case)
  const firstFacultyMember = facultyMembers.find(fm =>
    fm.twentyfivelive_name === instructorNames[0]
  );

  return (
         <div className={`flex flex-row bg-[#6b5b95] ${containerHeight} w-full rounded absolute inset--0 p-1 transition-all duration-200 ease-in-out ${isMergedRoomEvent ? 'items-center' : ''}`}>
      {instructorNames.length > 0 && (
                 <div
           className={`flex flex-col items-center justify-center gap-0.5 ${contentBgColor} rounded ${avatarContainerHeight} z-10 transition-all duration-200 ease-in-out`}
           style={{ transform: `rotate(${avatarTilt}deg)` }}
         >
                    {instructorNames.length === 1 && firstFacultyMember?.kelloggdirectory_image_url ? (
            <FacultyAvatar
              imageUrl={firstFacultyMember.kelloggdirectory_image_url}
              cutoutImageUrl={firstFacultyMember.cutout_image}
              instructorName={instructorNames[0]}
              isHovering={isHovering}
              size="md"
            />
          ) : instructorNames.length > 1 ? (
            <div className="flex -space-x-2">
              {instructorNames.slice(0, 2).map((instructorName, index) => {
                const facultyMember = facultyMembers.find(fm => fm.twentyfivelive_name === instructorName);
                return (
                  <FacultyAvatar
                    key={`${instructorName}-${index}`}
                    imageUrl={facultyMember?.kelloggdirectory_image_url || ''}
                    cutoutImageUrl={facultyMember?.cutout_image}
                    instructorName={instructorName}
                    isHovering={isHovering}
                    size="md"
                    className="h-10 w-10"
                  />
                );
              })}
              {instructorNames.length > 2 && (
                <div
                  className="h-10 w-10 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white font-medium text-sm"
                  title={instructorNames.slice(2).join(', ')}
                >
                  +{instructorNames.length - 2}
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm transition-all duration-200 ease-in-out" style={{ transform: 'scale(1)' }}>
              👤
            </span>
          )}
                     <span className="text-[10px] leading-tight font-medium opacity-90 text-center whitespace-normal w-16 -mt-0.5 line-clamp-2 transition-all duration-200 ease-in-out">
            {instructorNames.length > 0 ? (() => {
              if (instructorNames.length === 1) {
                const firstName = instructorNames[0];
                const parts = firstName.split(',');
                if (parts.length >= 2) {
                  return parts[0].trim();
                }
                return firstName;
              } else {
                return extractLastNames(instructorNames);
              }
            })() : ''}
          </span>
        </div>
      )}

      <div className={`flex flex-col min-w-0 pl-1 flex-1 gap-0.5 transition-all duration-200 ease-in-out overflow-hidden ${isMergedRoomEvent ? 'justify-center' : ''}`}>
        <span
          className="truncate font-medium text-white transition-all duration-200 ease-in-out max-w-full"
          style={{
            transform: isHovering ? 'scale(1.05)' : 'scale(1)',
            transformOrigin: 'left center'
          }}
          title={baseName}
        >
          {baseName}
        </span>
        {thirdPart && (
          <span className="text-xs text-white opacity-90 transition-all duration-200 ease-in-out">
            Sec: {thirdPart}
          </span>
        )}
        {event.lecture_title && (
          <span
            className="text-[10px] text-white opacity-80 truncate leading-tight transition-all duration-200 ease-in-out max-w-full"
            title={event.lecture_title}
          >
            {event.lecture_title}
          </span>
        )}
      </div>
    </div>
  );
}

// Exam Event Component
function ExamEvent({ event, facultyMembers, instructorNames, isHovering, isMergedRoomEvent }: EventContentProps) {
  const eventNameCopy = event.event_name ? String(event.event_name) : '';
  const dashIndex = eventNameCopy.indexOf('-');
  const mainEventName = dashIndex !== -1 ? eventNameCopy.substring(0, dashIndex) : eventNameCopy;
  
  // Get theme colors for this event
  const { contentBgColor } = getEventTypeInfo(event);
  
  // Dynamic padding - exams are usually single line
  const paddingY = 'py-1';

  return (
    <div className={`${contentBgColor} rounded transition-all duration-200 ease-in-out min-w-0 overflow-hidden`}>
      <div className={`flex items-center justify-start transition-all duration-200 ease-in-out pl-1 pr-1 ${paddingY}`}>
        <span 
          className="text-sm font-medium text-white transition-all duration-200 ease-in-out truncate w-full"
          style={{ 
            transform: isHovering ? 'scale(1.02)' : 'scale(1)',
            transformOrigin: 'left center'
          }}
          title={mainEventName}
        >
          {mainEventName}
        </span>
      </div>
    </div>
  );
}

// Lab Event Component
function LabEvent({ event, facultyMembers, instructorNames, isHovering, isMergedRoomEvent }: EventContentProps) {
  const eventNameCopy = event.event_name ? String(event.event_name) : '';
  const dashIndex = eventNameCopy.indexOf('-');
  const mainEventName = dashIndex !== -1 ? eventNameCopy.substring(0, dashIndex) : eventNameCopy;
  
  // Get theme colors for this event
  const { contentBgColor } = getEventTypeInfo(event);
  
  // Dynamic padding - labs are usually single line
  const paddingY = 'py-1';

  return (
    <div className={`${contentBgColor} rounded transition-all duration-200 ease-in-out min-w-0 overflow-hidden`}>
      <div className={`flex items-center justify-start transition-all duration-200 ease-in-out pl-1 pr-1 ${paddingY}`}>
        <span 
          className="text-sm font-medium text-white transition-all duration-200 ease-in-out truncate w-full"
          style={{ 
            transform: isHovering ? 'scale(1.02)' : 'scale(1)',
            transformOrigin: 'left center'
          }}
          title={mainEventName}
        >
          {mainEventName}
        </span>
      </div>
    </div>
  );
}



// Default Event Component
function DefaultEvent({ event, facultyMembers, instructorNames, isHovering, isMergedRoomEvent }: EventContentProps) {
  const eventNameCopy = event.event_name ? String(event.event_name) : '';
  const dashIndex = eventNameCopy.indexOf('-');
  const mainEventName = dashIndex !== -1 ? eventNameCopy.substring(0, dashIndex) : eventNameCopy;
  
  // Get theme colors for this event
  const { contentBgColor } = getEventTypeInfo(event);
  
  // Estimate number of lines based on text length and typical character width
  const estimatedLineCount = Math.ceil(mainEventName.length / 25); // Rough estimate: 25 chars per line
  const actualLineCount = Math.min(estimatedLineCount, 3); // Max 3 lines as per WebkitLineClamp
  
  // Dynamic padding based on line count
  const paddingY = actualLineCount === 1 ? 'py-1' : actualLineCount === 2 ? 'py-0.5' : 'py-0.5';

  return (
    <div className={`${contentBgColor} rounded transition-all duration-200 ease-in-out min-w-0 overflow-hidden`}>
      <div className={`flex items-center justify-start transition-all duration-200 ease-in-out pl-1 pr-1 ${paddingY}`}>
        <span 
          className="text-sm font-medium text-white transition-all duration-200 ease-in-out w-full leading-tight break-words whitespace-normal"
          style={{ 
            transform: isHovering ? 'scale(1.02)' : 'scale(1)',
            transformOrigin: 'left center',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
          title={mainEventName}
        >
          {mainEventName}
        </span>
      </div>
    </div>
  );
}

export default function EventContent({
  event,
  facultyMembers,
  instructorNames,
  isFacultyLoading,
  isHovering,
  isMergedRoomEvent
}: EventContentProps) {
  return (
    <div className="flex gap-2 relative transition-all duration-200 ease-in-out flex-1 min-w-0">
      {event.event_type === 'Lecture' ? (
        <LectureEvent event={event} facultyMembers={facultyMembers} instructorNames={instructorNames} isFacultyLoading={isFacultyLoading} isHovering={isHovering} isMergedRoomEvent={isMergedRoomEvent} />
      ) : event.event_type === 'Exam' ? (
        <ExamEvent event={event} facultyMembers={facultyMembers} instructorNames={instructorNames} isFacultyLoading={isFacultyLoading} isHovering={isHovering} isMergedRoomEvent={isMergedRoomEvent} />
      ) : event.event_type === 'Lab' ? (
        <LabEvent event={event} facultyMembers={facultyMembers} instructorNames={instructorNames} isFacultyLoading={isFacultyLoading} isHovering={isHovering} isMergedRoomEvent={isMergedRoomEvent} />
      ) : (
        <DefaultEvent event={event} facultyMembers={facultyMembers} instructorNames={instructorNames} isFacultyLoading={isFacultyLoading} isHovering={isHovering} isMergedRoomEvent={isMergedRoomEvent} />
      )}
    </div>
  );
} 