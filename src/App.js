import React, { useState } from "react";
import TimeWindowPicker from "./components/TimeWindowPicker";
import Event from "./components/Event";
import FilterPanel from "./components/FilterPanel";
import TimeGrid from "./components/TimeGrid";
import CurrentTimeIndicator from "./components/CurrentTimeIndicator";
import RoomRow from "./components/RoomRow";
import VerticalLines from "./components/VerticalLines";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./index.css";
import { useEvents } from "./hooks/useEvents";
import { ThemeProvider } from './contexts/ThemeContext';

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
  const [selectedRooms, setSelectedRooms] = useState(rooms);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const pixelsPerMinute = 2;
  const startHour = 6;
  const endHour = 23;
  
  const {events, isLoading, error } = useEvents(selectedDate);

  // Update current time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);


  const totalMinutes = (endHour - startHour) * 60;
  const totalWidth = totalMinutes * pixelsPerMinute;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen dark:bg-gray-900 dark:text-white">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500 dark:bg-gray-900">Error: {error.message}</div>;
  }

  return (
    // Main container - Sets the overall page background and padding
    <div className=" flex-col items-center justify-center p-4 dark:bg-gray-900 min-h-screen bg-gray-200 relative">
      {/* Wildcat background image */}
      <div className=" self-center absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
        <img src="/wildcat.png" alt="Wildcat" className="w-full h-full object-contain" />
      </div>

      {/* Header section - Contains the filters button and filter panel */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            <span>Filters</span>
          </button>
          {/* Filter panel - Shows/hides based on showFilters state */}
          {showFilters && (
            <FilterPanel
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              rooms={rooms}
              selectedRooms={selectedRooms}
              setSelectedRooms={setSelectedRooms}
            />
          )}
        </div>
      </div>

      {/* Main content area - Contains the time grid and room rows */}
      <div className="mt-4 h-[calc(100vh-8rem)]  4 overflow-x-auto py-5 rounded-md">
        {/* Time grid component - Renders the time markers and vertical lines */}
        <TimeGrid startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
        
        {/* Current time indicator container */}
        <div className="relative">
          {/* Current time indicator - Shows the current time line */}
          <CurrentTimeIndicator 
            currentTime={currentTime}
            startHour={startHour}
            endHour={endHour}
            pixelsPerMinute={pixelsPerMinute}
          />
        </div>

        {/* Room rows container - Contains room rows */}
        <div className="min-w-max relative" style={{ width: `${(endHour - startHour) * 60 * pixelsPerMinute}px` }}>
          <VerticalLines startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
          {/* Room rows - Maps through selected rooms to create room rows */}
          {selectedRooms.map((room, index) => {
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
            const nextRoom = selectedRooms[index + 1];
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
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Wrap the app with QueryClientProvider and ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
}