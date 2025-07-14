import React, { useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from "react-router-dom";
import TimeWindowPicker from "./components/TimeWindowPicker";
import Event from "./components/Event/Event";
import FilterPanel from "./components/MenuPanel/FilterPanel";
import TimeGrid from "./components/Grid/TimeGrid";
import CurrentTimeIndicator from "./components/Grid/CurrentTimeIndicator";
import RoomRow from "./components/Grid/RoomRow";
import VerticalLines from "./components/Grid/VerticalLines";
import DatePickerComponent from "./components/Grid/DatePickerComponent";
import AcademicCalendarInfo from "./components/Grid/AcademicCalendarInfo";
import QuarterCount from "./components/Grid/QuarterCount";
import CurrentFilterLink from "./components/Grid/CurrentFilterLink";
import Layout from "./components/Layout";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import "react-datepicker/dist/react-datepicker.css";
import "./index.css";
import { useEvents } from "./hooks/useEvents";
import { useNotifications } from "./hooks/useNotifications";
import { useAutoHideLogic } from "./hooks/useAutoHideLogic";
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import useRoomStore from './stores/roomStore';
import EventDetail from './components/EventDetail';

import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import { Database } from './types/supabase';
import AccountPage from './pages/AccountPage';

type Event = Database['public']['Tables']['events']['Row'];

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (renamed from cacheTime)
    },
  },
});

function AppContent() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const currentTimeRef = useRef(new Date());
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  
  // Use Zustand store for room state
  const { 
    selectedRooms, 
    allRooms, 
    setAllRooms, 
    setSelectedRooms,
    setNotificationRooms
  } = useRoomStore();
  
  // Parse date from URL or use current date
  const selectedDate = React.useMemo(() => {
    if (!date) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
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
  const { autoHide } = useAutoHideLogic(events || [], selectedDate);

  // Schedule notifications when events change
  React.useEffect(() => {
    if (events && events.length > 0) {
      scheduleNotificationsForEvents(events);
    }
  }, [events, scheduleNotificationsForEvents]);

  // Update current time every minute (but don't cause re-renders)
  React.useEffect(() => {
    const timer = setInterval(() => {
      const newTime = new Date();
      currentTimeRef.current = newTime;
      setCurrentTime(newTime);
    }, 60000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleDateChange = (newDate: Date) => {
    
    // Create a new date object and set it to midnight in local time
    const localDate = new Date(newDate);
    localDate.setHours(0, 0, 0, 0);
    
    const formattedDate = localDate.toISOString().split('T')[0];
    
    navigate(`/${formattedDate}`);
  };

  // If we're on the root path and have a date, redirect to the date URL
  React.useEffect(() => {
    
    
    if (!date && selectedDate) {
      // Create a new date object and set it to midnight in local time
      const localDate = new Date(selectedDate);
      localDate.setHours(0, 0, 0, 0);
      
      const formattedDate = localDate.toISOString().split('T')[0];
      
      navigate(`/${formattedDate}`, { replace: true });
    }
  }, [date, selectedDate, navigate]);

  // Add event click handler
  const handleEventClick = (event: Event) => {
    // Use the actual event ID from the database
    const dateStr = selectedDate.toISOString().split('T')[0];
    navigate(`/event/${dateStr}/${event.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex-col items-center justify-center p-4 dark:bg-gray-900 min-h-screen bg-gray-200 relative">
        {/* Wildcat image removed */}
        {/* Header with controls */}
        <div className="flex justify-between items-center">
          <FilterPanel selectedDate={selectedDate} events={events} />
                  <div className="flex items-center">
          <DatePickerComponent 
            selectedDate={selectedDate}
            setSelectedDate={handleDateChange}
            isLoading={isLoading}
          />
          <CurrentFilterLink />
          <AcademicCalendarInfo />
          <QuarterCount />
        </div>
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
      </div>
    );
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500 dark:bg-gray-900">Error: {error.message}</div>;
  }

      return (
      <div className="flex-col items-center justify-center p-4 dark:bg-gray-900 min-h-screen bg-gray-200 relative">
        {/* Wildcat image removed */}
        {/* Header with controls */}
      <div className="flex justify-between items-center ">
       
        <FilterPanel selectedDate={selectedDate} events={events} />
        <div className="flex items-center">
          <DatePickerComponent 
            selectedDate={selectedDate}
            setSelectedDate={handleDateChange}
            isLoading={isLoading}
          />
          <CurrentFilterLink />
          <AcademicCalendarInfo />
          <QuarterCount />
        </div>
      </div>

      <div className="mt-4 h-[calc(100vh-10rem)] overflow-x-auto py-5 rounded-md relative wave-container">
        <div className="min-w-max relative" style={{ width: `${(endHour - startHour) * 60 * pixelsPerMinute}px` }}>
          <TimeGrid startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
          <VerticalLines startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute} />
          
          {/* Current time indicator positioned absolutely over the content */}
          <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
            <CurrentTimeIndicator 
              currentTime={currentTimeRef.current}
              startHour={startHour}
              endHour={endHour}
              pixelsPerMinute={pixelsPerMinute}
            />
          </div>

          {selectedRooms.map((room: string, index: number) => {
            const roomEvents = events?.filter(event => {
              const eventRoomName = event.room_name;
              if (!eventRoomName) return false;
              return eventRoomName === room;
            });

            const currentFloor = room.match(/GH (\d)/)?.[1];
            const nextRoom = selectedRooms[index + 1];
            const nextFloor = nextRoom?.match(/GH (\d)/)?.[1];
            const isFloorBreak = currentFloor !== nextFloor;

            return (
              <RoomRow
                key={`${room}-${selectedDate.toISOString().split('T')[0]}`}
                room={room}
                roomEvents={roomEvents}
                startHour={startHour}
                pixelsPerMinute={pixelsPerMinute}
                rooms={allRooms}
                isFloorBreak={isFloorBreak}
                onEventClick={handleEventClick}
                isEvenRow={index % 2 === 0}
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
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<LandingPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <AppContent />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/:date" element={
                <ProtectedRoute>
                  <Layout>
                    <AppContent />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/event/:date/:eventId" element={
                <ProtectedRoute>
                  <Layout>
                    <EventDetail />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/account" element={
                <ProtectedRoute>
                  <Layout>
                    <AccountPage />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}