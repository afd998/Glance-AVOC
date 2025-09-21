import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import TimeGrid from "../components/Grid/TimeGrid";
import CurrentTimeIndicator from "../components/Grid/CurrentTimeIndicator";
import RoomRow from "../components/Grid/RoomRow";
import VerticalLines from "../components/Grid/VerticalLines";
import AppHeader from "../components/Grid/AppHeader";
import DraggableGridContainer from "../components/Grid/DraggableGridContainer";
import { useEvents } from "../hooks/useEvents";
import { useEventsPrefetch } from "../hooks/useEventsPrefetch";
import { useNotifications } from "../hooks/useNotifications";
import { useAutoHideLogic } from "../hooks/useAutoHideLogic";
import { useProfile } from "../hooks/useProfile";
import { useFilters } from "../hooks/useFilters";
import { useRooms } from "../hooks/useRooms";
import { usePanoptoNotifications } from "../hooks/usePanoptoChecks";
import useRoomStore from "../stores/roomStore";
import EventDetail from "../components/DetailPage/EventDetail";
import FacultyListModal from "../components/MenuPanel/FacultyListModal";
import FacultyDetailModal from "../components/Faculty/FacultyDetailModal";
import NoEventsMessage from "../components/NoEventsMessage";

import { Database } from "../types/supabase";



