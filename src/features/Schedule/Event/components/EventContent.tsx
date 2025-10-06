import React from 'react';
import { Database } from '../../../../types/supabase';
import { getEventTypeInfo, getEventThemeColors } from '../../../../utils/eventUtils';
import { useEventDurationHours } from '../../hooks/useEvents';
import { FacultyAvatar, MultipleFacultyAvatars } from '../../../../core/faculty/FacultyAvatar';
import { useMultipleFacultyMembers } from '../../../../core/faculty/hooks/useFaculty';


// Helper function to parse instructor names from JSON
const parseInstructorNames = (instructorNamesJson: any): string[] => {
  if (!instructorNamesJson) return [];

  if (Array.isArray(instructorNamesJson)) {
    return instructorNamesJson.filter(name => typeof name === 'string' && name.trim() !== '');
  }

  if (typeof instructorNamesJson === 'string') {
    return [instructorNamesJson];
  }

  return [];
};

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
  isHovering: boolean;
  isMergedRoomEvent?: boolean;
  hasOverduePanoptoChecks?: boolean;
  isOverdueChecksLoading?: boolean;
}

// Lecture Event Component
function LectureEvent({ event, isHovering, isMergedRoomEvent, hasOverduePanoptoChecks, isOverdueChecksLoading }: EventContentProps) {
  // Parse instructor names from JSON field
  const instructorNames = parseInstructorNames(event.instructor_names);
  
  // Get faculty members data
  const { data: facultyMembers, isLoading: isFacultyLoading } = useMultipleFacultyMembers(instructorNames);
  // Get theme colors and truncated event name for this event
  const { truncatedEventName: baseName } = getEventTypeInfo(event);
  const themeColors = getEventThemeColors(event);
  // Special case: Ad Hoc Class Meeting uses same background as main event (themeColors[5])
  // All other event types use themeColors[7] for content background
  const contentBgColor = event.event_type === 'Ad Hoc Class Meeting' 
    ? themeColors[5] 
    : event.event_type === 'Lecture' 
      ? themeColors[4] 
      : themeColors[7];
  const eventNameCopy = event.event_name ? String(event.event_name) : '';
  const parts = eventNameCopy.split(' ');
  const thirdPart = parts && parts.length >= 3 ? parts[2] : '';

  // Get cached event duration in hours
  const { data: eventDurationHours = 0 } = useEventDurationHours(event.id);
  const isShortLecture = event.event_type === 'Lecture' && eventDurationHours < 2;

  // Calculate avatar tilt based on first instructor name
  const getAvatarTilt = (name: string | undefined): number => {
    if (!name) return 2;
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return sum % 2 === 0 ? 2 : -2;
  };
  const avatarTilt = getAvatarTilt(instructorNames[0]);

  // Adjust height for merged room events
  const containerHeight = isMergedRoomEvent ? 'h-full' : 'h-16'; // Use full height for merged events
  const avatarContainerHeight = 'h-16'; // Keep avatar section the same height always
  
  // Dynamic width based on number of faculty
  const getAvatarContainerWidth = () => {
    // Use appropriate width based on faculty count
    if (instructorNames.length <= 1) return 'w-16'; // 64px for single faculty
    if (instructorNames.length === 2) return 'w-24'; // 96px for two faculty
    if (instructorNames.length >= 3) return 'w-28'; // 112px for three or more faculty
    return 'w-16'; // default
  };

  // Find faculty member for first instructor (for single avatar case)
  const firstFacultyMember = facultyMembers?.find(fm =>
    fm.twentyfivelive_name === instructorNames[0]
  );

  return (
         <div className={`flex flex-row ${containerHeight} w-full rounded absolute inset-0 p-1 transition-all duration-200 ease-in-out ${isMergedRoomEvent ? 'items-center' : ''} relative`}>
      {instructorNames.length > 0 && (
                 <div
           className={`flex flex-col items-center justify-center gap-0.5 ${event.event_type === 'Lecture' ? themeColors[6] : ''} rounded ${avatarContainerHeight} ${getAvatarContainerWidth()} z-10 transition-all duration-200 ease-in-out relative shrink-0 -mt-1`}
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
              {instructorNames.slice(0, 3).map((instructorName, index) => {
                const facultyMember = facultyMembers?.find(fm => fm.twentyfivelive_name === instructorName);
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
              {instructorNames.length > 3 && (
                <div
                  className="h-10 w-10 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white font-medium text-sm"
                  title={instructorNames.slice(3).join(', ')}
                >
                  +{instructorNames.length - 3}
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm transition-all duration-200 ease-in-out" style={{ transform: 'scale(1)' }}>
              👤
            </span>
          )}
                     <span className={`leading-tight font-medium opacity-90 text-center whitespace-nowrap w-full -mt-0.5 transition-all duration-200 ease-in-out ${
            (() => {
              const nameToDisplay = instructorNames.length > 0 ? (() => {
                if (instructorNames.length === 1) {
                  const firstName = instructorNames[0];
                  const parts = firstName.split(',');
                  if (parts.length >= 2) {
                    return parts[0].trim();
                  }
                  return firstName;
                } else {
                  // Show first names for the instructors whose avatars are displayed (up to 3)
                  const displayedInstructors = instructorNames.slice(0, 3);
                  return displayedInstructors.map(name => {
                    const parts = name.split(',');
                    return parts.length >= 2 ? parts[0].trim() : name;
                  }).join(', ');
                }
              })() : '';
              return nameToDisplay.length > 12 ? 'text-[8px]' : 'text-[10px]';
            })()
          }`}>
            {instructorNames.length > 0 ? (() => {
              if (instructorNames.length === 1) {
                const firstName = instructorNames[0];
                const parts = firstName.split(',');
                if (parts.length >= 2) {
                  return parts[0].trim();
                }
                return firstName;
              } else {
                // Show first names for the instructors whose avatars are displayed (up to 3)
                const displayedInstructors = instructorNames.slice(0, 3);
                return displayedInstructors.map(name => {
                  const parts = name.split(',');
                  return parts.length >= 2 ? parts[0].trim() : name;
                }).join(', ');
              }
            })() : ''}
          </span>
        </div>
      )}


      <div className={`flex flex-col min-w-0 pl-1 -gap-2 transition-all duration-200 ease-in-out overflow-hidden mt-1 ${isMergedRoomEvent ? 'justify-center' : ''}`}>
        <span
          className="font-medium text-black transition-all duration-200 ease-in-out whitespace-nowrap text-2xl leading-none"
          style={{
            transform: isHovering ? 'scale(1.05)' : 'scale(1)',
            transformOrigin: 'left center',
            fontFamily: "'Kenyan Coffee', sans-serif"
          }}
          title={baseName}
        >
          {baseName}
        </span>
        {thirdPart && (
          <span className="text-[10px] text-gray-400 opacity-90 transition-all duration-200 ease-in-out whitespace-nowrap leading-none">
            Sec: {thirdPart}
          </span>
        )}
        {event.lecture_title && (
          <span
            className="text-xs text-white opacity-80 transition-all duration-200 ease-in-out whitespace-nowrap leading-none"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" }}
            title={event.lecture_title}
          >
            {event.lecture_title}
          </span>
        )}
      </div>
      
    </div>
  );
}


// KEC Executive Luxury Event Component
function KECEvent({ event, isHovering, isMergedRoomEvent, hasOverduePanoptoChecks, isOverdueChecksLoading }: EventContentProps) {
  const { truncatedEventName: eventName } = getEventTypeInfo(event);
  const themeColors = getEventThemeColors(event);

  const getEventHeight = () => {
    if (isMergedRoomEvent) return 'h-full';
    return 'h-16';
  };

  return (
    <div className={`relative ${getEventHeight()} ${isMergedRoomEvent ? 'flex items-center justify-center' : 'flex items-center justify-center'}`}>
      
      <div className={`relative z-10 flex flex-col items-center justify-center h-full px-4 ${isMergedRoomEvent ? 'py-4' : 'pt-0 pb-3'} gap-1`}>
        {/* Main title with luxury gradient */}
        <span
          className="font-bold transition-all duration-400 ease-out block text-center"
          style={{
            transform: isHovering ? 'scale(1.05) translateY(-1px)' : 'scale(1)',
            transformOrigin: 'center',
            fontFamily: "'Morrison', sans-serif",
            fontSize: isMergedRoomEvent ? '1.2rem' : (eventName && eventName.length > 15 ? '0.7rem' : '0.8rem'),
            fontWeight: 700,
            lineHeight: '1.1',
            letterSpacing: '0.4rem',
            textTransform: 'uppercase',
            background: 'linear-gradient(rgb(255, 224, 166), rgb(200, 150, 100))',
            color: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            textShadow: '0 0 20px rgba(255, 224, 166, 0.3)'
          }}
          title={eventName}
        >
          {eventName}
        </span>
        
        {/* Luxury subtitle */}
        <span 
          className="transition-all duration-300 ease-out text-center"
          style={{
            color: '#ffe0a6',
            fontSize: '0.6rem',
            letterSpacing: '0.1rem',
            opacity: 0.8,
            transform: isHovering ? 'scale(1.02)' : 'scale(1)'
          }}
        >
          EXECUTIVE EDUCATION
        </span>
        
        {/* Animated underline */}
        <div 
          className="bg-linear-to-r from-transparent via-yellow-300/80 to-transparent transition-all duration-400 ease-out"
          style={{
            height: '1px',
            width: isHovering ? '90%' : '70%',
            filter: 'drop-shadow(0 0 4px rgba(255, 224, 166, 0.6))',
            animation: isHovering ? 'gentle-glow 1.5s ease-in-out infinite alternate' : 'none'
          }}
        ></div>
      </div>
    </div>
  );
}

// Default Event Component
function DefaultEvent({ event, isHovering, isMergedRoomEvent, hasOverduePanoptoChecks, isOverdueChecksLoading }: EventContentProps) {
  // Parse instructor names from JSON field
  const instructorNames = parseInstructorNames(event.instructor_names);
  
  // Get faculty members data
  const { data: facultyMembers, isLoading: isFacultyLoading } = useMultipleFacultyMembers(instructorNames);
  // Get theme colors, truncated event name, and height flags for this event
  const { truncatedEventName: eventName, isReducedHeightEvent } = getEventTypeInfo(event);
  const themeColors = getEventThemeColors(event);
  // Special case: Ad Hoc Class Meeting uses same background as main event (themeColors[5])
  // All other event types use themeColors[7] for content background
  const contentBgColor = event.event_type === 'Ad Hoc Class Meeting' 
    ? themeColors[5] 
    : event.event_type === 'Lecture' 
      ? themeColors[4] 
      : themeColors[7];

  // Determine height based on event type
  const getEventHeight = () => {
    if (isMergedRoomEvent) return 'h-full'; // Use full height for merged room events
    if (isReducedHeightEvent) {
      // Ad Hoc Class Meeting gets even more reduced height
      if (event.event_type === 'Ad Hoc Class Meeting') return 'h-8'; // 32px for Ad Hoc Class Meeting
      return 'h-10'; // 40px for other reduced height events
    }
    return 'h-12'; // 48px for regular events
  };

  return (
    <div className={`${event.event_type === 'Lecture' ? 'bg-black/30' : ''} rounded transition-all duration-200 ease-in-out min-w-0 overflow-hidden relative ${getEventHeight()} ${
      event.event_type === 'Ad Hoc Class Meeting' ? 'flex items-center' : ''
    } ${isMergedRoomEvent ? 'flex items-center justify-center' : ''}`}>
      <div className={`flex items-start justify-start transition-all duration-200 ease-in-out pl-1 pr-1 ${
        event.event_type === 'Ad Hoc Class Meeting' ? 'py-0' : isMergedRoomEvent ? 'py-2' : 'py-1'
      }`}>
        <span
          className={`text-sm font-medium transition-all duration-200 ease-in-out w-full leading-relaxed ${
            event.event_type === 'Ad Hoc Class Meeting' 
              ? (isHovering ? 'text-gray-900' : 'text-gray-700')
              : event.event_type === 'Lecture'
                ? 'text-white'
                : 'text-gray-900'
          }`}
          style={{
            transform: isHovering ? 'scale(1.02)' : 'scale(1)',
            transformOrigin: 'left top',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
          title={eventName}
        >
          {eventName}
        </span>
      </div>
      
    </div>
  );
}

export default function EventContent({
  event,
  isHovering,
  isMergedRoomEvent,
  hasOverduePanoptoChecks,
  isOverdueChecksLoading
}: EventContentProps) {
  return (
    <div className={`flex gap-2 relative transition-all duration-200 ease-in-out flex-1 ${event.event_type === 'KEC' ? 'w-full justify-center' : 'min-w-0'} ${isMergedRoomEvent ? 'h-full pt-6' : ''}`}>
      {event.event_type === 'Lecture' ? (
        <LectureEvent event={event} isHovering={isHovering} isMergedRoomEvent={isMergedRoomEvent} hasOverduePanoptoChecks={hasOverduePanoptoChecks} isOverdueChecksLoading={isOverdueChecksLoading} />
      ) : event.event_type === 'KEC' ? (
        <KECEvent event={event} isHovering={isHovering} isMergedRoomEvent={isMergedRoomEvent} hasOverduePanoptoChecks={hasOverduePanoptoChecks} isOverdueChecksLoading={isOverdueChecksLoading} />
      ) : (
        <DefaultEvent event={event} isHovering={isHovering} isMergedRoomEvent={isMergedRoomEvent} hasOverduePanoptoChecks={hasOverduePanoptoChecks} isOverdueChecksLoading={isOverdueChecksLoading} />
      )}
    </div>
  );
} 