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

// Leader line component for non-lecture events that are too long
const LeaderLineEvent = ({ 
  event, 
  position, 
  bgColor, 
  isHovering, 
  onMouseEnter, 
  onMouseLeave, 
  onClick 
}: {
  event: Event;
  position: { left: string; width: string; durationMinutes: number };
  bgColor: string;
  isHovering: boolean;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) => {
  const { data: facultyMember, isLoading: isFacultyLoading } = useFacultyMember(event.instructor_name || '');
  
  // Maximum width for the content background before showing leader line
  const maxContentWidth = 300; // pixels
  const shouldShowLeaderLine = parseInt(position.width) > maxContentWidth;
  
  // Content width is either the max width or the actual width if smaller
  const contentWidth = Math.min(parseInt(position.width), maxContentWidth);
  
  return (
         <div
       className="absolute transition-all duration-200 ease-in-out cursor-pointer group"
       style={{
         top: '4px',
         left: position.left,
         width: position.width,
         height: '88px',
         overflow: 'visible',
         zIndex: isHovering ? 60 : 49
       }}
       title={event.event_name || ''}
       onMouseEnter={onMouseEnter}
       onMouseLeave={onMouseLeave}
       onClick={onClick}
     >
               {/* Content background - limited width with background color */}
        <div 
          className={`${bgColor} text-white text-sm rounded px-2 py-1 h-full relative transition-all duration-200 ease-in-out`}
          style={{ 
            width: `${contentWidth}px`,
            boxShadow: isHovering ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
            transform: isHovering ? 'scale(1.05)' : 'scale(1)',
            transformOrigin: 'left center'
          }}
        >
        <div className="flex flex-col h-full transition-all duration-200 ease-in-out">
          <EventHeader 
            event={event}
            isHovering={isHovering}
          />
          <EventContent 
            event={event}
            facultyMember={facultyMember || null}
            isFacultyLoading={isFacultyLoading}
            isHovering={isHovering}
          />
        </div>
      </div>
      
             {/* Leader line - horizontal line extending to true width */}
       {shouldShowLeaderLine && (
         <div 
           className="absolute top-1/2 transform -translate-y-1/2"
           style={{ 
             left: `${contentWidth}px`,
             width: `calc(${position.width} - ${contentWidth}px)`,
             height: '2px'
           }}
         >
                       {/* Horizontal line */}
            <div 
              className="opacity-80"
              style={{ 
                width: '100%',
                height: '4px',
                backgroundColor: bgColor === 'bg-[#b8a68a]' ? '#b8a68a' : 
                               bgColor === 'bg-[#9b8ba5]' ? '#9b8ba5' : 
                               bgColor === 'bg-red-300' ? '#fca5a5' : 
                               bgColor === 'bg-transparent border-2 border-gray-400' ? '#9ca3af' : 
                               '#ffffff' // fallback to white
              }}
            />
            
                         {/* Vertical marker at the end */}
             <div 
               className="absolute right-0 opacity-80 rounded-full"
               style={{ 
                 width: '4px',
                 height: '32px',
                 top: '-14px',
                 backgroundColor: bgColor === 'bg-[#b8a68a]' ? '#b8a68a' : 
                                bgColor === 'bg-[#9b8ba5]' ? '#9b8ba5' : 
                                bgColor === 'bg-red-300' ? '#fca5a5' : 
                                bgColor === 'bg-transparent border-2 border-gray-400' ? '#9ca3af' : 
                                '#ffffff' // fallback to white
               }}
             />
         </div>
       )}
    </div>
  );
};

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
  
  // Determine if this is in the upper rows (first 4 rows)
  const isUpperRow = roomIndex < 4;

  // Get event type info using the utility function
  const { bgColor, isLecture } = getEventTypeInfo(event);

  // For non-lecture events, use the leader line component
  if (!isLecture) {
    return (
      <>
        <LeaderLineEvent
          event={event}
          position={position}
          bgColor={bgColor}
          isHovering={isHoveringEvent}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => onEventClick && onEventClick(event)}
        />
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
      </>
    );
  }

  // For lecture events, use the original rendering
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