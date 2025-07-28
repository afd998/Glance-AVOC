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

// Lecture Event Component
function LectureEvent({ event, facultyMember, isHovering }: EventContentProps) {
  const eventNameCopy = event.event_name ? String(event.event_name) : '';
  const dashIndex = eventNameCopy.indexOf('-');
  const baseName = dashIndex !== -1 ? eventNameCopy.substring(0, dashIndex) : eventNameCopy;
  const parts = eventNameCopy.split(' ');
  const thirdPart = parts && parts.length >= 3 ? parts[2] : '';
  
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
           className="flex flex-col items-center justify-center gap-0.5  bg-[#3d3659] rounded  h-16 z-10 transition-all duration-200 ease-in-out"
           style={{ transform: `rotate(${avatarTilt}deg)` }}
         >
          {facultyMember?.kelloggdirectory_image_url ? (
            <div className="relative transition-all duration-200 ease-in-out">
                             <img 
                 src={facultyMember.kelloggdirectory_image_url} 
                 alt={event.instructor_name}
                 className="h-12 w-12 rounded-full object-cover filter grayscale opacity-80 transition-all duration-200 ease-in-out"
                 style={{ transform: 'scale(1)' }}
                 onError={(e) => {
                   (e.target as HTMLImageElement).style.display = 'none';
                 }}
               />
              <div className="absolute inset-0 rounded-full bg-[#886ec4] mix-blend-overlay opacity-30"></div>
            </div>
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

  return (
    <div className="bg-red-600 rounded h-full transition-all duration-200 ease-in-out min-w-0 overflow-hidden">
      <div className="flex items-center justify-center h-full transition-all duration-200 ease-in-out">
        <span 
          className="text-sm font-medium text-white truncate transition-all duration-200 ease-in-out max-w-full"
          style={{ transform: isHovering ? 'scale(1.1)' : 'scale(1)' }}
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

  return (
    <div className="bg-green-600 rounded h-full transition-all duration-200 ease-in-out min-w-0 overflow-hidden">
      <div className="flex items-center justify-center h-full transition-all duration-200 ease-in-out">
        <span 
          className="text-sm font-medium text-white truncate transition-all duration-200 ease-in-out max-w-full"
          style={{ transform: isHovering ? 'scale(1.1)' : 'scale(1)' }}
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

  return (
    <div className="rounded h-full transition-all duration-200 ease-in-out min-w-0 overflow-hidden">
      <div className="flex items-center justify-center h-full transition-all duration-200 ease-in-out">
        <span 
          className="text-sm font-medium text-white truncate transition-all duration-200 ease-in-out max-w-full"
          style={{ transform: isHovering ? 'scale(1.1)' : 'scale(1)' }}
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