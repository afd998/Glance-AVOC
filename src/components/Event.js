import React, { useState, useRef, useEffect } from "react";
import EventHoverCard from "./EventHoverCard";
import { useFacultyDirectory, findFacultyMember } from "../services/facultyService";

export default function Event({ event, startHour, pixelsPerMinute, rooms }) {
  const [showHoverCard, setShowHoverCard] = useState(false);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const { data: faculty, isLoading: isFacultyLoading } = useFacultyDirectory();
  const hoverTimeoutRef = useRef(null);
  const isHoveringRef = useRef(false);

  // Get lecture title from panel data
  const getLectureTitle = (data) => {
    const panels = data.itemDetails?.defn?.panel || [];
    for (const panel of panels) {
      if (panel.typeId === 11 && panel.item?.[1]?.itemName) {
        return panel.item[1].itemName;
      }
    }
    return null;
  };

  const lectureTitle = getLectureTitle(event);

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
    // Add a small delay before hiding the card
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setShowHoverCard(false);
      }
    }, 100); // 100ms delay
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
    // First try to match L-prefixed rooms (KGHL110 format)
    const lMatch = subjectItemName.match(/K(GHL\d+)/);
    if (lMatch) {
      return lMatch[1].replace(/(GH)(L)(\d+)/, 'GH $2$3');
    }
    
    // Then try to match regular rooms
    const match = subjectItemName.match(/K(GH\d+[AB]?)/);
    if (!match) return null;
    
    // Add space between GH and number, preserving A/B suffix if present
    const roomNumber = match[1];
    return roomNumber.replace(/(GH)(\d+)([AB]?)/, 'GH $2$3');
  };

  const getInstructorName = (data) => {
    const panels = data.itemDetails?.defn?.panel || [];
    for (const panel of panels) {
      if (panel.typeId === 12) {
        const instructor = panel.item?.[0]?.itemName;
        if (instructor) {
          const cleanName = instructor.replace(/^Instructors:\s*/, '').trim();
          // Only return if it's a valid name (not HTML, not empty, reasonable length)
          if (cleanName && 
              !cleanName.startsWith('<') && 
              cleanName.length > 2 && 
              cleanName.length < 100 && 
              !cleanName.includes('{') && 
              !cleanName.includes('}')) {
            return cleanName;
          }
        }
      }
      if (panel.typeId === 13) {
        const instructor = panel.item?.[0]?.item?.[0]?.itemName;
        if (instructor) {
          const cleanName = instructor.replace(/^Instructors:\s*/, '').trim();
          // Only return if it's a valid name (not HTML, not empty, reasonable length)
          if (cleanName && 
              !cleanName.startsWith('<') && 
              cleanName.length > 2 && 
              cleanName.length < 100 && 
              !cleanName.includes('{') && 
              !cleanName.includes('}')) {
            return cleanName;
          }
        }
      }
    }
    return null;
  };

  const getEventType = (data) => {
    const panels = data.itemDetails?.defn?.panel || [];
    for (const panel of panels) {
      if (panel.typeId === 11) {
        const eventType = panel.item?.[2]?.itemName;
        if (eventType) return eventType;
      }
    }
    return null;
  };

  const roomName = parseRoomName(event.subject_itemName);
 
  const roomIndex = rooms.indexOf(roomName);
  if (roomIndex === -1) return null;

  // Find the matching reservation for the current date
  const matchingReservation = event.itemDetails?.occur?.prof?.[0]?.rsv?.[0];
  if (!matchingReservation) return null;

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

  const eventType = getEventType(event);
  const isStudentEvent = eventType?.toLowerCase().includes('student');
  const isFacStaffEvent = eventType?.toLowerCase().includes('facstaff');

  // Determine event type and color
  const isClass = event.itemName?.includes("Class");
  const isSpecial = event.itemName?.includes("Workshop") || event.itemName?.includes("Summit");
  
  let bgColor = "bg-blue-500";
  if (isStudentEvent) bgColor = "bg-amber-700";
  else if (isFacStaffEvent) bgColor = "bg-purple-700";
  else if (isClass) bgColor = "bg-indigo-500";
  else if (isSpecial) bgColor = "bg-purple-500";

  // Format time for display
  const formatTime = (floatHours) => {
    const hours = Math.floor(floatHours);
    const minutes = Math.round((floatHours - hours) * 60);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const timeDisplay = `${formatTime(event.start)} - ${formatTime(event.end)}`;

  const instructorName = getInstructorName(event);
  const facultyMember = instructorName && faculty ? findFacultyMember(instructorName, faculty) : null;

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
        <div className="flex justify-between items-center h-4">
          <span className="text-xs font-medium opacity-90 truncate">{timeDisplay}</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasVideoRecording && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Video Recording"></span>
            )}
            {hasStaffAssistance && (
              <span className="text-xs bg-orange-500 rounded-full p-0.5 shadow-sm" title="Staff Assistance">🚶</span>
            )}
            {hasHandheldMic && (
              <span className="text-sm" title="Handheld Microphone">🎤</span>
            )}
            {hasWebConference && (
              <img 
                src="/zoomicon.png" 
                alt="Web Conference" 
                className="w-4 h-4 object-contain"
                title="Web Conference"
              />
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-0.5">
          {instructorName && facultyMember?.imageUrl && (
            <img 
              src={facultyMember.imageUrl} 
              alt={instructorName}
              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div className="flex flex-col min-w-0">
            <span className="truncate font-medium">{event.itemName}</span>
            {lectureTitle && (
              <span className="text-xs opacity-90 truncate">{lectureTitle}</span>
            )}
            {instructorName && (
              <div className="flex items-center gap-1">
                {!facultyMember?.imageUrl && (
                  <span className="text-sm">👤</span>
                )}
                <span className="text-xs font-medium opacity-90 truncate">{instructorName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {showHoverCard && (
        <div 
          className="absolute z-50"
          style={{
            left: 0,
            bottom: '100%',
            marginBottom: '8px'
          }}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        >
          <EventHoverCard
            event={event}
            matchingReservation={matchingReservation}
            eventType={eventType}
            instructorName={instructorName}
            facultyMember={facultyMember}
            isFacultyLoading={isFacultyLoading}
            lectureTitle={lectureTitle}
          />
        </div>
      )}
    </div>
  );
}