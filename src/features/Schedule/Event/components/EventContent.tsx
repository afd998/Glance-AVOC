import React from 'react';
import { Database } from '../../../../types/supabase';
import { getEventTypeInfo, getEventThemeColors } from '../../../../utils/eventUtils';
import { useEventDurationHours } from '../../hooks/useEvents';
import { FacultyAvatar, MultipleFacultyAvatars } from '../../../../core/faculty/FacultyAvatar';
import { useMultipleFacultyMembers } from '../../../../core/faculty/hooks/useFaculty';
import { useOrganization } from '../../../../hooks/useOrganization';
import { Item, ItemContent, ItemMedia, ItemTitle } from '../../../../components/ui/item';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { cn } from '../../../../lib/utils';
import { useProfile } from '../../../../core/User/useProfile';

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
  organization?: any;
}

// Lecture Event Component
function LectureEvent({ event, isHovering, isMergedRoomEvent, hasOverduePanoptoChecks, isOverdueChecksLoading, organization }: EventContentProps) {
  // Parse instructor names from JSON field
  const instructorNames = parseInstructorNames(event.instructor_names);
  const { profile, rowHeightPx  } = useProfile();
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
      {instructorNames.length > 0 && rowHeightPx > 96 && (
                 <div
           className={`flex flex-col items-center justify-center gap-0.5 ${event.event_type === 'Lecture' ? themeColors[6] : ''} rounded ${avatarContainerHeight} ${getAvatarContainerWidth()} z-10 transition-all duration-200 ease-in-out relative shrink-0 -mt-1`}
           style={{ transform: `otate(${avatarTilt}deg)` }}
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

{rowHeightPx > 90 && (
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
    )}
    {rowHeightPx <= 90 && (
      <div className="flex flex-col min-w-0 pl-1 -gap-2 transition-all duration-200 ease-in-out overflow-hidden  ${isMergedRoomEvent ? 'justify-center' : ''}">
        <span className="font-medium text-black transition-all duration-200 ease-in-out whitespace-nowrap text-md leading-none">
          {event.event_name}
        </span>
        
      </div>
    
    )}
   
   
    </div>
  );
}


// KEC Executive Luxury Event Component
function KECEvent({ event, isHovering, isMergedRoomEvent, hasOverduePanoptoChecks, isOverdueChecksLoading, organization }: EventContentProps) {
  const { truncatedEventName: eventName } = getEventTypeInfo(event);
  const themeColors = getEventThemeColors(event);
  const { profile, rowHeightPx  } = useProfile();
  const getEventHeight = () => {
    if (isMergedRoomEvent) return 'h-full';
    return 'h-16';
  };

  return (
    <Item 
      className={cn(
        "relative border-0 shadow-none bg-transparent py-0 my-0",
        getEventHeight(),
        isMergedRoomEvent ? 'flex items-center justify-center' : 'flex items-center justify-center'
      )}
    >
      <ItemContent className={cn(
        "relative z-10 flex flex-col items-start justify-center h-full px-4 gap-1  my-0 py-0",
        isMergedRoomEvent ? 'py-4' : 'pt-0 pb-3'
      )}>
        {/* Main title */}
        <div
          className={`py-0 ${rowHeightPx <90 ? "-mt-7": ""} font-bold text-left`}
          style={{
            fontSize: isMergedRoomEvent ? '1.2rem' : (eventName && eventName.length > 15 ? '0.7rem' : '0.8rem'),
            color: '#B8860B'
          }}
          title={eventName}
        >
          {eventName}
        </div>
        
        {/* Subtitle */}
        <Badge 
          variant="secondary"
          className="text-left bg-transparent border-0 py-0 h-auto text-xs"
          style={{ color: '#DAA520' }}
        >
          EXECUTIVE EDUCATION
        </Badge>
      </ItemContent>
    </Item>
  );
}

// Default Event Component
function DefaultEvent({ event, isHovering, isMergedRoomEvent, hasOverduePanoptoChecks, isOverdueChecksLoading, organization }: EventContentProps) {
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
    <Item 
      className={cn(
        "border-0 shadow-none bg-transparent text-foreground rounded transition-all duration-200 ease-in-out min-w-0 overflow-hidden relative p-0",
        getEventHeight(),
       
        event.event_type === 'Ad Hoc Class Meeting' ? 'flex items-center' : '',
        isMergedRoomEvent ? 'flex items-center justify-center' : ''
      )}
    >
      <ItemContent className="flex items-center gap-2 px-2 h-full">
        {organization?.logo && (
          <Avatar className="w-6 h-6 flex-shrink-0">
            <AvatarImage 
              src={organization.logo} 
              alt={organization.name}
              className="object-cover"
            />
            <AvatarFallback className="text-xs">
              {organization.name?.charAt(0) || 'O'}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "text-xs font-medium transition-all duration-200 ease-in-out w-full leading-tight",
              event.event_type === 'Lecture' ? 'text-white' : 'text-foreground',
              isHovering ? 'scale-102' : 'scale-100'
            )}
            style={{
              transformOrigin: 'left top',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: '1.2',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
            title={eventName}
          >
            {eventName}
          </div>
        </div>
        </ItemContent>
    </Item>
  );
}

export default function EventContent({
  event,
  isHovering,
  isMergedRoomEvent,
  hasOverduePanoptoChecks,
  isOverdueChecksLoading
}: EventContentProps) {
  // Fetch organization data if the event organization is "JAPAN CLUB", "KELLOGG MARKETING CLUB", "KELLOGG KIDS", "ASIAN MANAGEMENT ASSOCIATION", "KELLOGG VETERANS ASSOCIATION", or "Entrepreneurship Acquisition Club"
  const shouldFetchOrg = event.organization === "JAPAN CLUB" || event.organization === "KELLOGG MARKETING CLUB" || event.organization === "KELLOGG KIDS" || event.organization === "ASIAN MANAGEMENT ASSOCIATION" || event.organization === "KELLOGG VETERANS ASSOCIATION" || event.organization === "Entrepreneurship Acquisition Club";
  const { data: organization } = useOrganization(shouldFetchOrg ? (event.organization || "") : "");

  return (
    <div className={`flex gap-2 relative transition-all duration-200 ease-in-out flex-1 ${event.event_type === 'KEC' ? 'w-full justify-center' : 'min-w-0'} ${isMergedRoomEvent ? 'h-full pt-6' : ''}`}>
      {event.event_type === 'Lecture' ? (
        <LectureEvent event={event} isHovering={isHovering} isMergedRoomEvent={isMergedRoomEvent} hasOverduePanoptoChecks={hasOverduePanoptoChecks} isOverdueChecksLoading={isOverdueChecksLoading} organization={organization} />
      ) : event.event_type === 'KEC' ? (
        <KECEvent event={event} isHovering={isHovering} isMergedRoomEvent={isMergedRoomEvent} hasOverduePanoptoChecks={hasOverduePanoptoChecks} isOverdueChecksLoading={isOverdueChecksLoading} organization={organization} />
      ) : (
        <DefaultEvent event={event} isHovering={isHovering} isMergedRoomEvent={isMergedRoomEvent} hasOverduePanoptoChecks={hasOverduePanoptoChecks} isOverdueChecksLoading={isOverdueChecksLoading} organization={organization} />
      )}
    </div>
  );
} 