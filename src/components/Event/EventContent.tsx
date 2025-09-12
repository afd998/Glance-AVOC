import React from 'react';
import { Database } from '../../types/supabase';
import { getEventTypeInfo, getEventThemeColors } from '../../utils/eventUtils';
import { FacultyAvatar, MultipleFacultyAvatars } from '../FacultyAvatar';
import { SpeechBubble } from '../SpeechBubble';

// Configuration variable to enable/disable speech bubble effect
const SPEECH_BUBBLE_ENABLED = false;

// Helper function to extract last names from instructor names
const extractLastNames = (instructorNames: string[]): string => {
  return instructorNames.map(name => {
    // Split by space and get the last part (assuming it's the last name)
    const nameParts = name.trim().split(' ');
    return nameParts[nameParts.length - 1];
  }).join(', ');
};

// Helper function to get random Panopto messages
const getRandomPanoptoMessage = (eventId: number): string => {
  const messages = [
    "My recording hasnt been checked in a while",
    "Someone should check my recording!",
    "Is my recording working?",
    "Can someone verify my recording?",
    "My recording might need attention",
    "Please check if my recording is okay",
    "I'm worried about my recording",
    "Has anyone checked my recording lately?",
    "My recording needs to be verified",
    "Could someone look at my recording?",
    "I think my recording needs checking",
    "Is my recording still working properly?",
    "Someone should verify my recording",
    "My recording might be having issues",
    "Can we check my recording status?",
    "I'm concerned about my recording",
    "Has my recording been checked today?",
    "My recording needs attention",
    "Please verify my recording is working",
    "I need someone to check my recording"
  ];
  
  // Use eventId to get a consistent message for each event
  const randomIndex = eventId % messages.length;
  return messages[randomIndex];
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
  hasOverduePanoptoChecks?: boolean;
  isOverdueChecksLoading?: boolean;
}

// Lecture Event Component
function LectureEvent({ event, facultyMembers, instructorNames, isHovering, isMergedRoomEvent, hasOverduePanoptoChecks, isOverdueChecksLoading }: EventContentProps) {
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

  // Calculate event duration in hours
  const getEventDurationHours = () => {
    if (!event.start_time || !event.end_time) return 0;
    try {
      const [startHours, startMinutes] = event.start_time.split(':').map(Number);
      const [endHours, endMinutes] = event.end_time.split(':').map(Number);
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      const durationMinutes = endTotalMinutes - startTotalMinutes;
      return durationMinutes / 60; // Convert to hours
    } catch (error) {
      return 0;
    }
  };

  const eventDurationHours = getEventDurationHours();
  const isShortLecture = event.event_type === 'Lecture' && eventDurationHours < 2;

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
  
  // Dynamic width based on number of faculty
  const getAvatarContainerWidth = () => {
    if (instructorNames.length === 1) return 'w-20'; // 80px for single faculty
    if (instructorNames.length === 2) return 'w-28'; // 112px for two faculty
    if (instructorNames.length >= 3) return 'w-32'; // 128px for three or more faculty
    return 'w-20'; // default
  };

  // Find faculty member for first instructor (for single avatar case)
  const firstFacultyMember = facultyMembers.find(fm =>
    fm.twentyfivelive_name === instructorNames[0]
  );

  return (
         <div className={`flex flex-row ${event.event_type === 'Lecture' ? '' : themeColors[6]} ${containerHeight} w-full rounded absolute inset--0 p-1 transition-all duration-200 ease-in-out ${isMergedRoomEvent ? 'items-center' : ''} relative`}>
      {instructorNames.length > 0 && (
                 <div
           className={`flex flex-col items-center justify-center gap-0.5 ${event.event_type === 'Lecture' ? themeColors[6] : contentBgColor} rounded ${avatarContainerHeight} ${getAvatarContainerWidth()} z-10 transition-all duration-200 ease-in-out relative ${event.event_type === 'Lecture' ? 'shadow-2xl' : ''}`}
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
                     <span className="text-[10px] leading-tight font-medium opacity-90 text-center whitespace-nowrap w-full -mt-0.5 transition-all duration-200 ease-in-out">
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

      {/* Speech bubble for overdue Panopto checks - positioned outside tilted container */}
      {SPEECH_BUBBLE_ENABLED && hasOverduePanoptoChecks && !isOverdueChecksLoading && instructorNames.length > 0 && (
        <SpeechBubble
          message={getRandomPanoptoMessage(event.id)}
          isVisible={true}
          className="-top-10 left-8"
        />
      )}

      <div className={`flex flex-col min-w-0 pl-1 -gap-2 transition-all duration-200 ease-in-out overflow-hidden ${isMergedRoomEvent ? 'justify-center' : ''}`}>
        <span
          className="font-medium text-black transition-all duration-200 ease-in-out whitespace-nowrap text-3xl leading-none"
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
          <span className="text-xs text-white opacity-90 transition-all duration-200 ease-in-out whitespace-nowrap leading-none">
            Sec: {thirdPart}
          </span>
        )}
        {event.lecture_title && (
          <span
            className="text-[10px] text-white opacity-80 transition-all duration-200 ease-in-out whitespace-nowrap leading-none"
            title={event.lecture_title}
          >
            {event.lecture_title}
          </span>
        )}
      </div>
      
    </div>
  );
}