export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const currentTimeRef = useRef(new Date());
  
  // Drag functionality
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { date, eventId } = useParams();
  const { selectedRooms, setAllRooms } = useRoomStore();
  const { rooms, isLoading: roomsLoading } = useRooms();
  
  // Temporary mock data
  // const selectedRooms: string[] = [];
  // const setAllRooms = () => {};
  // const rooms: string[] = [];
  // const roomsLoading = false;

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
  // ✅ Clean: Get filtered events directly from React Query with select
  const { data: filteredEvents, isLoading, error } = useEvents(selectedDate);
  
  // Prefetch events for previous and next day in the background
  // This ensures instant navigation when using next/previous day buttons
  useEventsPrefetch(selectedDate);

  // Handle Panopto check notifications
  usePanoptoNotifications();

  // Helper function for room filtering (using the already filtered data)
  const getFilteredEventsForRoomCallback = (roomName: string) => {
    if (!filteredEvents) return [];

    return filteredEvents.filter((event: any) => {
      if (!event.room_name) return false;

      // Handle merged rooms (e.g., "GH 1420&30")
      if (event.room_name.includes('&')) {
        const parts = event.room_name.split('&');
        if (parts.length === 2) {
          const baseRoom = parts[0].trim();

          // Merged room events should ONLY appear in the base room row
          return baseRoom === roomName;
        }
      }

      // Direct room match
      return event.room_name === roomName;
    });
  };

  
  // Track if we've loaded events for the current date to prevent flash
  const [hasLoadedEvents, setHasLoadedEvents] = useState(false);
  
  // useAutoHideLogic(filteredEvents || [], selectedDate);
  // console.log('🔄 HomePage after useAutoHideLogic');
  
  // Temporary mock data to isolate the issue
  // const events: any[] = [];
  // const isLoading = false;
  // const error: any = null;
  // const filteredEvents: any[] = [];
  // const getFilteredEventsForRoom = (room: string) => [];
  const { updateCurrentFilter, updateAutoHide } = useProfile();
  const { filters, loadFilter, getFilterByName, saveFilter } = useFilters();
  
  // Temporary mock data
  // const updateCurrentFilter = (filter: any) => {};
  // const updateAutoHide = (hide: boolean) => {};
  // const filters: any[] = [];
  // const loadFilter = (filter: any) => {};
  // const getFilterByName = (name: string) => null;
  // const saveFilter = (name: string, rooms: string[]) => {};
  const isEventDetailRoute = location.pathname.match(/\/\d{4}-\d{2}-\d{2}\/\d+(\/.*)?$/);
  const isFacultyModalRoute = location.pathname.endsWith('/faculty');
  const isFacultyDetailModalRoute = location.pathname.match(/\/faculty\/[0-9]+$/);

  // Ensure "All Rooms" default filter exists
  React.useEffect(() => {
    const initializeAllRoomsFilter = async () => {
      if (rooms.length > 0 && filters.length > 0 && !getFilterByName('All Rooms')) {
        try {
          console.log('Creating default All Rooms filter');
          const roomNames = rooms.filter((room: string) => !room.includes('&'));
          await saveFilter('All Rooms', roomNames);
        } catch (error) {
          console.error('Failed to create default All Rooms filter:', error);
        }
      }
    };

    initializeAllRoomsFilter();
  }, [rooms, filters, saveFilter, getFilterByName]);

  // React.useEffect(() => {
  //   if (events && events.length > 0) {
  //     scheduleNotificationsForEvents(events);
  //   }
  // }, [events, scheduleNotificationsForEvents]);

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
      const roomEvents = getFilteredEventsForRoomCallback(room);
      return roomEvents && roomEvents.length > 0;
    });
  }, [filteredEvents, selectedRooms, getFilteredEventsForRoomCallback]);

  // Handler to clear the current filter (load "All Rooms" filter)
  const handleClearFilter = async () => {
    try {
      // Check if there's already an "All Rooms" filter
      let allRoomsFilter = getFilterByName('All Rooms');

      if (!allRoomsFilter) {
        // If no "All Rooms" filter exists, create one with all available rooms
        const { allRooms } = useRoomStore.getState();
        const roomNames = allRooms.filter((room: string) => !room.includes('&')); // Exclude merged rooms

        console.log('Creating All Rooms filter with rooms:', roomNames);
        
        // Save the "All Rooms" filter to the database
        // The saveFilter function will automatically set it as the current filter
        await saveFilter('All Rooms', roomNames);
        
        // The saveFilter function sets the current filter, so we're done
        return;
      }

      // Load the existing "All Rooms" filter
      console.log('Loading existing All Rooms filter:', allRoomsFilter);
      await loadFilter(allRoomsFilter);
    } catch (error) {
      console.error('Error handling clear filter:', error);
      // Fallback: just clear filter and select all rooms
      try {
        await updateCurrentFilter(null);
        await updateAutoHide(false);
        const { selectAllRooms } = useRoomStore.getState();
        selectAllRooms();
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
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



  const handleDateChange = (newDate: Date) => {
    // Save current scroll position before navigating
    // Note: Scroll position is now managed by DraggableGridContainer
    
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
    if (!isLoading && !roomsLoading && selectedRooms.length > 0) {
      // Note: Scroll position restoration is now handled by DraggableGridContainer
      // The scroll position will be maintained through the onScrollPositionChange callback
    }
  }, [selectedDate, isLoading, roomsLoading, selectedRooms.length]);

  // Enable drag functionality when there are events to scroll
  useEffect(() => {
    if (hasFilteredEvents) {
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
    filteredEvents.forEach((event: any) => {
      if (event.room_name && !event.room_name.includes('&')) {
        roomsWithRows.add(event.room_name);
      }
    });
    
    // Handle merged room events - they create rows for constituent rooms
    filteredEvents.forEach((event: any) => {
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
         events={filteredEvents || []}
       />
                          <DraggableGridContainer
                            className="grid-container h-[calc(100vh-4rem)] sm:h-[calc(100vh-2rem)] overflow-auto rounded-md relative shadow-2xl"
                            startHour={startHour}
                            endHour={endHour}
                            pixelsPerMinute={pixelsPerMinute}
                            actualRowCount={calculateActualRowCount()}
                            isDragEnabled={isDragEnabled}
                          >
                            <div className="min-w-max relative" style={{ 
                              width: `${(endHour - startHour) * 60 * pixelsPerMinute}px`,
                              minHeight: '100%' // Ensure content fills the full height
                            }}>
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
                                const roomEvents = getFilteredEventsForRoomCallback(room);
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
                                  />
                                );
                              })}
                            </div>
                          </DraggableGridContainer>
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


