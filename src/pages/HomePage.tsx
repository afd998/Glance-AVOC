import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import TimeGrid from "../components/Grid/TimeGrid";
import CurrentTimeIndicator from "../components/Grid/CurrentTimeIndicator";
import RoomRow from "../components/Grid/RoomRow";
import VerticalLines from "../components/Grid/VerticalLines";
import AppHeader from "../components/Grid/AppHeader";
import CurrentFilterLink from "../components/Grid/CurrentFilterLink";
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
  const { hasOverdueChecks } = useOverduePanoptoChecks(events || []);
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

  const handleEventClick = (event: Database['public']['Tables']['events']['Row']) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    navigate(`/${dateStr}/${event.id}`);
  };


  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">Error: {error.message}</div>;
  }

    return (
    <div className="flex-col items-center justify-center p-4 min-h-screen relative">
             <AppHeader 
         selectedDate={selectedDate}
         setSelectedDate={handleDateChange}
         isLoading={isLoading}
         events={events}
       />
       {/* Sticky Current Filter Link */}
       <div className="sticky top-0 z-[70]  mb-0">
         <div className="absolute left-0 top-0 w-24 h-8 flex items-center z-[70] backdrop-blur-sm rounded-tl-md" style={{ backgroundColor: '#8b72c4cc' }}>
           <CurrentFilterLink />
         </div>
       </div>
                          <div ref={gridContainerRef} className="h-[calc(100vh-12rem)] sm:h-[calc(100vh-6rem)] overflow-x-auto rounded-md relative wave-container shadow-2xl">
        <div className="min-w-max relative" style={{ width: `${(endHour - startHour) * 60 * pixelsPerMinute}px` }}>
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


