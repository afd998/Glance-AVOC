import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from "react-router-dom";
import TimeWindowPicker from "./components/TimeWindowPicker";
import Event from "./components/Event";
import FilterPanel from "./components/FilterPanel";
import TimeGrid from "./components/TimeGrid";
import CurrentTimeIndicator from "./components/CurrentTimeIndicator";
import RoomRow from "./components/RoomRow";
import VerticalLines from "./components/VerticalLines";
import DatePickerComponent from "./components/DatePickerComponent";
import Footer from "./components/Footer";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import "react-datepicker/dist/react-datepicker.css";
import "./index.css";
import { useEvents } from "./hooks/useEvents";
import { useNotifications } from "./hooks/useNotifications";
import { ThemeProvider } from './contexts/ThemeContext';
import useRoomStore from './stores/roomStore';
import EventDetail from './components/EventDetail';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

// Create a persister with proper serialization
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error deserializing cache:', error);
      return null;
    }
  },
});

// Persist the cache
persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  buster: 'v1', // Add a cache buster to force a fresh cache
});

const rooms = [
  "GH L129", "GH L110", "GH L120", "GH L130", "GH L070", "GH 1110", "GH 1120", "GH 1130",
  "GH 1420", "GH 1430", "GH 2110", "GH 2120", "GH 2130",
  "GH 2410A", "GH 2410B", "GH 2420A", "GH 2420B", "GH 2430A", "GH 2430B",
  "GH 4101", "GH 4301", "GH 4302", "GH 5101", "GH 5201", "GH 5301"
];

