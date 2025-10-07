import React, { useState, useRef, useEffect } from "react";
import EventHeader from "./EventHeader";
import EventContent from "./EventContent";
import { getEventTypeInfo, calculateEventPosition, getEventThemeColors, getEventGradientClass, getOriginalColorFromTailwindClass } from "../../../../utils/eventUtils";
import { useEventDurationHours } from "../../hooks/useEvents";
import { useEventOverduePanoptoChecks } from "../hooks/useOverduePanoptoChecks";
import { Database } from '../../../../types/supabase';
import { Card, CardContent } from "../../../../components/ui/card";

type Event = Database['public']['Tables']['events']['Row'];

interface EventProps {
  event: Event;
  startHour: number;
  pixelsPerMinute: number;
  onEventClick: (event: Event) => void;
  rowHeightPx?: number;
}


export default function Event({ event, startHour, pixelsPerMinute, onEventClick, rowHeightPx = 96 }: EventProps) {

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

  // Calculate event height and positioning relative to row height
  const ROW_HEIGHT_PX = rowHeightPx;
  const DEFAULT_EVENT_HEIGHT_PX = Math.max(ROW_HEIGHT_PX - 8, 32); // default: slight vertical padding
  const REDUCED_EVENT_HEIGHT_PX = Math.max(Math.round(ROW_HEIGHT_PX * 0.67), 32);
  const AD_HOC_EVENT_HEIGHT_PX = Math.max(Math.round(ROW_HEIGHT_PX * 0.5), 28);
  const MERGED_ROOM_HEIGHT_PX = Math.round(ROW_HEIGHT_PX * 1.875);



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
    <Card
      className={`absolute transition-all duration-200 ease-in-out cursor-pointer group rounded-md ${
         // Don't apply gradient class when we have an organization logo
           gradientClass
      } ${event.event_type === 'Lecture' ? 'text-white' : 'text-gray-900'} text-sm ${isShortLecture ? 'px-1' : 'px-2'} ${isMergedRoomEvent ? 'pt-2 pb-2' : 'pt-5 pb-1'}`}
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
        transform: isHoveringEvent ? 'scale(1.05)' : 'scale(1)',
        transformOrigin: 'center center',
        boxShadow: isHoveringEvent 
          ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
          : '0 2px 8px rgba(0, 0, 0, 0.15)',
        transition: 'left 200ms ease-in-out, width 200ms ease-in-out',
       
      }}
      title={event.event_name || ''}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onEventClick && onEventClick(event)}
      data-event="true"
    >
      <CardContent className="flex flex-col h-full p-0">
        <EventHeader 
          eventId={event.id}
          date={event.date || undefined}
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
            className="absolute inset-0 rounded-sm pointer-events-none"
            style={{
              animation: 'blink-red-vignette 6s ease-in-out infinite'
            }}
          />
        )}
      </CardContent>
      {isClamped && continuationWidth > 0 && (
        <div
          aria-hidden
          className={`absolute pointer-events-none ${event.event_type === 'KEC' ? 'kec-continuation-line' : gradientClass}`}
          style={{
            left:  `${maxVisibleWidthPx}px`,
            top:  '50%',
            transform: 'translateY(-50%)',
            width: `${continuationWidth}px`,
            height: '2px',
            zIndex: -1
          }}
        />
      )}
      {isClamped && continuationWidth > 0 && (
        <div
          aria-hidden
          className={`absolute pointer-events-none ${event.event_type === 'KEC' ? 'kec-continuation-line' : gradientClass}`}
          style={{
            left: `${maxVisibleWidthPx + continuationWidth}px`,
            top:  0,
            width: '2px',
            height: '100%',
            zIndex: -1
          }}
        />
      )}
    </Card>
  );
} 