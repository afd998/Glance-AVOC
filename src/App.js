import React, { useState } from "react";
import TimeWindowPicker from "./components/TimeWindowPicker";
import Event from "./components/Event";
import FilterPanel from "./components/FilterPanel";
import DarkModeToggle from "./components/DarkModeToggle";
import TimeGrid from "./components/TimeGrid";
import CurrentTimeIndicator from "./components/CurrentTimeIndicator";
import RoomRow from "./components/RoomRow";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./index.css";
import { useEvents } from "./hooks/useEvents";

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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const pixelsPerMinute = 2;

  // Fixed time window
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
    <div className="p-4 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            <span>Filters</span>
          </button>
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
        <DarkModeToggle isDarkMode={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
      </div>
      <div className="mt-4 h-[calc(100vh-8rem)]">
        <div className="mt-8 relative h-full">
          <div className="overflow-x-auto h-full py-5" style={{ width: totalWidth, position: 'relative' }}>
            <TimeGrid startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
            
            <div className="relative">
              <CurrentTimeIndicator 
                currentTime={currentTime}
                startHour={startHour}
                endHour={endHour}
                pixelsPerMinute={pixelsPerMinute}
              />
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
      </div>
    </div>
  );
}

// Wrap the app with QueryClientProvider
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}