function AppContent() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { date } = useParams();
  
  // Use Zustand store for room state
  const { 
    selectedRooms, 
    allRooms, 
    setAllRooms, 
    setSelectedRooms,
    setNotificationRooms
  } = useRoomStore();
  
  // Initialize rooms in Zustand store (only if not already initialized)
  React.useEffect(() => {
    setAllRooms(rooms);
    
    // Only set default values if no rooms are currently selected (first time load)
    if (selectedRooms.length === 0) {
      setSelectedRooms(rooms); // Start with all rooms selected
    }
    
    // Only set default notification rooms if none are currently set (first time load)
    const { notificationRooms } = useRoomStore.getState();
    if (notificationRooms.length === 0) {
      setNotificationRooms(rooms); // Start with all rooms for notifications
    }
  }, [setAllRooms, setSelectedRooms, setNotificationRooms, selectedRooms.length]);
  
  // Parse date from URL or use current date
  const selectedDate = React.useMemo(() => {
    if (!date) {
      return new Date();
    }
    // Parse the date and set it to noon to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day, 12, 0, 0);
    const result = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    return result;
  }, [date]);
  
  const pixelsPerMinute = 2;
  const startHour = 6;
  const endHour = 23;
  
  const {events, isLoading, error } = useEvents(selectedDate);
  const { scheduleNotificationsForEvents } = useNotifications();

  // Schedule notifications when events change
  React.useEffect(() => {
    if (events && events.length > 0) {
      scheduleNotificationsForEvents(events);
    }
  }, [events, scheduleNotificationsForEvents]);

  // Update current time every minute
  React.useEffect(() => {
    console.log('Setting up current time interval');
    const timer = setInterval(() => {
      const newTime = new Date();
      console.log('Current time updated:', newTime);
      setCurrentTime(newTime);
    }, 60000);

    return () => {
      console.log('Cleaning up current time interval');
      clearInterval(timer);
    };
  }, []);

  const handleDateChange = (newDate) => {
    console.log('handleDateChange called with:', newDate);
    // Create a new date object and set it to midnight in local time
    const localDate = new Date(newDate);
    localDate.setHours(0, 0, 0, 0);
    console.log('Local date after setting to midnight:', localDate);
    const formattedDate = localDate.toISOString().split('T')[0];
    console.log('Formatted date for URL:', formattedDate);
    navigate(`/${formattedDate}`);
  };

  // If we're on the root path and have a date, redirect to the date URL
  React.useEffect(() => {
    console.log('URL effect - Current date param:', date);
    console.log('URL effect - Current selectedDate:', selectedDate);
    if (!date && selectedDate) {
      // Create a new date object and set it to midnight in local time
      const localDate = new Date(selectedDate);
      localDate.setHours(0, 0, 0, 0);
      console.log('URL effect - Local date after setting to midnight:', localDate);
      const formattedDate = localDate.toISOString().split('T')[0];
      console.log('URL effect - Formatted date for redirect:', formattedDate);
      navigate(`/${formattedDate}`, { replace: true });
    }
  }, [date, selectedDate, navigate]);

  // Add event click handler
  const handleEventClick = (event) => {
    // Create a unique event ID from event properties
    const eventId = `${event.itemName}-${event.start}-${event.subject_itemName}`;
    // Include the date in the URL so EventDetail knows which date to fetch
    const dateStr = selectedDate.toISOString().split('T')[0];
    navigate(`/event/${dateStr}/${encodeURIComponent(eventId)}`);
  };

  if (isLoading) {
    // Check if the date is outside the 80-day window
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fortyDaysAgo = new Date(today);
    fortyDaysAgo.setDate(today.getDate() - 40);
    const fortyDaysAhead = new Date(today);
    fortyDaysAhead.setDate(today.getDate() + 40);
    
    const isOutsideRange = selectedDate < fortyDaysAgo || selectedDate > fortyDaysAhead;
    
    if (isOutsideRange) {
      return (
        <div className="flex flex-col items-center justify-center h-screen dark:bg-gray-900 dark:text-white gap-4">
          <div className="text-xl">Loading...</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            You requested a day outside the 80-day window. Data may take up to 2 minutes to load.
          </div>
        </div>
      );
    }

    return (
      <div className="flex-col items-center justify-center p-4 dark:bg-gray-900 min-h-screen bg-gray-200 relative">
        <div className="self-center absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
          <img src="/wildcat.png" alt="Wildcat" className="w-full h-full object-contain" />
        </div>

        {/* Header with controls */}
        <div className="flex justify-between items-center">
          <FilterPanel />
          <DatePickerComponent 
            selectedDate={selectedDate}
            setSelectedDate={handleDateChange}
          />
        </div>

        <div className="mt-4 h-[calc(100vh-10rem)] overflow-x-auto py-5 rounded-md relative">
          <div className="min-w-max relative" style={{ width: `${(endHour - startHour) * 60 * pixelsPerMinute}px` }}>
            <TimeGrid startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
            <VerticalLines startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
            
            {/* Loading spinner overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500 dark:bg-gray-900">Error: {error.message}</div>;
  }

  return (
    <div className="flex-col items-center justify-center p-4 dark:bg-gray-900 min-h-screen bg-gray-200 relative">
      <div className="self-center absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
        <img src="/wildcat.png" alt="Wildcat" className="w-full h-full object-contain" />
      </div>

      {/* Header with controls */}
      <div className="flex justify-between items-center ">
       
        <FilterPanel />
         <DatePickerComponent 
          selectedDate={selectedDate}
          setSelectedDate={handleDateChange}
        />
      </div>

      <div className="mt-4 h-[calc(100vh-10rem)] overflow-x-auto py-5 rounded-md relative">
        <div className="min-w-max relative" style={{ width: `${(endHour - startHour) * 60 * pixelsPerMinute}px` }}>
          <TimeGrid startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
          <VerticalLines startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
          
          {/* Current time indicator positioned absolutely over the content */}
          <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
            <CurrentTimeIndicator 
              currentTime={currentTime}
              startHour={startHour}
              endHour={endHour}
              pixelsPerMinute={pixelsPerMinute}
            />
          </div>

          {rooms.map((room, index) => {
            // Only render if room is selected
            if (!selectedRooms.includes(room)) {
              return null; // Don't render this room
            }
            
            console.log('App: Rendering room:', room, 'at index:', index, 'Total rooms:', selectedRooms.length);
            
            const roomEvents = events?.filter(event => {
              if (event.subject_itemName?.includes('&')) return false;
              
              const lMatch = event.subject_itemName?.match(/K(GHL\d+)/);
              if (lMatch) {
                const parsedRoom = lMatch[1].replace(/(GH)(L)(\d+)/, 'GH $2$3');
                return parsedRoom === room;
              }
              
              const match = event.subject_itemName?.match(/K(GH\d+[AB]?)/);
              if (!match) return false;
              
              const roomName = match[1].replace(/(GH)(\d+)([AB]?)/, 'GH $2$3');
              return roomName === room;
            });

            const currentFloor = room.match(/GH (\d)/)?.[1];
            const nextRoom = rooms[index + 1];
            const nextFloor = nextRoom?.match(/GH (\d)/)?.[1];
            const isFloorBreak = currentFloor !== nextFloor;

            return (
              <RoomRow
                key={room}
                room={room}
                roomEvents={roomEvents}
                startHour={startHour}
                pixelsPerMinute={pixelsPerMinute}
                rooms={rooms}
                isFloorBreak={isFloorBreak}
                onEventClick={handleEventClick}
              />
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Wrap the app with QueryClientProvider and ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/:date" element={<AppContent />} />
            <Route path="/event/:date/:eventId" element={<EventDetail />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}