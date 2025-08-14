import React, { useState, useRef, useEffect } from "react";
import EventHoverCard from "./EventHoverCard";
import EventHeader from "./EventHeader";
import EventContent from "./EventContent";
import { useFacultyMember } from "../../hooks/useFaculty";
import { parseEventResources, getEventTypeInfo, calculateEventPosition } from "../../utils/eventUtils";
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

  // Disable hover card functionality
  const HOVER_CARD_ENABLED = false;

  const [showHoverCard, setShowHoverCard] = useState(false);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isHoveringEvent, setIsHoveringEvent] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const { data: facultyMember, isLoading: isFacultyLoading } = useFacultyMember(event.instructor_name || '');
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (e: React.MouseEvent) => {
    isHoveringRef.current = true;
    setIsHoveringEvent(true);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (HOVER_CARD_ENABLED) {
      const rect = e.currentTarget.getBoundingClientRect();
      const container = e.currentTarget.closest('.overflow-x-auto') as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      
      setHoverPosition({
        x: rect.left - containerRect.left + container.scrollLeft,
        y: rect.top - containerRect.top + container.scrollTop
      });
      setShowHoverCard(true);
    }
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    setIsHoveringEvent(false);
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setShowHoverCard(false);
      }
    }, 100);
  };

  const handleCardMouseEnter = () => {
    setIsHoveringCard(true);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleCardMouseLeave = () => {
    setIsHoveringCard(false);
    setShowHoverCard(false);
  };

  // Use the new room_name field instead of parsing subject_itemName
  const roomName = event.room_name;
  
  const roomIndex = rooms.indexOf(roomName || '');
  
  if (roomIndex === -1) {
    return null;
  }



  // Calculate event positioning using utility function
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

  // Clamp overly long events to a max visible width and draw a continuation line to the real end
  const MAX_VISIBLE_WIDTH_PX = 500;
  const realWidthPx = parseFloat(width);
  const isClamped = realWidthPx > MAX_VISIBLE_WIDTH_PX;
  const displayWidth = isClamped ? `${MAX_VISIBLE_WIDTH_PX}px` : width;
  const continuationWidth = isClamped ? Math.max(0, realWidthPx - MAX_VISIBLE_WIDTH_PX) : 0;
  
 
  // Determine if this is in the upper rows (first 4 rows)
  const isUpperRow = roomIndex < 4;

  // Get event type info using the utility function
  const { bgColor } = getEventTypeInfo(event);

  // Adjust height for specific event types and keep centered in the 96px room row
  const ROW_HEIGHT_PX = 96;
  const DEFAULT_EVENT_HEIGHT_PX = 88;
  const REDUCED_EVENT_HEIGHT_PX = 64; // Reduced height for select event types
  const isReducedHeightEvent = (
    event.event_type === 'KSM: Kellogg Special Events (KGH)' ||
    event.event_type === 'KSM: Kellogg FacStaff (KGH)' ||
    event.event_type === 'KEC'
  );
  const eventHeightPx = isReducedHeightEvent ? REDUCED_EVENT_HEIGHT_PX : DEFAULT_EVENT_HEIGHT_PX;
  const eventTopPx = `${(ROW_HEIGHT_PX - eventHeightPx) / 2}px`;

  return (
    <div
      className={`absolute transition-all duration-200 ease-in-out cursor-pointer group`}
      style={{
        top: eventTopPx,
        left: left,
        width: displayWidth,
        height: `${eventHeightPx}px`,
        overflow: 'visible',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        zIndex: isHoveringEvent ? 60 : (showHoverCard ? 50 : 49),
        // No transform/boxShadow here so continuation lines don't scale
      }}
      title={event.event_name || ''}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onEventClick && onEventClick(event)}
    >
      <div 
        className={`flex flex-col h-full transition-all duration-200 ease-in-out ${bgColor} text-white text-sm rounded px-2 py-1`}
        style={{
          transform: isHoveringEvent ? 'scale(1.05)' : 'scale(1)',
          transformOrigin: 'center center',
          boxShadow: isHoveringEvent ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none'
        }}
      >
        <EventHeader 
          event={event}
          isHovering={isHoveringEvent}
        />
                <EventContent 
          event={event}
          facultyMember={facultyMember || null}
          isFacultyLoading={isFacultyLoading}
          isHovering={isHoveringEvent}
                />
      </div>
      {isClamped && continuationWidth > 0 && (
        <div
          aria-hidden
          className={`absolute pointer-events-none ${bgColor.includes('bg-transparent') ? 'bg-gray-400 dark:bg-gray-500' : bgColor}`}
          style={{
            left: `${MAX_VISIBLE_WIDTH_PX}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: `${continuationWidth}px`,
            height: '2px'
          }}
        />
      )}
      {isClamped && continuationWidth > 0 && (
        <div
          aria-hidden
          className={`absolute pointer-events-none ${bgColor.includes('bg-transparent') ? 'bg-gray-400 dark:bg-gray-500' : bgColor}`}
          style={{
            left: `${MAX_VISIBLE_WIDTH_PX + continuationWidth}px`,
            top: 0,
            width: '2px',
            height: '100%'
          }}
        />
      )}
      {HOVER_CARD_ENABLED && showHoverCard && (
        <div 
          className="absolute z-[100]"
          style={{
            left: 0,
            [isUpperRow ? 'top' : 'bottom']: '100%',
            marginTop: isUpperRow ? '8px' : 0,
            marginBottom: isUpperRow ? 0 : '8px',
            pointerEvents: 'auto'
          }}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg"></div>
            <EventHoverCard
              event={event}
              facultyMember={facultyMember || null}
              isFacultyLoading={isFacultyLoading}
              style={{}}
            />
          </div>
        </div>
      )}
    </div>
  );
} 