import React from 'react';
import { Database } from '../../types/supabase';
import { getEventTypeInfo } from '../../utils/eventUtils';
import { FacultyAvatar } from '../FacultyAvatar';

type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface EventContentProps {
  event: Event;
  facultyMember: FacultyMember | null | undefined;
  isFacultyLoading: boolean;
  isHovering: boolean;
}

// Lecture Event Component
function LectureEvent({ event, facultyMember, isHovering }: EventContentProps) {
  const eventNameCopy = event.event_name ? String(event.event_name) : '';
  const dashIndex = eventNameCopy.indexOf('-');
  const baseName = dashIndex !== -1 ? eventNameCopy.substring(0, dashIndex) : eventNameCopy;
  const parts = eventNameCopy.split(' ');
  const thirdPart = parts && parts.length >= 3 ? parts[2] : '';
  
  // Get theme colors for this event
  const { contentBgColor } = getEventTypeInfo(event);
  
  // Calculate avatar tilt
  const getAvatarTilt = (name: string | null | undefined): number => {
    if (!name) return 2;
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return sum % 2 === 0 ? 2 : -2;
  };
  const avatarTilt = getAvatarTilt(event.instructor_name);

  return (
         <div className="flex flex-row bg-[#6b5b95] h-16 w-full rounded absolute inset--0 p-1 transition-all duration-200 ease-in-out">
      {event.instructor_name && (
                 <div 
           className={`flex flex-col items-center justify-center gap-0.5 ${contentBgColor} rounded h-16 z-10 transition-all duration-200 ease-in-out`}
           style={{ transform: `rotate(${avatarTilt}deg)` }}
         >
                    {facultyMember?.kelloggdirectory_image_url ? (
            <FacultyAvatar
              imageUrl={facultyMember.kelloggdirectory_image_url}
              cutoutImageUrl={facultyMember.cutout_image}
              instructorName={event.instructor_name || ''}
              isHovering={isHovering}
              size="md"
            />
          ) : (
            <span className="text-sm transition-all duration-200 ease-in-out" style={{ transform: 'scale(1)' }}>
              👤
            </span>
          )}
                     <span className="text-[10px] leading-tight font-medium opacity-90 text-center whitespace-normal w-16 -mt-0.5 line-clamp-2 transition-all duration-200 ease-in-out">
            {event.instructor_name ? (() => {
              const parts = event.instructor_name.split(',');
              if (parts.length >= 2) {
                return parts[0].trim();
              }
              return event.instructor_name;
            })() : ''}
          </span>
        </div>
      )}

      <div className="flex flex-col min-w-0 pl-1 flex-1 gap-0.5 transition-all duration-200 ease-in-out overflow-hidden">
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
function ExamEvent({ event, isHovering }: EventContentProps) {
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
function LabEvent({ event, isHovering }: EventContentProps) {
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
function DefaultEvent({ event, isHovering }: EventContentProps) {
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
  facultyMember, 
  isFacultyLoading, 
  isHovering 
}: EventContentProps) {
  return (
    <div className="flex gap-2 relative transition-all duration-200 ease-in-out flex-1 min-w-0">
      {event.event_type === 'Lecture' ? (
        <LectureEvent event={event} facultyMember={facultyMember} isFacultyLoading={isFacultyLoading} isHovering={isHovering} />
      ) : event.event_type === 'Exam' ? (
        <ExamEvent event={event} facultyMember={facultyMember} isFacultyLoading={isFacultyLoading} isHovering={isHovering} />
      ) : event.event_type === 'Lab' ? (
        <LabEvent event={event} facultyMember={facultyMember} isFacultyLoading={isFacultyLoading} isHovering={isHovering} />
      ) : (
        <DefaultEvent event={event} facultyMember={facultyMember} isFacultyLoading={isFacultyLoading} isHovering={isHovering} />
      )}
    </div>
  );
} 