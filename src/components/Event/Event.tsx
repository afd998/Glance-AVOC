import React, { useState, useRef, useEffect } from "react";
import EventHeader from "./EventHeader";
import EventContent from "./EventContent";
import { getEventTypeInfo, calculateEventPosition, getEventThemeColors, getEventGradientClass, getOriginalColorFromTailwindClass } from "../../utils/eventUtils";
import { useEventDurationHours } from "../../hooks/useEvents";
import { useEventOverduePanoptoChecks } from "../../hooks/usePanoptoChecks";
import { useOrganization } from "../../hooks/useOrganization";
import { Database } from '../../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

interface EventProps {
  event: Event;
  startHour: number;
  pixelsPerMinute: number;
  rooms: string[];
  onEventClick: (event: Event) => void;
}


export default function Event({ event, startHour, pixelsPerMinute, rooms, onEventClick }: EventProps) {

  const [isHoveringEvent, setIsHoveringEvent] = useState(false);

  
  // Check for overdue Panopto checks for this specific event - much more efficient!
  const { hasOverdueChecks, isLoading: isOverdueChecksLoading } = useEventOverduePanoptoChecks(event);
  const hasOverduePanoptoChecks = hasOverdueChecks;
  
  // Fetch organization data if the event organization is "JAPAN CLUB", "KELLOGG MARKETING CLUB", "KELLOGG KIDS", "ASIAN MANAGEMENT ASSOCIATION", "KELLOGG VETERANS ASSOCIATION", or "Entrepreneurship Acquisition Club"
  const shouldFetchOrg = event.organization === "JAPAN CLUB" || event.organization === "KELLOGG MARKETING CLUB" || event.organization === "KELLOGG KIDS" || event.organization === "ASIAN MANAGEMENT ASSOCIATION" || event.organization === "KELLOGG VETERANS ASSOCIATION" || event.organization === "Entrepreneurship Acquisition Club";
  const { data: organization } = useOrganization(shouldFetchOrg ? (event.organization || "") : "");
  
  // Debug logging
  if (event.organization) {
    console.log('Event organization:', `"${event.organization}"`, 'Length:', event.organization.length, 'Should fetch:', shouldFetchOrg, 'Org data:', organization);
  }
  

  const handleMouseEnter = () => {
    setIsHoveringEvent(true);
  };

  const handleMouseLeave = () => {
    setIsHoveringEvent(false);
  };


  // Use the new room_name field instead of parsing subject_itemName
  const roomName = event.room_name;
  
  // Calculate room index for merged room events
  const roomIndex = (() => {
    if (roomName?.includes('&')) {
      // Extract the base room name (everything before &)
      const baseRoomName = roomName.split('&')[0];
      return rooms.indexOf(baseRoomName);
    } else {
      return rooms.indexOf(roomName || '');
    }
  })();
  
  if (roomIndex === -1) {
    return null;
  }

  // Get cached event duration in hours
  const { data: eventDurationHours = 0 } = useEventDurationHours(event.id);
  
  // Determine if this is a short lecture
  const isShortLecture = event.event_type === 'Lecture' && eventDurationHours < 2;

  // Calculate event positioning
  const timelineStartMinutes = startHour * 60;
  const roomLabelWidth = 96; // Adjust this if needed

  const position = calculateEventPosition(
    event,
    timelineStartMinutes,
    pixelsPerMinute,
    roomLabelWidth
  );
  
  if (!position) {
    return null;
  }
  
  const { left, width, durationMinutes } = position;

  // Calculate width clamping
  const MAX_VISIBLE_WIDTH_PX = 500;
  const realWidthPx = parseFloat(width);
  const isClamped = realWidthPx > MAX_VISIBLE_WIDTH_PX;
  const displayWidth = isClamped ? `${MAX_VISIBLE_WIDTH_PX}px` : width;
  const continuationWidth = isClamped ? Math.max(0, realWidthPx - MAX_VISIBLE_WIDTH_PX) : 0;
  const maxVisibleWidthPx = MAX_VISIBLE_WIDTH_PX;

  // Determine if this is an upper row
  const isUpperRow = roomIndex < 4;

  // Get event type info using the utility function
  const { isReducedHeightEvent, isMergedRoomEvent } = getEventTypeInfo(event);
  const themeColors = getEventThemeColors(event);
  const bgColor = themeColors[5]; // Use theme color for background
  
  
  // Get gradient class from utility function
  const gradientClass = getEventGradientClass(event.event_type || '');
  
  // Determine if we should show the overdue blinking effect
  const shouldBlink = 1;
  
  
  // Get original color from utility function
  const originalColor = getOriginalColorFromTailwindClass(bgColor);

  // Calculate event height and positioning
  // Adjust height for specific event types and keep centered in the 96px room row
  const ROW_HEIGHT_PX = 96;
  const DEFAULT_EVENT_HEIGHT_PX = 88;
  const REDUCED_EVENT_HEIGHT_PX = 64; // Reduced height for select event types
  const AD_HOC_EVENT_HEIGHT_PX = 48; // Even more reduced height for Ad Hoc Class Meeting events
  const MERGED_ROOM_HEIGHT_PX = 180; // Slightly less than double row height for merged room events



  let eventHeightPx: number;
  let eventTopPx: string;

  if (isMergedRoomEvent) {
    eventHeightPx = MERGED_ROOM_HEIGHT_PX;
    // Position merged room events at the top of the row (they extend downward into next room space)
    eventTopPx = '6px';


  } else {
    // Special case for Ad Hoc Class Meeting - use even more reduced height
    if (event.event_type === 'Ad Hoc Class Meeting') {
      eventHeightPx = AD_HOC_EVENT_HEIGHT_PX;
    } else {
      eventHeightPx = isReducedHeightEvent ? REDUCED_EVENT_HEIGHT_PX : DEFAULT_EVENT_HEIGHT_PX;
    }
    // Center normal events in the row
    eventTopPx = `${(ROW_HEIGHT_PX - eventHeightPx) / 2}px`;

  }

  return (
    <div
      className={`absolute transition-all duration-200 ease-in-out cursor-pointer group`}
      style={{
        top: eventTopPx,
        left: left,
        width: displayWidth,
        height: `${eventHeightPx}px`,
        minHeight: `${eventHeightPx}px`,
        overflow: 'visible',
        textOverflow: 'ellipsis',
        whiteSpace: event.event_type === 'Lecture' ? 'nowrap' : 'normal',
        zIndex: isHoveringEvent ? (isMergedRoomEvent ? 70 : 60) : (isMergedRoomEvent ? 52 : 49),
        // No transform/boxShadow here so continuation lines don't scale
      }}
      title={event.event_name || ''}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onEventClick && onEventClick(event)}
      data-event="true"
    >
      <div
        className={`flex flex-col h-full transition-all duration-200 ease-in-out relative ${
          shouldBlink
            ? 'animate-[blink-red-custom_6s_ease-in-out_infinite]' 
            : organization?.logo
            ? '' // Don't apply gradient class when we have an organization logo
            : gradientClass
        } ${event.event_type === 'Lecture' ? 'text-white' : 'text-gray-900'} text-sm rounded ${isShortLecture ? 'px-1' : 'px-2'} ${isMergedRoomEvent ? 'pt-2 pb-2' : 'pt-5 pb-1'}`}
        style={{
          transform: isHoveringEvent ? 'scale(1.05)' : 'scale(1)',
          transformOrigin: 'center center',
          boxShadow: isHoveringEvent ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
          ...(shouldBlink && { '--original-bg-color': originalColor }),
          ...(organization?.logo && {
            backgroundColor: 'white',
            backgroundImage: `url(${organization.logo})`,
            backgroundSize: organization?.name === "KELLOGG VETERANS ASSOCIATION" ? 'cover' : `auto ${eventHeightPx * 0.7}px`,
            backgroundPosition: organization?.name === "KELLOGG VETERANS ASSOCIATION" ? 'center' : '10% center',
            backgroundRepeat: 'no-repeat'
          })
        }}
      >
        <EventHeader 
          event={event}
          isHovering={isHoveringEvent}
        />
        <div className="flex-1">
          <EventContent
            event={event}
            isHovering={isHoveringEvent}
            isMergedRoomEvent={isMergedRoomEvent}
            hasOverduePanoptoChecks={shouldBlink}
            isOverdueChecksLoading={isOverdueChecksLoading}
          />
        </div>
        {/* Red blinking vignette border for events with overdue Panopto checks */}
        {shouldBlink && (
          <div 
            className="absolute inset-0 rounded pointer-events-none"
            style={{
              animation: 'blink-red-vignette 6s ease-in-out infinite'
            }}
          />
        )}
      </div>
      {isClamped && continuationWidth > 0 && (
        <div
          aria-hidden
          className={`absolute pointer-events-none ${shouldBlink ? 'animate-[blink-red-custom-slow_4s_ease-in-out_infinite]' : (event.event_type === 'KEC' ? 'kec-continuation-line' : gradientClass)}`}
          style={{
            left: event.event_type === 'KEC' ? `${maxVisibleWidthPx}px` : `${maxVisibleWidthPx}px`,
            top: event.event_type === 'KEC' ? 'calc(50%  - 88px)' : '50%',
            transform: 'translateY(-50%)',
            width: `${continuationWidth}px`,
            height: '2px',
            zIndex: -1,
            ...(shouldBlink && { '--original-bg-color': originalColor })
          }}
        />
      )}
      {isClamped && continuationWidth > 0 && (
        <div
          aria-hidden
          className={`absolute pointer-events-none ${shouldBlink ? 'animate-[blink-red-custom-slow_4s_ease-in-out_infinite]' : (event.event_type === 'KEC' ? 'kec-continuation-line' : gradientClass)}`}
          style={{
            left: `${maxVisibleWidthPx + continuationWidth}px`,
            top: event.event_type === 'KEC' ? '-90px' : 0,
            width: '2px',
            height: '100%',
            zIndex: -1,
            ...(shouldBlink && { '--original-bg-color': originalColor })
          }}
        />
      )}
    </div>
  );
} 