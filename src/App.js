import React, { useState } from "react";
import TimeWindowPicker from "./components/TimeWindowPicker";
import Event from "./components/Event";
import FilterPanel from "./components/FilterPanel";
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./index.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

// Create a persister
const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

// Persist the cache
persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});

const rooms = [
  "GH L110", "GH L120", "GH L130", "GH L070", "GH 1110", "GH 1120", "GH 1130",
  "GH 1420", "GH 1430", "GH 2110", "GH 2120", "GH 2130", "GH 2410", "GH 2420",
  "GH 2410A", "GH 2410B", "GH 2420A", "GH 2420B", "GH 2430A", "GH 2430B",
  "GH 4101", "GH 4301", "GH 4302", "GH 5101", "GH 5201", "GH 5301"
];

const API_BASE_URL = 'http://localhost:3002';

function AppContent() {
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(17);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedRooms, setSelectedRooms] = useState(rooms);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const pixelsPerMinute = 2;

  // Update current time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ['events', selectedDate],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/availability?date=${selectedDate.toISOString().split('T')[0]}`);
        const text = await response.text();
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = JSON.parse(text);
        console.log('Raw events data:', data);
        console.log('Sample event:', data.data?.[0]);
        return data.data;
      } catch (error) {
        throw error;
      }
    }
  });

  const totalMinutes = (endHour - startHour) * 60;
  const totalWidth = totalMinutes * pixelsPerMinute;

  // Generate hour labels and grid lines
  const hourLabels = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    const minutes = (hour - startHour) * 60;
    const left = minutes * pixelsPerMinute;
    const displayHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hourLabels.push(
      <div
        key={hour}
        className="absolute top-0 text-sm text-gray-600 -translate-x-1/2"
        style={{ left: left }}
      >
        {displayHour}:00 {ampm}
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
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
              startHour={startHour}
              endHour={endHour}
              onStartHourChange={setStartHour}
              onEndHourChange={setEndHour}
              rooms={rooms}
              selectedRooms={selectedRooms}
              setSelectedRooms={setSelectedRooms}
            />
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Refresh Data
        </button>
      </div>
      <div className="mt-4 h-[calc(100vh-8rem)]">
        <div className="mt-8 relative h-full">
          <div className="overflow-x-auto h-full">
            <div style={{ width: totalWidth, position: 'relative' }}>
              <div className="sticky top-0 left-0 right-0 bg-white z-10 pb-2">
                {hourLabels}
              </div>
              {/* Current time indicator */}
              {(() => {
                const now = currentTime;
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const totalCurrentMinutes = (currentHour - startHour) * 60 + currentMinute;
                const currentPosition = totalCurrentMinutes * pixelsPerMinute;

                // Only show if within the visible time range
                if (currentHour >= startHour && currentHour <= endHour) {
                  return (
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                      style={{ 
                        left: currentPosition,
                        animation: 'pulse 2s infinite'
                      }}
                    >
                      <div className="absolute -top-1.5 -translate-x-[4.5px] w-3 h-3 bg-red-500 rounded-full" />
                    </div>
                  );
                }
                return null;
              })()}
              {selectedRooms.map((room, index) => {
                const roomEvents = events?.filter(event => {
                  const roomName = event.subject_itemName?.match(/K(GH\d+[AB]?)/)?.[1]?.replace(/(GH)(\d+)([AB]?)/, 'GH $2$3');
                  return roomName === room;
                });

                // Get the floor number (first digit after GH)
                const currentFloor = room.match(/GH (\d)/)?.[1];
                const nextRoom = selectedRooms[index + 1];
                const nextFloor = nextRoom?.match(/GH (\d)/)?.[1];
                const isFloorBreak = currentFloor !== nextFloor;

                return (
                  <div key={room} className="relative h-24 border-b border-gray-200">
                    <div className="sticky left-0 w-24 h-full bg-gray-50 border-r border-gray-200 flex items-center justify-center z-10">
                      {room}
                    </div>
                    <div className="ml-24 relative h-full" style={{ height: '96px' }}>
                      {roomEvents?.map((event) => (
                        <Event
                          key={`${event.subject_itemName}-${event.start}-${event.end}`}
                          event={event}
                          startHour={startHour}
                          pixelsPerMinute={pixelsPerMinute}
                          rooms={rooms}
                        />
                      ))}
                    </div>
                    {isFloorBreak && (
                      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-500"></div>
                    )}
                  </div>
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