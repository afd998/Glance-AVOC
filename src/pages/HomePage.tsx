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
import useRoomStore from "../stores/roomStore";
import EventDetail from "../components/DetailPage/EventDetail";
import FacultyListModal from "../components/MenuPanel/FacultyListModal";
import FacultyDetailModal from "../components/Faculty/FacultyDetailModal";
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
    console.log('🔍 [HomePage] URL date parameter:', date);
    const [year, month, day] = date.split('-').map(Number);
    console.log('🔍 [HomePage] Parsed date parts:', { year, month, day });
    const parsedDate = new Date(year, month - 1, day, 12, 0, 0);
    console.log('🔍 [HomePage] Final selectedDate:', parsedDate, 'ISO:', parsedDate.toISOString().split('T')[0]);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }, [date]);

  const pixelsPerMinute = 2;
  const startHour = 6;
  const endHour = 23;
  const { events, isLoading, error } = useEvents(selectedDate);
  const { scheduleNotificationsForEvents } = useNotifications();
  const { filteredEvents, getFilteredEventsForRoom } = useEventFiltering(events);
  useAutoHideLogic(filteredEvents, selectedDate);
  const { currentFilter } = useProfile();
  const { filters } = useFilters();
  const isEventDetailRoute = location.pathname.match(/\/\d{4}-\d{2}-\d{2}\/\d+(\/.*)?$/);
  const isFacultyModalRoute = location.pathname.endsWith('/faculty');
  const isFacultyDetailModalRoute = location.pathname.match(/\/faculty\/[0-9]+$/);

  React.useEffect(() => {
    if (events && events.length > 0) {
      scheduleNotificationsForEvents(events);
    }
  }, [events, scheduleNotificationsForEvents]);

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

  if (isLoading || roomsLoading) {
    return (
      <div className="flex-col items-center justify-center p-4 min-h-screen relative">
        <AppHeader 
          selectedDate={selectedDate}
          setSelectedDate={handleDateChange}
          isLoading={isLoading}
          events={events}
        />
        <div className="mt-4 h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)] overflow-x-auto py-5 rounded-md relative">
          <div className="min-w-max relative" style={{ width: `${(endHour - startHour) * 60 * pixelsPerMinute}px` }}>
            <TimeGrid startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
            <VerticalLines startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
       <div ref={gridContainerRef} className="mt-4 h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)] overflow-x-auto rounded-md relative wave-container shadow-2xl">
         <div className="min-w-max relative" style={{ width: `${(endHour - startHour) * 60 * pixelsPerMinute}px` }}>
           <TimeGrid startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
           <VerticalLines startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
          <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
            <CurrentTimeIndicator 
              currentTime={currentTimeRef.current}
              startHour={startHour}
              endHour={endHour}
              pixelsPerMinute={pixelsPerMinute}
            />
          </div>
          {selectedRooms.map((room: string, index: number) => {
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
              />
            );
          })}
        </div>
      </div>
      {/* Event Detail Modal Overlay */}
      {isEventDetailRoute && eventId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          onClick={() => navigate(`/${date}`)}
        >
                     <div 
             className="w-full max-w-7xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-xl golden-lace-border"
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