// Default Event Component
function DefaultEvent({ event, facultyMembers, instructorNames, isHovering, isMergedRoomEvent, hasOverduePanoptoChecks, isOverdueChecksLoading }: EventContentProps) {
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
    if (isMergedRoomEvent) return 'h-30'; // 80px for merged room events
    if (isReducedHeightEvent) {
      // Ad Hoc Class Meeting gets even more reduced height
      if (event.event_type === 'Ad Hoc Class Meeting') return 'h-8'; // 32px for Ad Hoc Class Meeting
      return 'h-10'; // 40px for other reduced height events
    }
    return 'h-12'; // 48px for regular events
  };

  return (
    <div className={`${event.event_type === 'Ad Hoc Class Meeting' ? '' : event.event_type === 'Lecture' ? 'bg-black bg-opacity-30' : contentBgColor} rounded transition-all duration-200 ease-in-out min-w-0 overflow-hidden ${getEventHeight()} relative ${
      event.event_type === 'Ad Hoc Class Meeting' ? 'flex items-center' : ''
    }`}>
      <div className={`flex items-center justify-start transition-all duration-200 ease-in-out pl-1 pr-1 ${
        event.event_type === 'Ad Hoc Class Meeting' ? 'py-0 h-full' : 'py-1 h-full'
      }`}>
        <span
          className={`text-sm font-medium transition-all duration-200 ease-in-out w-full leading-tight truncate whitespace-nowrap ${
            event.event_type === 'Ad Hoc Class Meeting' 
              ? (isHovering ? 'text-white' : 'text-gray-600')
              : 'text-white'
          }`}
          style={{
            transform: isHovering ? 'scale(1.02)' : 'scale(1)',
            transformOrigin: 'left center'
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
  facultyMembers,
  instructorNames,
  isFacultyLoading,
  isHovering,
  isMergedRoomEvent,
  hasOverduePanoptoChecks,
  isOverdueChecksLoading
}: EventContentProps) {
  return (
    <div className="flex gap-2 relative transition-all duration-200 ease-in-out flex-1 min-w-0">
      {event.event_type === 'Lecture' ? (
        <LectureEvent event={event} facultyMembers={facultyMembers} instructorNames={instructorNames} isFacultyLoading={isFacultyLoading} isHovering={isHovering} isMergedRoomEvent={isMergedRoomEvent} hasOverduePanoptoChecks={hasOverduePanoptoChecks} isOverdueChecksLoading={isOverdueChecksLoading} />
      ) : (
        <DefaultEvent event={event} facultyMembers={facultyMembers} instructorNames={instructorNames} isFacultyLoading={isFacultyLoading} isHovering={isHovering} isMergedRoomEvent={isMergedRoomEvent} hasOverduePanoptoChecks={hasOverduePanoptoChecks} isOverdueChecksLoading={isOverdueChecksLoading} />
      )}
    </div>
  );
} 