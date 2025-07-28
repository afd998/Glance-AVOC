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



  // Calculate event positioning manually (working approach)
  if (!event.start_time || !event.end_time) {
    return null;
  }

  // Parse times - handle both "HH:MM:SS" and ISO timestamp formats
  let startTimeHour: number, startTimeMin: number;
  let endTimeHour: number, endTimeMin: number;

  if (event.start_time.includes('T')) {
    // ISO timestamp format
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    startTimeHour = startDate.getHours();
    startTimeMin = startDate.getMinutes();
    endTimeHour = endDate.getHours();
    endTimeMin = endDate.getMinutes();
  } else {
    // Simple time string format "HH:MM" or "HH:MM:SS"
    [startTimeHour, startTimeMin] = event.start_time.split(':').map(Number);
    [endTimeHour, endTimeMin] = event.end_time.split(':').map(Number);
  }
  
  const eventStartMinutes = startTimeHour * 60 + startTimeMin;
  const eventEndMinutes = endTimeHour * 60 + endTimeMin;
  const timelineStartMinutes = startHour * 60;
  
  const startMinutesRelative = eventStartMinutes - timelineStartMinutes;
  const durationMinutes = eventEndMinutes - eventStartMinutes;
  
  // Subtract room label width since events are positioned too far right
  const roomLabelWidth = 96; // Adjust this if needed
  const left = `${(startMinutesRelative * pixelsPerMinute) - roomLabelWidth}px`;
  // Ensure minimum width for very short events to prevent overlaps
  const calculatedWidth = Math.max(durationMinutes * pixelsPerMinute, 30);
  const width = `${calculatedWidth}px`;
  
  // Debug logging for width issues
  console.log(`Event: ${event.event_name}`, {
    startTime: event.start_time,
    endTime: event.end_time,
    durationMinutes,
    pixelsPerMinute,
    rawWidth: durationMinutes * pixelsPerMinute,
    calculatedWidth,
    finalWidth: width,
    left,
    eventType: event.event_type
  });

  // Determine if this is in the upper rows (first 4 rows)
  const isUpperRow = roomIndex < 4;

  // Get event type info using the utility function
  const { bgColor } = getEventTypeInfo(event);

  return (
    <div
      className={`absolute ${bgColor} text-white text-sm rounded px-2 py-1 transition-all duration-200 ease-in-out cursor-pointer group`}
      style={{
        top: '4px',
        left: left,
        width: width,
        height: '88px',
        overflow: 'visible',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        zIndex: isHoveringEvent ? 60 : (showHoverCard ? 50 : 49),
        transform: isHoveringEvent ? 'scale(1.05)' : 'scale(1)',
        transformOrigin: 'center center',
        boxShadow: isHoveringEvent ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none'
      }}
      title={event.event_name || ''}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onEventClick && onEventClick(event)}
    >
      <div className="flex flex-col h-full transition-all duration-200 ease-in-out">
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