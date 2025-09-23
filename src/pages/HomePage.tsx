import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import TimeGrid from "../components/Grid/TimeGrid";
import CurrentTimeIndicator from "../components/Grid/CurrentTimeIndicator";
import RoomRow from "../components/Grid/RoomRow";
import VerticalLines from "../components/Grid/VerticalLines";
import AppHeader from "../components/Grid/AppHeader";
import DraggableGridContainer from "../components/Grid/DraggableGridContainer";
import DateDisplay from "../components/Grid/DateDisplay";
import { useEvents } from "../hooks/useEvents";
import { useEventsPrefetch } from "../hooks/useEvents";
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
  
  // Drag functionality
  const [isDragEnabled, setIsDragEnabled] = useState(false);
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

  const selectedDate = (() => {
    if (!date) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    }
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day, 12, 0, 0);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  })();

  const pixelsPerMinute = 2;
  const startHour = 6;
  const endHour = 23;
  // ✅ Clean: Get filtered events directly from React Query with select
  const { data: filteredEvents, isLoading, error } = useEvents(selectedDate);
  
  // Prefetch events for previous and next day in the background
  // This ensures instant navigation when using next/previous day buttons
  useEventsPrefetch(selectedDate);

  // // Handle Panopto check notifications
  usePanoptoNotifications(selectedDate);

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
  
  useAutoHideLogic(filteredEvents || [], selectedDate);
  // console.log('🔄 HomePage after useAutoHideLogic');
 
  const { updateCurrentFilter, updateAutoHide } = useProfile();
  const { loadFilter, getFilterByName } = useFilters();
  
  
  const isEventDetailRoute = location.pathname.match(/\/\d{4}-\d{2}-\d{2}\/\d+(\/.*)?$/);
  const isFacultyModalRoute = location.pathname.endsWith('/faculty');
  const isFacultyDetailModalRoute = location.pathname.match(/\/faculty\/[0-9]+$/);

 

  // React.useEffect(() => {
  //   if (events && events.length > 0) {
  //     scheduleNotificationsForEvents(events);
  //   }
  // }, [events, scheduleNotificationsForEvents]);



  // Check if there are any events that match the current filter
  const hasFilteredEvents = (() => {
    if (!filteredEvents || filteredEvents.length === 0) return false;
    // Check if any room has events after filtering
    return selectedRooms.some((room: string) => {
      const roomEvents = getFilteredEventsForRoomCallback(room);
      return roomEvents && roomEvents.length > 0;
    });
  })();

  // Handler to clear the current filter (load "All Rooms" filter)
  const handleClearFilter = async () => {
    try {
      // Check if there's already an "All Rooms" filter
      const allRoomsFilter = getFilterByName('All Rooms');
      
      if (allRoomsFilter) {
        await loadFilter(allRoomsFilter);
      } else {
       
      }
    } catch (error) {
      console.error('Error handling clear filter:', error);
    
    }
  };




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
    <div className="flex-col items-center justify-center p-1 px-5 min-h-screen relative">
      {/* Bottom fade overlay for scrollable content */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-20" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.1), transparent)' }}></div>
             <AppHeader
         selectedDate={selectedDate}
         setSelectedDate={handleDateChange}
         isLoading={isLoading}
         events={filteredEvents || []}
       />
      {/* Sticky Date Display */}
      <div className="fixed top-[3px] left-[17px] z-50">
        <DateDisplay />
      </div>
      
      {/* AVOC HOME text in bottom right corner */}
      {/* <div className="fixed bottom-[-5px] right-[-40px] pointer-events-none z-50">
        <svg width="400" height="400" viewBox="-0 -100 250 120" style={{ transform: 'rotate(-65deg)' }}>
          <defs>
            <path id="avoc-curve" d="M 20 15 Q 105 100 230 20" />
          </defs>
          <text fontSize="20" fill="rgba(255,255,255,0.8)" fontWeight="bold">
            <textPath href="#avoc-curve" startOffset="0%">
              AVOC HOME
            </textPath>
          </text>
        </svg>
      </div> */}
      
      <div className="fixed bottom-4 right-8 text-right pointer-events-none z-50">
        <div className="text-4xl font-bold text-white/80 leading-none">AVOC</div>
        <div className="text-2xl font-semibold text-white/70 leading-none mt-1">HOME</div>
      </div>
                          <DraggableGridContainer
                            className="grid-container h-[calc(100vh-4rem)] sm:h-[calc(100vh-2rem)] overflow-auto rounded-tr rounded-bl relative shadow-2xl"
                            style={{ 
                              clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 60px), calc(100% - 60px) 100%, 0 100%)'
                            }}
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
      {!hasFilteredEvents && !isLoading && !roomsLoading && (
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


