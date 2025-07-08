import React, { useState, useRef, useEffect } from "react";
import EventHoverCard from "./EventHoverCard";
import EventHeader from "./EventHeader";
import EventContent from "./EventContent";
import { useFacultyMember } from "../../hooks/useFaculty";
import { parseEventResources, parseRoomName, getEventTypeInfo, calculateEventPosition } from "../../utils/eventUtils";

export default function Event({ event, startHour, pixelsPerMinute, rooms, onEventClick }) {

  // Disable hover card functionality
  const HOVER_CARD_ENABLED = false;

  const [showHoverCard, setShowHoverCard] = useState(false);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isHoveringEvent, setIsHoveringEvent] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const { data: facultyMember, isLoading: isFacultyLoading } = useFacultyMember(event.instructorName);
  const hoverTimeoutRef = useRef(null);
  const isHoveringRef = useRef(false);

  // Debug logging
  console.log('Event - event.instructorName:', event.instructorName);
  console.log('Event - facultyMember:', facultyMember);
  console.log('Event - isFacultyLoading:', isFacultyLoading);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (e) => {
    isHoveringRef.current = true;
    setIsHoveringEvent(true);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (HOVER_CARD_ENABLED) {
      const rect = e.currentTarget.getBoundingClientRect();
      const container = e.currentTarget.closest('.overflow-x-auto');
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

  const roomName = parseRoomName(event.subject_itemName);
  
  const roomIndex = rooms.indexOf(roomName);
  
  if (roomIndex === -1) {
    return null;
  }

  // Parse event resources using the utility function
  const { hasVideoRecording, hasHandheldMic, hasStaffAssistance, hasWebConference, hasClickers } = parseEventResources(event);

  // Calculate event positioning using the utility function
  const { left, width } = calculateEventPosition(event, startHour, pixelsPerMinute);

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
        minWidth: '120px',
        zIndex: showHoverCard ? 50 : 49,
        transform: isHoveringEvent ? 'scale(1.05)' : 'scale(1)',
        transformOrigin: 'center center',
        boxShadow: isHoveringEvent ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none'
      }}
      title={event.itemName}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onEventClick && onEventClick(event)}
    >
      <div className="flex flex-col h-full transition-all duration-200 ease-in-out">
        <EventHeader 
          event={event}
          hasVideoRecording={hasVideoRecording}
          hasStaffAssistance={hasStaffAssistance}
          hasHandheldMic={hasHandheldMic}
          hasWebConference={hasWebConference}
          hasClickers={hasClickers}
          isHovering={isHoveringEvent}
        />
        <EventContent 
          event={event}
          lectureTitle={event.lectureTitle}
          instructorName={event.instructorName}
          facultyMember={facultyMember}
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
              eventType={event.eventType}
              instructorName={event.instructorName}
              facultyMember={facultyMember}
              isFacultyLoading={isFacultyLoading}
              lectureTitle={event.lectureTitle}
            />
          </div>
        </div>
      )}
    </div>
  );
} 