import React, { useState, useRef, useEffect } from "react";
import EventHoverCard from "./EventHoverCard";
import EventHeader from "./EventHeader";
import EventContent from "./EventContent";
import { useFacultyDirectory, findFacultyMember } from "../services/facultyService";

export default function Event({ event, startHour, pixelsPerMinute, rooms, onEventClick }) {
  console.log('Event component rendered with:', { 
    event, 
    startHour, 
    pixelsPerMinute, 
    rooms,
    eventName: event?.itemName,
    subjectName: event?.subject_itemName
  });

  const [showHoverCard, setShowHoverCard] = useState(false);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const { data: faculty, isLoading: isFacultyLoading } = useFacultyDirectory();
  const hoverTimeoutRef = useRef(null);
  const isHoveringRef = useRef(false);

  // Find faculty member from the directory
  const facultyMember = event.instructorName ? findFacultyMember(event.instructorName, faculty) : null;

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
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const container = e.currentTarget.closest('.overflow-x-auto');
    const containerRect = container.getBoundingClientRect();
    
    setHoverPosition({
      x: rect.left - containerRect.left + container.scrollLeft,
      y: rect.top - containerRect.top + container.scrollTop
    });
    setShowHoverCard(true);
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
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

  // Parse room name from format "KGH1110 (70)" to "GH 1110" or "KGHL110" to "GH L110"
  const parseRoomName = (subjectItemName) => {
    if (!subjectItemName) {
      console.log('No subject item name provided');
      return null;
    }
    // First try to match L-prefixed rooms (KGHL110 format)
    const lMatch = subjectItemName.match(/K(GHL\d+)/);
    if (lMatch) {
      return lMatch[1].replace(/(GH)(L)(\d+)/, 'GH $2$3');
    }
    
    // Then try to match regular rooms
    const match = subjectItemName.match(/K(GH\d+[AB]?)/);
    if (!match) {
      console.log('No room match found for:', subjectItemName);
      return null;
    }
    
    // Add space between GH and number, preserving A/B suffix if present
    const roomNumber = match[1];
    return roomNumber.replace(/(GH)(\d+)([AB]?)/, 'GH $2$3');
  };

  const roomName = parseRoomName(event.subject_itemName);
  
  const roomIndex = rooms.indexOf(roomName);
  
  if (roomIndex === -1) {
    return null;
  }

  // Find the matching reservation for the current date
  const matchingReservation = event.itemDetails?.occur?.prof?.[0]?.rsv?.[0];
  if (!matchingReservation) {
    console.log('No matching reservation found, returning null');
    return null;
  }

  // Convert decimal string times to numbers
  const startTime = parseFloat(event.start);
  const endTime = parseFloat(event.end);
  
  // Adjust for timezone (subtract 1 hour)
  const adjustedStartTime = startTime - 1;
  const adjustedEndTime = endTime - 1;
  
  // Calculate minutes from start of day
  const startMinutes = Math.round((adjustedStartTime - startHour) * 60) + 10;
  const endMinutes = Math.round((adjustedEndTime - startHour) * 60) + 10;
  const durationMinutes = endMinutes - startMinutes;
  const eventMargin = 1;

  console.log('Time calculations:', {
    startTime,
    endTime,
    adjustedStartTime,
    adjustedEndTime,
    startMinutes,
    endMinutes,
    durationMinutes
  });

  // Determine if this is in the upper rows (first 4 rows)
  const isUpperRow = roomIndex < 4;

  const hasVideoRecording = matchingReservation.res?.some(item => 
    item.itemName === "KSM-KGH-VIDEO-Recording (POST TO CANVAS)" || 
    item.itemName === "KSM-KGH-VIDEO-Recording (PRIVATE LINK)" ||
    item.itemName === "KSM-KGH-VIDEO-Recording"
  );
  const hasHandheldMic = matchingReservation.res?.some(item => 
    item.itemName === "KSM-KGH-AV-Handheld Microphone"
  );
  const hasStaffAssistance = matchingReservation.res?.some(item => 
    item.itemName === "KSM-KGH-AV-Staff Assistance"
  );
  const hasWebConference = matchingReservation.res?.some(item => 
    item.itemName === "KSM-KGH-AV-Web Conference"
  );

  const isStudentEvent = event.eventType?.toLowerCase().includes('student');
  const isFacStaffEvent = event.eventType?.toLowerCase().includes('facstaff');

  // Determine event type and color
  const isClass = event.itemName?.includes("Class");
  const isSpecial = event.itemName?.includes("Workshop") || event.itemName?.includes("Summit");
  
  let bgColor = "bg-blue-500";
  if (isStudentEvent) bgColor = "bg-amber-700";
  else if (isFacStaffEvent) bgColor = "bg-purple-700";
  else if (isClass) bgColor = "bg-indigo-500";
  else if (isSpecial) bgColor = "bg-purple-500";

  return (
    <div
      className={`absolute ${bgColor} text-white text-sm rounded px-2 py-1 hover:opacity-90 transition-all cursor-pointer group`}
      style={{
        top: '0',
        left: `${startMinutes * pixelsPerMinute + eventMargin}px`,
        width: `${durationMinutes * pixelsPerMinute - eventMargin * 2}px`,
        height: '80px',
        overflow: 'visible',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        boxShadow: hasVideoRecording ? '0 0 0 3px rgba(239, 68, 68, 0.9)' : 'none',
        minWidth: '120px',
        zIndex: showHoverCard ? 50 : 1
      }}
      title={event.itemName}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        <EventHeader 
          event={event}
          hasVideoRecording={hasVideoRecording}
          hasStaffAssistance={hasStaffAssistance}
          hasHandheldMic={hasHandheldMic}
          hasWebConference={hasWebConference}
        />
        <EventContent 
          event={event}
          lectureTitle={event.lectureTitle}
          instructorName={event.instructorName}
          facultyMember={facultyMember}
          isFacultyLoading={isFacultyLoading}
        />
      </div>
      {showHoverCard && (
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
              matchingReservation={matchingReservation}
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