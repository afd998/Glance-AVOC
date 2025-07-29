import React, { useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation } from "react-router-dom";
import TimeGrid from "./components/Grid/TimeGrid";
import CurrentTimeIndicator from "./components/Grid/CurrentTimeIndicator";
import RoomRow from "./components/Grid/RoomRow";
import VerticalLines from "./components/Grid/VerticalLines";
import AppHeader from "./components/AppHeader";
import Layout from "./components/Layout";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import "react-datepicker/dist/react-datepicker.css";
import "./index.css";
import { useEvents } from "./hooks/useEvents";
import { useNotifications } from "./hooks/useNotifications";
import { useEventFiltering } from "./hooks/useEventFiltering";
import { useAutoHideLogic } from "./hooks/useAutoHideLogic";
import { useProfile } from "./hooks/useProfile";
import { useFilters } from "./hooks/useFilters";
import { useRooms } from "./hooks/useRooms";
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import useRoomStore from './stores/roomStore';
import EventDetail from './components/DetailPage/EventDetail';
import FacultyListModal from './components/MenuPanel/FacultyListModal';
import FacultyDetailModal from './components/Faculty/FacultyDetailModal';
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import { Database } from './types/supabase';
import AccountPage from './pages/AccountPage';
import AboutPage from './pages/AboutPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

function AppContent() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const currentTimeRef = useRef(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  const { date, eventId } = useParams();
  const { allRooms, selectedRooms, setSelectedRooms, setAllRooms } = useRoomStore();
  const { rooms, isLoading: roomsLoading } = useRooms();
  
  // Populate the store with rooms from database
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
    const timer = setInterval(() => {
      const newTime = new Date();
      currentTimeRef.current = newTime;
      setCurrentTime(newTime);
    }, 60000);
    return () => { clearInterval(timer); };
  }, []);

  const handleDateChange = (newDate: Date) => {
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

  const handleEventClick = (event: Database['public']['Tables']['events']['Row']) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    navigate(`/${dateStr}/${event.id}`);
  };

  if (isLoading || roomsLoading) {
    return (
      <div className="flex-col items-center justify-center p-4 dark:bg-gray-900 min-h-screen bg-gray-200 relative">
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
    return <div className="flex items-center justify-center h-screen text-red-500 dark:bg-gray-900">Error: {error.message}</div>;
  }

  return (
    <div className="flex-col items-center justify-center p-4 dark:bg-gray-900 min-h-screen bg-gray-200 relative">
      <AppHeader 
        selectedDate={selectedDate}
        setSelectedDate={handleDateChange}
        isLoading={isLoading}
        events={events}
      />
      <div className="mt-4 h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)] overflow-x-auto py-5 rounded-md relative wave-container">
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
            className="w-full max-w-7xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-xl"
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

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
              <Route path="/auth" element={<LandingPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <AppContent />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path=":date" element={
                <ProtectedRoute>
                  <Layout>
                    <AppContent />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path=":date/:eventId/*" element={
                <ProtectedRoute>
                  <Layout>
                    <AppContent />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path=":date/faculty" element={
                <ProtectedRoute>
                  <Layout>
                    <AppContent />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path=":date/faculty/:facultyId" element={
                <ProtectedRoute>
                  <Layout>
                    <AppContent />
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
              <Route path="/about" element={
                <ProtectedRoute>
                  <Layout>
                    <AboutPage />
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