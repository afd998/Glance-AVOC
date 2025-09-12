import React, { useState, useRef, useEffect } from "react";
import EventHoverCard from "./EventHoverCard";
import EventHeader from "./EventHeader";
import EventContent from "./EventContent";
import { useMultipleFacultyMembers } from "../../hooks/useFaculty";
import { parseEventResources, getEventTypeInfo, calculateEventPosition, getEventThemeColors } from "../../utils/eventUtils";
import { Database } from '../../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

interface EventProps {
  event: Event;
  startHour: number;
  pixelsPerMinute: number;
  rooms: string[];
  onEventClick: (event: Event) => void;
  hasOverduePanoptoChecks?: boolean;
  isOverdueChecksLoading?: boolean;
}

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

export default function Event({ event, startHour, pixelsPerMinute, rooms, onEventClick, hasOverduePanoptoChecks = false, isOverdueChecksLoading = false }: EventProps) {

  // Disable hover card functionality
  const HOVER_CARD_ENABLED = false;

  const [showHoverCard, setShowHoverCard] = useState(false);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isHoveringEvent, setIsHoveringEvent] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  // Parse instructor names from JSON field
  const instructorNames = parseInstructorNames(event.instructor_names);

  const { data: facultyMembers, isLoading: isFacultyLoading } = useMultipleFacultyMembers(instructorNames);
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
  
  // For merged room events (containing &), find the base room index
  let roomIndex: number;
  if (roomName?.includes('&')) {
    // Extract the base room name (everything before &)
    const baseRoomName = roomName.split('&')[0];
    roomIndex = rooms.indexOf(baseRoomName);
  } else {
    roomIndex = rooms.indexOf(roomName || '');
  }
  
  if (roomIndex === -1) {
    return null;
  }

  // Calculate event duration in hours
  const getEventDurationHours = () => {
    if (!event.start_time || !event.end_time) return 0;
    try {
      const [startHours, startMinutes] = event.start_time.split(':').map(Number);
      const [endHours, endMinutes] = event.end_time.split(':').map(Number);
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      const durationMinutes = endTotalMinutes - startTotalMinutes;
      return durationMinutes / 60; // Convert to hours
    } catch (error) {
      return 0;
    }
  };

  const eventDurationHours = getEventDurationHours();
  const isShortLecture = event.event_type === 'Lecture' && eventDurationHours < 2;

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
  const { isReducedHeightEvent, isMergedRoomEvent } = getEventTypeInfo(event);
  const themeColors = getEventThemeColors(event);
  const bgColor = themeColors[5]; // Use theme color for background
  
  // Determine if we should show the overdue blinking effect
  const shouldBlink = hasOverduePanoptoChecks;
  
  // Debug logging
  console.log(`🎯 Event ${event.id} (${event.event_name}): shouldBlink = ${shouldBlink}`);
  
  // Extract hex color from Tailwind class and create dynamic blinking animation
  const getOriginalColor = () => {
    // Extract hex color from Tailwind class like 'bg-[#6d8fbf]' or 'bg-slate-400'
    let originalColor = 'rgb(59 130 246)'; // Default blue fallback
    
    if (bgColor.includes('bg-[') && bgColor.includes(']')) {
      // Extract hex color from bg-[#hex] format
      const hexMatch = bgColor.match(/bg-\[#([a-fA-F0-9]{6})\]/);
      if (hexMatch) {
        const hex = hexMatch[1];
        // Convert hex to RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        originalColor = `rgb(${r} ${g} ${b})`;
      }
    } else if (bgColor.includes('bg-slate-')) {
      // Handle slate colors
      const slateMap: { [key: string]: string } = {
        'bg-slate-50': 'rgb(248 250 252)',
        'bg-slate-100': 'rgb(241 245 249)',
        'bg-slate-200': 'rgb(226 232 240)',
        'bg-slate-300': 'rgb(203 213 225)',
        'bg-slate-400': 'rgb(148 163 184)',
        'bg-slate-500': 'rgb(100 116 139)',
        'bg-slate-600': 'rgb(71 85 105)',
        'bg-slate-700': 'rgb(51 65 85)',
        'bg-slate-800': 'rgb(30 41 59)',
        'bg-slate-900': 'rgb(15 23 42)',
      };
      originalColor = slateMap[bgColor] || 'rgb(148 163 184)';
    } else if (bgColor.includes('bg-gray-')) {
      // Handle gray colors
      const grayMap: { [key: string]: string } = {
        'bg-gray-50': 'rgb(249 250 251)',
        'bg-gray-100': 'rgb(243 244 246)',
        'bg-gray-200': 'rgb(229 231 235)',
        'bg-gray-300': 'rgb(209 213 219)',
        'bg-gray-400': 'rgb(156 163 175)',
        'bg-gray-500': 'rgb(107 114 128)',
        'bg-gray-600': 'rgb(75 85 99)',
        'bg-gray-700': 'rgb(55 65 81)',
        'bg-gray-800': 'rgb(31 41 55)',
        'bg-gray-900': 'rgb(17 24 39)',
      };
      originalColor = grayMap[bgColor] || 'rgb(156 163 175)';
    }
    
    return originalColor;
  };

  // Adjust height for specific event types and keep centered in the 96px room row
  const ROW_HEIGHT_PX = 96;
  const DEFAULT_EVENT_HEIGHT_PX = 88;
  const REDUCED_EVENT_HEIGHT_PX = 64; // Reduced height for select event types
  const AD_HOC_EVENT_HEIGHT_PX = 48; // Even more reduced height for Ad Hoc Class Meeting events
  const MERGED_ROOM_HEIGHT_PX = 180; // Slightly less than double row height for merged room events
  
  // Determine event height: merged rooms get double height, otherwise follow existing rules
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
        className={`flex flex-col h-full transition-all duration-200 ease-in-out relative ${
          shouldBlink 
            ? 'animate-[blink-red-custom_6s_ease-in-out_infinite]' 
            : event.event_type === 'Ad Hoc Class Meeting' 
              ? 'ad-hoc-gradient' 
              : event.event_type === 'Lecture'
                ? 'lecture-gradient'
                : bgColor
        } text-white text-sm rounded ${isShortLecture ? 'px-1' : 'px-2'} pt-5 pb-1`}
        style={{
          transform: isHoveringEvent ? 'scale(1.05)' : 'scale(1)',
          transformOrigin: 'center center',
          boxShadow: isHoveringEvent ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
          ...(shouldBlink && { '--original-bg-color': getOriginalColor() })
        }}
      >
        <EventHeader 
          event={event}
          isHovering={isHoveringEvent}
        />
                <EventContent
          event={event}
          facultyMembers={facultyMembers || []}
          instructorNames={instructorNames}
          isFacultyLoading={isFacultyLoading}
          isHovering={isHoveringEvent}
          isMergedRoomEvent={isMergedRoomEvent}
          hasOverduePanoptoChecks={shouldBlink}
          isOverdueChecksLoading={isOverdueChecksLoading}
                />
      </div>
      {isClamped && continuationWidth > 0 && (
        <div
          aria-hidden
          className={`absolute pointer-events-none ${shouldBlink ? 'animate-[blink-red-custom-slow_4s_ease-in-out_infinite]' : (bgColor.includes('bg-transparent') ? 'bg-gray-400 dark:bg-gray-500' : bgColor)}`}
          style={{
            left: `${MAX_VISIBLE_WIDTH_PX}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: `${continuationWidth}px`,
            height: '2px',
            ...(shouldBlink && { '--original-bg-color': getOriginalColor() })
          }}
        />
      )}
      {isClamped && continuationWidth > 0 && (
        <div
          aria-hidden
          className={`absolute pointer-events-none ${shouldBlink ? 'animate-[blink-red-custom-slow_4s_ease-in-out_infinite]' : (bgColor.includes('bg-transparent') ? 'bg-gray-400 dark:bg-gray-500' : bgColor)}`}
          style={{
            left: `${MAX_VISIBLE_WIDTH_PX + continuationWidth}px`,
            top: 0,
            width: '2px',
            height: '100%',
            ...(shouldBlink && { '--original-bg-color': getOriginalColor() })
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
              facultyMembers={facultyMembers || []}
              instructorNames={instructorNames}
              isFacultyLoading={isFacultyLoading}
              style={{}}
            />
          </div>
        </div>
      )}
    </div>
  );
} 