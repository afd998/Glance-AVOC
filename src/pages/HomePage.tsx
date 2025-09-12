import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import TimeGrid from "../components/Grid/TimeGrid";
import CurrentTimeIndicator from "../components/Grid/CurrentTimeIndicator";
import RoomRow from "../components/Grid/RoomRow";
import VerticalLines from "../components/Grid/VerticalLines";
import AppHeader from "../components/Grid/AppHeader";
import { useEvents } from "../hooks/useEvents";
import { useNotifications } from "../hooks/useNotifications";
import { useEventFiltering } from "../hooks/useEventFiltering";
import { useAutoHideLogic } from "../hooks/useAutoHideLogic";
import { useProfile } from "../hooks/useProfile";
import { useFilters } from "../hooks/useFilters";
import { useRooms } from "../hooks/useRooms";
import { useOverduePanoptoChecks } from "../hooks/useOverduePanoptoChecks";
import useRoomStore from "../stores/roomStore";
import EventDetail from "../components/DetailPage/EventDetail";
import FacultyListModal from "../components/MenuPanel/FacultyListModal";
import FacultyDetailModal from "../components/Faculty/FacultyDetailModal";
import NoEventsMessage from "../components/NoEventsMessage";

import { Database } from "../types/supabase";



export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const currentTimeRef = useRef(new Date());
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState({ left: 0, top: 0 });
  
  // Drag-to-scroll functionality
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const [edgeHighlight, setEdgeHighlight] = useState({ top: false, bottom: false, left: false, right: false });
  
  
  // Throttling for performance
  const lastThrottledMove = useRef(0);
  const lastEdgeHighlightUpdate = useRef(0);
  const THROTTLE_INTERVAL = 16; // ~60fps
  const EDGE_HIGHLIGHT_THROTTLE = 50; // Update edge highlights less frequently
  const navigate = useNavigate();
  const location = useLocation();
  const { date, eventId } = useParams();
  const { selectedRooms, setAllRooms } = useRoomStore();
  const { rooms, isLoading: roomsLoading } = useRooms();

  React.useEffect(() => {
    if (rooms.length > 0) {
      setAllRooms(rooms);
    }
  }, [rooms, setAllRooms]);

  const selectedDate = React.useMemo(() => {
    if (!date) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    }
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day, 12, 0, 0);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }, [date]);

  const pixelsPerMinute = 2;
  const startHour = 6;
  const endHour = 23;
  const { events, isLoading, error } = useEvents(selectedDate);
  const { scheduleNotificationsForEvents } = useNotifications();
  const { filteredEvents, getFilteredEventsForRoom } = useEventFiltering(events);
  
  // Track if we've loaded events for the current date to prevent flash
  const [hasLoadedEvents, setHasLoadedEvents] = useState(false);
  const { hasOverdueChecks, isLoading: isOverdueChecksLoading } = useOverduePanoptoChecks(events || []);
  useAutoHideLogic(filteredEvents, selectedDate);
  const { currentFilter, updateCurrentFilter, updateAutoHide } = useProfile();
  const { filters, loadFilter, getFilterByName } = useFilters();
  const isEventDetailRoute = location.pathname.match(/\/\d{4}-\d{2}-\d{2}\/\d+(\/.*)?$/);
  const isFacultyModalRoute = location.pathname.endsWith('/faculty');
  const isFacultyDetailModalRoute = location.pathname.match(/\/faculty\/[0-9]+$/);

  React.useEffect(() => {
    if (events && events.length > 0) {
      scheduleNotificationsForEvents(events);
    }
  }, [events, scheduleNotificationsForEvents]);

  // Track when events have been loaded for the current date
  React.useEffect(() => {
    if (!isLoading && !error) {
      setHasLoadedEvents(true);
    }
  }, [isLoading, error]);

  // Reset hasLoadedEvents when date changes
  React.useEffect(() => {
    setHasLoadedEvents(false);
  }, [selectedDate]);


  // Check if there are any events that match the current filter
  const hasFilteredEvents = React.useMemo(() => {
    if (!filteredEvents || filteredEvents.length === 0) return false;
    // Check if any room has events after filtering
    return selectedRooms.some((room: string) => {
      const roomEvents = getFilteredEventsForRoom(room);
      return roomEvents && roomEvents.length > 0;
    });
  }, [filteredEvents, selectedRooms, getFilteredEventsForRoom]);

  // Handler to clear the current filter
  const handleClearFilter = async () => {
    try {
      // Check if there's already an "All Rooms" filter
      let allRoomsFilter = getFilterByName('All Rooms');

      if (!allRoomsFilter) {
        // If no "All Rooms" filter exists, create one with all available rooms
        const { allRooms } = useRoomStore.getState();
        const roomNames = allRooms.filter((room: string) => !room.includes('&')); // Exclude merged rooms

        // Create the "All Rooms" filter
        const newFilter = {
          name: 'All Rooms',
          display: roomNames,
          owner: null, // Make it a default filter
          isDefault: true,
          id: 0, // This will be set by the database
          createdAt: new Date().toISOString()
        };

        allRoomsFilter = newFilter;
      }

      // Load the "All Rooms" filter
      if (allRoomsFilter) {
        await loadFilter(allRoomsFilter);
      }
    } catch (error) {
      console.error('Error clearing filter:', error);
      // Fallback: just reset to null if loading fails
      updateCurrentFilter(null);
      updateAutoHide(false);
      const { selectAllRooms } = useRoomStore.getState();
      selectAllRooms();
    }
  };

  React.useEffect(() => {
    // Initial time set
    const now = new Date();
    currentTimeRef.current = now;
    setCurrentTime(now);
    
    // Update every 30 seconds for more responsive indicator
    const timer = setInterval(() => {
      const newTime = new Date();
      currentTimeRef.current = newTime;
      setCurrentTime(newTime);
    }, 30000);
    return () => { clearInterval(timer); };
  }, []);

  // 3D Parallax effect for background image - TOGGLED OFF
  // React.useEffect(() => {
  //   const background = document.getElementById('parallax-background');
  //   if (!background) return;

  //   const handleOrientation = (event: DeviceOrientationEvent) => {
  //     const { alpha, beta, gamma } = event;
      
  //     // Convert device orientation to CSS transform - reduced effect to prevent overflow
  //     const x = gamma ? (gamma / 90) * 40 : 0; // Left/right tilt - reduced from 80 to 40
  //     const y = beta ? ((beta - 45) / 45) * 40 : 0; // Forward/backward tilt - reduced from 80 to 40
      
  //     background.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  //   };

  //   const handleMouseMove = (event: MouseEvent) => {
  //     const { clientX, clientY } = event;
  //     const { innerWidth, innerHeight } = window;
      
  //     // Calculate mouse position relative to center - reduced effect to prevent overflow
  //     const x = ((clientX - innerWidth / 2) / innerWidth) * 60; // reduced from 120 to 60
  //     const y = ((clientY - innerHeight / 2) / innerHeight) * 60; // reduced from 120 to 60
      
  //     background.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  //   };

  //   // Add event listeners
  //   if (window.DeviceOrientationEvent) {
  //     window.addEventListener('deviceorientation', handleOrientation);
  //   }
    
  //   window.addEventListener('mousemove', handleMouseMove);

  //   // Cleanup
  //   return () => {
  //     if (window.DeviceOrientationEvent) {
  //       window.removeEventListener('deviceorientation', handleOrientation);
  //     }
  //     window.removeEventListener('mousemove', handleMouseMove);
  //   };
  // }, []);

  const handleDateChange = (newDate: Date) => {
    // Save current scroll position before navigating
    if (gridContainerRef.current) {
      setScrollPosition({
        left: gridContainerRef.current.scrollLeft,
        top: gridContainerRef.current.scrollTop
      });
    }
    
    const localDate = new Date(newDate);
    localDate.setHours(0, 0, 0, 0);
    const formattedDate = localDate.toISOString().split('T')[0];
    navigate(`/${formattedDate}`);
  };

  React.useEffect(() => {
    if (!date && selectedDate) {
      const localDate = new Date(selectedDate);
      localDate.setHours(0, 0, 0, 0);
      const formattedDate = localDate.toISOString().split('T')[0];
      navigate(`/${formattedDate}`, { replace: true });
    }
  }, [date, selectedDate, navigate]);

  // Restore scroll position after date change and content is loaded
  useEffect(() => {
    if (gridContainerRef.current && !isLoading && !roomsLoading && selectedRooms.length > 0) {
      // Use a small delay to ensure content is fully rendered
      const timer = setTimeout(() => {
        if (gridContainerRef.current) {
          gridContainerRef.current.scrollLeft = scrollPosition.left;
          gridContainerRef.current.scrollTop = scrollPosition.top;
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedDate, isLoading, roomsLoading, selectedRooms.length, scrollPosition]);

  // Enable drag functionality when there are events to scroll
  useEffect(() => {
    if (hasFilteredEvents && gridContainerRef.current) {
      setIsDragEnabled(true);
    } else {
      setIsDragEnabled(false);
    }
  }, [hasFilteredEvents]);

  const handleEventClick = (event: Database['public']['Tables']['events']['Row']) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    navigate(`/${dateStr}/${event.id}`);
  };


  // Helper function to calculate the actual number of rows that will be rendered
  const calculateActualRowCount = () => {
    if (!filteredEvents) return 0;
    
    // Get all unique room names that will have rows
    const roomsWithRows = new Set<string>();
    
    // Add all individual room events
    filteredEvents.forEach(event => {
      if (event.room_name && !event.room_name.includes('&')) {
        roomsWithRows.add(event.room_name);
      }
    });
    
    // Handle merged room events - they create rows for constituent rooms
    filteredEvents.forEach(event => {
      if (event.room_name && event.room_name.includes('&')) {
        const parts = event.room_name.split('&');
        if (parts.length === 2) {
          const baseRoom = parts[0].trim(); // e.g., "GH 1420"
          const suffix = parts[1].trim(); // e.g., "30", "B"
          
          // Add the base room
          roomsWithRows.add(baseRoom);
          
          // Handle different merge patterns
          if (suffix === '30') {
            // 1420&30 case: show both 1420 and 1430
            const roomNumber = baseRoom.match(/GH (\d+)/)?.[1];
            if (roomNumber) {
              const secondRoom = `GH ${parseInt(roomNumber) + 10}`;
              roomsWithRows.add(secondRoom);
            }
          } else if (suffix.length === 1 && /[AB]/.test(suffix)) {
            // A&B case: show both A and B variants
            const baseRoomWithoutSuffix = baseRoom.replace(/[AB]$/, '');
            roomsWithRows.add(`${baseRoomWithoutSuffix}A`);
            roomsWithRows.add(`${baseRoomWithoutSuffix}B`);
          }
        }
      }
    });
    
    // Filter to only include rooms that are in selectedRooms (after autohide/filtering)
    const visibleRoomsWithRows = Array.from(roomsWithRows).filter(room => 
      selectedRooms.includes(room)
    );
    
    return visibleRoomsWithRows.length;
  };

  // Helper function to clamp scroll values within boundaries
  const clampScrollPosition = (scrollLeft: number, scrollTop: number) => {
    if (!gridContainerRef.current) return { scrollLeft, scrollTop };
    
    const container = gridContainerRef.current;
    const { clientWidth, clientHeight } = container;
    
    // Calculate the actual content dimensions
    const actualContentWidth = (endHour - startHour) * 60 * pixelsPerMinute;
    // Each room row is h-24 (96px), plus TimeGrid is h-8 (32px)
    const actualRowCount = calculateActualRowCount();
    const actualContentHeight = (actualRowCount * 96) + 32; // 32px for TimeGrid
    
    // Calculate maximum scroll positions
    const maxScrollLeft = Math.max(0, actualContentWidth - clientWidth);
    const maxScrollTop = Math.max(0, actualContentHeight - clientHeight);
    
    // Clamp the values
    return {
      scrollLeft: Math.max(0, Math.min(scrollLeft, maxScrollLeft)),
      scrollTop: Math.max(0, Math.min(scrollTop, maxScrollTop))
    };
  };

  // Function to check and update edge highlighting
  const updateEdgeHighlight = () => {
    if (!gridContainerRef.current || !isDragging) return;
    
    const currentTime = Date.now();
    
    // Throttle edge highlight updates for better performance
    if (currentTime - lastEdgeHighlightUpdate.current < EDGE_HIGHLIGHT_THROTTLE) {
      return;
    }
    lastEdgeHighlightUpdate.current = currentTime;
    
    const container = gridContainerRef.current;
    const { scrollLeft, scrollTop, clientWidth, clientHeight } = container;
    
    // Calculate the actual content width based on the grid dimensions
    // This matches the width calculation used in the content div
    const actualContentWidth = (endHour - startHour) * 60 * pixelsPerMinute;
    // Each room row is h-24 (96px), plus TimeGrid is h-8 (32px)
    const actualRowCount = calculateActualRowCount();
    const actualContentHeight = (actualRowCount * 96) + 32; // 32px for TimeGrid
    
    // Add tolerance for edge detection and ensure we're actually at the boundaries
    const tolerance = 20;
    const maxScrollLeft = Math.max(0, actualContentWidth - clientWidth);
    const maxScrollTop = Math.max(0, actualContentHeight - clientHeight);
    
    // More aggressive edge detection - try to catch edges even if content doesn't fill full area
    const newEdgeHighlight = {
      top: scrollTop <= tolerance,
      bottom: scrollTop >= maxScrollTop - tolerance,
      left: scrollLeft <= tolerance,
      right: scrollLeft >= maxScrollLeft - tolerance
    };
    
    // Check if we hit any edge
    const hitAnyEdge = newEdgeHighlight.top || newEdgeHighlight.bottom || newEdgeHighlight.left || newEdgeHighlight.right;
    
    
    if (hitAnyEdge) {
      setEdgeHighlight(newEdgeHighlight);
    } else {
      // Clear highlights immediately when not hitting any edge
      setEdgeHighlight({ top: false, bottom: false, left: false, right: false });
    }
    
    // Debug logging
    if (isDragging) {
      console.log('Edge detection debug:', {
        scrollLeft: scrollLeft.toFixed(2),
        scrollTop: scrollTop.toFixed(2),
        actualContentWidth,
        actualContentHeight,
        clientWidth,
        clientHeight,
        maxScrollLeft: maxScrollLeft.toFixed(2),
        maxScrollTop: maxScrollTop.toFixed(2),
        isAtRight: scrollLeft >= maxScrollLeft - tolerance,
        isAtBottom: scrollTop >= maxScrollTop - tolerance,
        newEdgeHighlight,
        hitAnyEdge
      });
    }
  };


  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!gridContainerRef.current) return;
    
    // Only start dragging if clicking on the background (not on events)
    const target = e.target as HTMLElement;
    if (target.closest('[data-event]') || target.closest('[data-room-label]')) {
      return; // Don't drag if clicking on events or room labels
    }
    
    setIsDragging(true);
    setIsDragEnabled(true);
    setDragStart({
      x: e.pageX - gridContainerRef.current.offsetLeft,
      y: e.pageY - gridContainerRef.current.offsetTop,
      scrollLeft: gridContainerRef.current.scrollLeft,
      scrollTop: gridContainerRef.current.scrollTop
    });
    
    gridContainerRef.current.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !gridContainerRef.current) return;
    e.preventDefault();
    
    const currentTime = Date.now();
    
    // Throttle updates for better performance
    if (currentTime - lastThrottledMove.current < THROTTLE_INTERVAL) {
      return;
    }
    lastThrottledMove.current = currentTime;
    
    const x = e.pageX - gridContainerRef.current.offsetLeft;
    const y = e.pageY - gridContainerRef.current.offsetTop;
    
    const walkX = (x - dragStart.x) * 2; // Multiply by 2 for faster scrolling
    const walkY = (y - dragStart.y) * 2; // Multiply by 2 for faster scrolling
    const newScrollLeft = dragStart.scrollLeft - walkX;
    const newScrollTop = dragStart.scrollTop - walkY;
    
    // Clamp scroll position to prevent overscrolling
    const clampedPosition = clampScrollPosition(newScrollLeft, newScrollTop);
    gridContainerRef.current.scrollLeft = clampedPosition.scrollLeft;
    gridContainerRef.current.scrollTop = clampedPosition.scrollTop;
    
    // Update edge highlighting after scroll (throttled)
    updateEdgeHighlight();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (gridContainerRef.current) {
      gridContainerRef.current.style.cursor = isDragEnabled ? 'grab' : 'default';
    }
    // Clear edge highlights immediately when dragging stops
    setEdgeHighlight({ top: false, bottom: false, left: false, right: false });
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (gridContainerRef.current) {
      gridContainerRef.current.style.cursor = isDragEnabled ? 'grab' : 'default';
    }
    // Clear edge highlights immediately when dragging stops
    setEdgeHighlight({ top: false, bottom: false, left: false, right: false });
  };


  // Touch support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!gridContainerRef.current) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('[data-event]') || target.closest('[data-room-label]')) {
      return;
    }
    
    setIsDragging(true);
    setIsDragEnabled(true);
    const touch = e.touches[0];
    setDragStart({
      x: touch.pageX - gridContainerRef.current.offsetLeft,
      y: touch.pageY - gridContainerRef.current.offsetTop,
      scrollLeft: gridContainerRef.current.scrollLeft,
      scrollTop: gridContainerRef.current.scrollTop
    });
    
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !gridContainerRef.current) return;
    e.preventDefault();
    
    const currentTime = Date.now();
    
    // Throttle updates for better performance
    if (currentTime - lastThrottledMove.current < THROTTLE_INTERVAL) {
      return;
    }
    lastThrottledMove.current = currentTime;
    
    const touch = e.touches[0];
    const x = touch.pageX - gridContainerRef.current.offsetLeft;
    const y = touch.pageY - gridContainerRef.current.offsetTop;
    
    const walkX = (x - dragStart.x) * 2;
    const walkY = (y - dragStart.y) * 2;
    const newScrollLeft = dragStart.scrollLeft - walkX;
    const newScrollTop = dragStart.scrollTop - walkY;
    
    // Clamp scroll position to prevent overscrolling
    const clampedPosition = clampScrollPosition(newScrollLeft, newScrollTop);
    gridContainerRef.current.scrollLeft = clampedPosition.scrollLeft;
    gridContainerRef.current.scrollTop = clampedPosition.scrollTop;
    
    // Update edge highlighting after scroll (throttled)
    updateEdgeHighlight();
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Clear edge highlights immediately when dragging stops
    setEdgeHighlight({ top: false, bottom: false, left: false, right: false });
  };


  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">Error: {error.message}</div>;
  }

    return (
    <div className="flex-col items-center justify-center p-4 min-h-screen relative">
      {/* Bottom fade overlay for scrollable content */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-20" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.1), transparent)' }}></div>
             <AppHeader 
         selectedDate={selectedDate}
         setSelectedDate={handleDateChange}
         isLoading={isLoading}
         events={events}
         isDragging={isDragging}
       />
                          <div 
                            ref={gridContainerRef} 
                            className={`grid-container h-[calc(100vh-4rem)] sm:h-[calc(100vh-2rem)] overflow-auto rounded-md relative shadow-2xl ${
                              isDragging ? 'dragging' : ''}`}
                            style={{ 
                              cursor: isDragEnabled ? 'grab' : 'default'
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                          >
        <div className="min-w-max relative" style={{ 
          width: `${(endHour - startHour) * 60 * pixelsPerMinute}px`,
          minHeight: '100%' // Ensure content fills the full height
        }}>
          {/* Edge highlighting overlays - clean glow effect */}
          {edgeHighlight.top && (
            <div className="absolute -top-20 -left-20 -right-20 h-20 z-[100] pointer-events-none edge-highlight"
                 style={{
                   boxShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.4)',
                   background: 'rgba(255, 255, 255, 0.1)'
                 }} />
          )}
          {edgeHighlight.bottom && (
            <div className="absolute -bottom-20 -left-20 -right-20 h-20 z-[100] pointer-events-none edge-highlight"
                 style={{
                   boxShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.4)',
                   background: 'rgba(255, 255, 255, 0.1)'
                 }} />
          )}
          {edgeHighlight.left && (
            <div className="absolute -top-4 -left-20 -bottom-4 w-20 z-[100] pointer-events-none edge-highlight"
                 style={{
                   boxShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.4)',
                   background: 'rgba(255, 255, 255, 0.1)'
                 }} />
          )}
          {edgeHighlight.right && (
            <div className="absolute -top-4 -right-20 -bottom-4 w-20 z-[100] pointer-events-none edge-highlight"
                 style={{
                   boxShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.4)',
                   background: 'rgba(255, 255, 255, 0.1)'
                 }} />
          )}
          <TimeGrid startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
          {hasFilteredEvents && (
            <VerticalLines startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
          )}
          {hasFilteredEvents && (
            <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
              <CurrentTimeIndicator
                currentTime={currentTimeRef.current}
                startHour={startHour}
                endHour={endHour}
                pixelsPerMinute={pixelsPerMinute}
              />
            </div>
          )}
          {hasFilteredEvents && selectedRooms.filter((room: string) => !room.includes('&')).map((room: string, index: number) => {
            const roomEvents = getFilteredEventsForRoom(room);
            const currentFloor = room.match(/GH (\d)/)?.[1];
            const nextRoom = selectedRooms[index + 1];
            const nextFloor = nextRoom?.match(/GH (\d)/)?.[1];
            const isFloorBreak = currentFloor !== nextFloor;
            const isLastRow = index === selectedRooms.length - 1;
            return (
              <RoomRow
                key={`${room}-${selectedDate.toISOString().split('T')[0]}`}
                room={room}
                roomEvents={roomEvents}
                startHour={startHour}
                pixelsPerMinute={pixelsPerMinute}
                rooms={selectedRooms}
                isFloorBreak={isFloorBreak}
                onEventClick={handleEventClick}
                isEvenRow={index % 2 === 0}
                isLastRow={isLastRow}
                hasOverdueChecks={hasOverdueChecks}
                isOverdueChecksLoading={isOverdueChecksLoading}
              />
            );
          })}
        </div>
      </div>
      {/* Absolutely positioned no-events message */}
      {!hasFilteredEvents && !isLoading && !roomsLoading && hasLoadedEvents && (
        <NoEventsMessage onClearFilter={handleClearFilter} />
      )}
      {/* Event Detail Modal Overlay */}
      {isEventDetailRoute && eventId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          onClick={() => navigate(`/${date}`)}
        >
                     <div
             className="w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded-lg"
             onClick={(e) => e.stopPropagation()}
           >
            <EventDetail />
          </div>
        </div>
      )}
      {/* Faculty Modal Overlay */}
      {isFacultyModalRoute && !isFacultyDetailModalRoute && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          onClick={() => navigate(`/${date}`)}
        >
          <div
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <FacultyListModal isOpen={true} onClose={() => navigate(`/${date}`)} />
          </div>
        </div>
      )}
      {/* Faculty Detail Modal Overlay */}
      {isFacultyDetailModalRoute && (
        <FacultyDetailModal />
      )}


    </div>
  );
}


