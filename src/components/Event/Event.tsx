import React, { useState, useRef, useEffect, useMemo } from "react";
import EventHeader from "./EventHeader";
import EventContent from "./EventContent";
import { getEventTypeInfo, calculateEventPosition, getEventThemeColors, getEventGradientClass, getOriginalColorFromTailwindClass } from "../../utils/eventUtils";
import { useEventDurationHours } from "../../hooks/useEvents";
import { useEventOverduePanoptoChecks } from "../../hooks/usePanoptoChecks";
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
  

  const handleMouseEnter = () => {
    setIsHoveringEvent(true);
  };

  const handleMouseLeave = () => {
    setIsHoveringEvent(false);
  };


  // Use the new room_name field instead of parsing subject_itemName
  const roomName = event.room_name;
  
  // Memoize room index calculation for merged room events
  const roomIndex = useMemo(() => {
    if (roomName?.includes('&')) {
      // Extract the base room name (everything before &)
      const baseRoomName = roomName.split('&')[0];
      return rooms.indexOf(baseRoomName);
    } else {
      return rooms.indexOf(roomName || '');
    }
  }, [roomName, rooms]);
  
  if (roomIndex === -1) {
    return null;
  }

  // Get cached event duration in hours
  const { data: eventDurationHours = 0 } = useEventDurationHours(event.id);
  
  // Memoize short lecture determination
  const isShortLecture = useMemo(() => 
    event.event_type === 'Lecture' && eventDurationHours < 2,
    [event.event_type, eventDurationHours]
  );

  // Memoize event positioning calculations
  const position = useMemo(() => {
    const timelineStartMinutes = startHour * 60;
    const roomLabelWidth = 96; // Adjust this if needed
    
    return calculateEventPosition(
      event,
      timelineStartMinutes,
      pixelsPerMinute,
      roomLabelWidth
    );
  }, [event, startHour, pixelsPerMinute]);
  
  if (!position) {
    return null;
  }
  
  const { left, width, durationMinutes } = position;

  // Memoize width clamping calculations
  const { isClamped, displayWidth, continuationWidth, maxVisibleWidthPx } = useMemo(() => {
    const MAX_VISIBLE_WIDTH_PX = 500;
    const realWidthPx = parseFloat(width);
    const clamped = realWidthPx > MAX_VISIBLE_WIDTH_PX;
    const display = clamped ? `${MAX_VISIBLE_WIDTH_PX}px` : width;
    const continuation = clamped ? Math.max(0, realWidthPx - MAX_VISIBLE_WIDTH_PX) : 0;
    
    return {
      isClamped: clamped,
      displayWidth: display,
      continuationWidth: continuation,
      maxVisibleWidthPx: MAX_VISIBLE_WIDTH_PX
    };
  }, [width]);

  // Memoize upper row determination
  const isUpperRow = useMemo(() => roomIndex < 4, [roomIndex]);

  // Get event type info using the utility function
  const { isReducedHeightEvent, isMergedRoomEvent } = getEventTypeInfo(event);
  const themeColors = getEventThemeColors(event);
  const bgColor = themeColors[5]; // Use theme color for background
  
  
  // Get gradient class from utility function
  const gradientClass = getEventGradientClass(event.event_type || '');
  
  // Determine if we should show the overdue blinking effect
  const shouldBlink = hasOverduePanoptoChecks;
  
  
  // Get original color from utility function
  const originalColor = getOriginalColorFromTailwindClass(bgColor);

  // Memoize event height and positioning calculations
  const { eventHeightPx, eventTopPx } = useMemo(() => {
    // Adjust height for specific event types and keep centered in the 96px room row
    const ROW_HEIGHT_PX = 96;
    const DEFAULT_EVENT_HEIGHT_PX = 88;
    const REDUCED_EVENT_HEIGHT_PX = 64; // Reduced height for select event types
    const AD_HOC_EVENT_HEIGHT_PX = 48; // Even more reduced height for Ad Hoc Class Meeting events
    const MERGED_ROOM_HEIGHT_PX = 180; // Slightly less than double row height for merged room events
    
  
    
    let height: number;
    let top: string;
    
    if (isMergedRoomEvent) {
      height = MERGED_ROOM_HEIGHT_PX;
      // Position merged room events at the top of the row (they extend downward into next room space)
      top = '6px';
      
      // Debug logging for merged room events
      if (event.event_type === 'CMC') {
        console.log('CMC Merged Room Event - Using merged room height:', {
          eventHeightPx: height,
          eventTopPx: top,
          roomName: event.room_name
        });
      }
    } else {
      // Special case for Ad Hoc Class Meeting - use even more reduced height
      if (event.event_type === 'Ad Hoc Class Meeting') {
        height = AD_HOC_EVENT_HEIGHT_PX;
      } else {
        height = isReducedHeightEvent ? REDUCED_EVENT_HEIGHT_PX : DEFAULT_EVENT_HEIGHT_PX;
      }
      // Center normal events in the row
      top = `${(ROW_HEIGHT_PX - height) / 2}px`;
      
      // Debug logging for non-merged CMC events
      if (event.event_type === 'CMC') {
        console.log('CMC Non-Merged Event - Using reduced height:', {
          eventHeightPx: height,
          eventTopPx: top,
          isReducedHeightEvent,
          roomName: event.room_name
        });
      }
    }
    
    return {
      eventHeightPx: height,
      eventTopPx: top
    };
  }, [isMergedRoomEvent, isReducedHeightEvent, event.event_type, event.room_name]);

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
        zIndex: isHoveringEvent ? 60 : 49,
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
          shouldBlink && event.event_type !== 'Lecture'
            ? 'animate-[blink-red-custom_6s_ease-in-out_infinite]' 
            : gradientClass
        } ${event.event_type === 'Lecture' ? 'text-white' : 'text-gray-900'} text-sm rounded ${isShortLecture ? 'px-1' : 'px-2'} ${isMergedRoomEvent ? 'pt-2 pb-2' : 'pt-5 pb-1'}`}
        style={{
          transform: isHoveringEvent ? 'scale(1.05)' : 'scale(1)',
          transformOrigin: 'center center',
          boxShadow: isHoveringEvent ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
          ...(shouldBlink && { '--original-bg-color': originalColor })
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
        {/* Red blinking vignette border for lecture events with overdue Panopto checks */}
        {shouldBlink && event.event_type === 'Lecture' && (
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
            left: `${maxVisibleWidthPx}px`,
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