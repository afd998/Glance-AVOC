import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import TimeGrid from "../features/Schedule/components/TimeGrid";
import CurrentTimeIndicator from "../features/Schedule/components/CurrentTimeIndicator";
import RoomRow from "../features/Schedule/components/RoomRow";
import VerticalLines from "../features/Schedule/components/VerticalLines";
import AppHeader from "../components/AppHeader";
import AppHeaderVertical from "../components/AppHeaderVertical";
import DraggableGridContainer from "../features/Schedule/DraggableGridContainer";
import DateDisplay from "../features/Schedule/components/DateDisplay";
import { useEvents, useFilteredEvents, useEventsPrefetch, useRoomRows} from "../features/Schedule/hooks/useEvents";
import { useLCRooms   } from "../core/Rooms/useRooms";
import { useNotifications } from "../features/notifications/useNotifications";
import { useProfile } from "../core/User/useProfile";
import { useRooms } from "../core/Rooms/useRooms";
import { usePanoptoNotifications } from "../hooks/usePanoptoNotifications";
import EventDetail from "./EventDetail";
import { Dialog, DialogContent } from "../components/ui/dialog";
import NoEventsMessage from "../features/Schedule/components/NoEventsMessage";
  import { useFilteredLCEvents } from "../features/Schedule/hooks/useFilteredLCEvents";
import { useZoom } from "../contexts/ZoomContext";
import { usePixelMetrics } from "../contexts/PixelMetricsContext";
import { useTheme } from "../contexts/ThemeContext";
import { Badge } from "../components/ui/badge";
import { Database } from "../types/supabase";



export default function HomePage() {
  
  // Drag functionality
  const [isDragEnabled, setIsDragEnabled] = useState(true);
  

  // Header hover state to control DateDisplay visibility
  const navigate = useNavigate();
  const location = useLocation();
  const { date, eventId } = useParams();
  


  const selectedDate = (() => {
    if (!date) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    }
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day, 12, 0, 0);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  })();

  const { pageZoom } = useZoom();
  const { pixelsPerMinute, rowHeightPx } = usePixelMetrics();
  const { currentTheme, isDarkMode } = useTheme();
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const startHour = 7;
  const endHour = 23;
  // ✅ Clean: Get filtered events directly from React Query with select
  const { data: filteredEvents, isLoading, error } = useFilteredEvents(selectedDate);
  const { data: roomRows, isLoading: roomRowsLoading } = useRoomRows(filteredEvents || []);
  const { data: filteredLCEvents, isLoading: filteredLCEventsLoading } = useFilteredLCEvents(selectedDate);
 
  const actualRowCount = (roomRows?.length || 0) + (filteredLCEvents?.length || 0);
  const contentWidth = (endHour - startHour) * 60 * pixelsPerMinute;
  const headerHeightPx = 24;
  const leftLabelBaseWidth = 96;
  const contentHeight = (actualRowCount * rowHeightPx);

  // Prefetch events for previous and next day in the background
  // This ensures instant navigation when using next/previous day buttons
  useEventsPrefetch(selectedDate);

  // // Handle Panopto check notifications
  usePanoptoNotifications(selectedDate);


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

  const isEventDetailRoute = location.pathname.match(/\/\d{4}-\d{2}-\d{2}\/\d+(\/.*)?$/);

 

  // React.useEffect(() => {
  //   if (events && events.length > 0) {
  //     scheduleNotificationsForEvents(events);
  //   }
  // }, [events, scheduleNotificationsForEvents]);



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


  const handleEventClick = (event: Database['public']['Tables']['events']['Row']) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    navigate(`/${dateStr}/${event.id}`);
  };




  if (error) {
    return <div className="flex items-center justify-centertext-red-500">Error: {error.message}</div>;
  }

    return (
    <div className="flex flex-col items-center justify-center w-full h-full gpu-optimized">
      {/* Vertical Header - positioned to the left - HIDDEN */}
      {/* <AppHeaderVertical
        selectedDate={selectedDate}
        setSelectedDate={handleDateChange}
        isLoading={isLoading}
        events={filteredEvents || []}

      /> */}
           
      {/* Kellogg Logo - shown on all screens - HIDDEN */}
      {/* <div className="z-50 pointer-events-none relative h-auto 2xl:pt-10 lg:pt-0 pt-2" >
       
          {/* Light effect behind logo */}
          {/* <div 
            className="absolute rounded-full blur-2xl opacity-100"
            style={{
              background: 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 15%, rgba(255, 255, 255, 0.8) 30%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.4) 70%, rgba(255, 255, 255, 0.2) 85%, transparent 100%)',
              width: '320px',
              height: '320px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1
            }}
          />
          <img 
            src="/Kellogg_H_RGB.png" 
            alt="Kellogg School of Management" 
            className="3xl:h-64 2xl:h-64 xl:h-24 lg:h-20 h-10
            object-contain opacity-90 relative z-10"
          />
        </div> */}
      
      {/* Menu Panel and Notification Bell - moved to Layout */}

      {/* Main content area */}
      <div className="flex-1 w-full overflow-hidden" style={{ zIndex: 3, position: 'relative' }}>
             
      {/* Sticky time header overlay (outside grid), full content width */}
      <div className="sticky top-0 z-50 overflow-hidden" style={{ height: `${headerHeightPx * pageZoom}px` }}>
        <div style={{ width: `${contentWidth * pageZoom}px`, height: `${headerHeightPx * pageZoom}px`, transform: `translateX(-${scrollLeft}px)` }}>
          <div style={{ transform: `scaleY(${pageZoom})`, transformOrigin: 'top left', width: `${contentWidth * pageZoom}px`, height: `${headerHeightPx}px` }}>
            <TimeGrid startHour={startHour} endHour={endHour} pixelsPerMinute={pixelsPerMinute * pageZoom} sticky={false} />
          </div>
        </div>
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
      
      {/* <div className="fixed bottom-4 right-8 text-right pointer-events-none z-50">
        <div className="text-4xl font-bold text-white/80 leading-none">AVOC</div>
        <div className="text-2xl font-semibold text-white/70 leading-none mt-1">HOME</div>
      </div> */}
      
      {/* Navigation Arrows - Only show on xl and larger screens */}
      {/* Previous Day Button - Left Side - Commented out since we have vertical header */}
      {/* <button
        onClick={() => {
          const newDate = new Date(selectedDate);
          newDate.setDate(newDate.getDate() - 1);
          newDate.setHours(0, 0, 0, 0);
          handleDateChange(newDate);
        }}
        disabled={isLoading}
        className={`!hidden xl:flex! fixed left-2 top-1/2 transform -translate-y-1/2 h-16 w-16 p-3 rounded-lg transition-all duration-200 items-center justify-center z-50 opacity-40 ${
          isLoading
            ? 'opacity-20 cursor-not-allowed'
            : 'hover:opacity-60  hover:scale-150 active:scale-95'
        }`}
        aria-label="Previous day"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button> */}

      {/* Next Day Button - Right Side - HIDDEN */}
      {/* <button
        onClick={() => {
          const newDate = new Date(selectedDate);
          newDate.setDate(newDate.getDate() + 1);
          newDate.setHours(0, 0, 0, 0);
          handleDateChange(newDate);
        }}
        disabled={isLoading}
        className={`!hidden xl:flex! fixed right-2 top-1/2 transform -translate-y-1/2 h-16 w-16 p-3 rounded-lg transition-all duration-200 items-center justify-center z-50 opacity-40 ${
          isLoading
            ? 'opacity-20 cursor-not-allowed'
            : 'hover:opacity-60 h hover:scale-150 active:scale-95'
        }`}
        aria-label="Next day"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button> */}

      {/* Grid Container */}
        <DraggableGridContainer
          className="grid-container  h-[calc(100vh-6rem)] rounded-b-lg relative overflow-hidden"
          style={{ 
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 100px), calc(100% - 100px) 100%, 0 100%)'
          }}
        startHour={startHour}
        endHour={endHour}
        pixelsPerMinute={pixelsPerMinute}
         actualRowCount={actualRowCount}
        rowHeightPx={rowHeightPx}
        isDragEnabled={isDragEnabled}
        scale={pageZoom}
        onScrollPositionChange={(pos) => {
          setScrollLeft(pos.left);
          setScrollTop(pos.top);
        }}
      >
        {/* Date Display positioned relative to grid */}
        {/* <div className="absolute top-2 left-2 z-50">
          <DateDisplay isHeaderHovered={isHeaderHovered} />
        </div> */}
        {/* Zoom wrapper: layout-sized outer, transformed inner for scroll + visuals */}
        <div style={{ width: `${contentWidth * pageZoom}px`, minHeight: `${contentHeight * pageZoom}px` }}>
        <div style={{ transform: `scale(${pageZoom})`, transformOrigin: 'top left' }}>
        <div className="min-w-max rounded-lg  h-content relative shadow-2xl " style={{ 
          width: `${contentWidth}px`,
          transition: 'width 200ms ease-in-out',
          minHeight: '100%'
        }}>
          {/* Left labels overlay track placeholder */}
          <div className="absolute inset-y-0 left-0 z-40 pointer-events-none" style={{ width: '96px' }} />
          
            <VerticalLines 
              startHour={startHour} 
              endHour={endHour} 
              pixelsPerMinute={pixelsPerMinute} 
            actualRowCount={(roomRows?.length || 0) + (filteredLCEvents?.length|| 0)}
              rowHeightPx={rowHeightPx}
            />
        
         
            <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none h-full">
              <CurrentTimeIndicator
                startHour={startHour}
                endHour={endHour}
                pixelsPerMinute={pixelsPerMinute}
              />
            </div>
         
          {roomRows.map((room: any, index: number) => {
            const roomEvents = getFilteredEventsForRoomCallback(room.name);
        
            return (
              <RoomRow
                key={`${room.name}`}
                room={room.name}
                roomEvents={roomEvents}
                startHour={startHour}
                pixelsPerMinute={pixelsPerMinute}
              
                onEventClick={handleEventClick}
                isEvenRow={index % 2 === 0}
                isLastRow={index === roomRows.length - 1}
                isFloorBreak={false}
                rowHeightPx={rowHeightPx}
                hideLabel={true}
              />
            );
          })}
<div className="my-2 border-t border-white-300 ">
          {filteredLCEvents?.map((roomData: any, index: number) => {
            const roomEvents = roomData.events;
            console.log("roomData", roomData);
            return (
              <RoomRow
                key={`${roomData.room_name}`}
                room={roomData.room_name}
                roomEvents={roomEvents}
                startHour={startHour}
                pixelsPerMinute={pixelsPerMinute}
              
                onEventClick={handleEventClick}
                isEvenRow={index % 2 === 0}
                isLastRow={index === roomRows.length - 1}
                isFloorBreak={false}
                rowHeightPx={rowHeightPx}
                hideLabel={true}
              />
            );
          })}
           </div>
        </div>
        </div>
        {/* left labels overlay removed from inside; moved outside below */}
        </div>
      </DraggableGridContainer>

      {/* Sticky left labels overlay (outside grid); translate Y with scroll and scale */}
      <div className="z-50 overflow-hidden" style={{ position: 'absolute', top: `${headerHeightPx * pageZoom}px`, left: 0, width: `${leftLabelBaseWidth * pageZoom}px`, pointerEvents: 'none' }}>
        <div style={{ transform: `translateY(-${scrollTop}px) scale(${pageZoom})`, transformOrigin: 'top left', width: `${leftLabelBaseWidth}px` }}>
          <div style={{ position: 'relative' }}>
            {roomRows.map((room: any) => (
              <div key={`label-${room.name}`} style={{ height: `${rowHeightPx}px` }} className="flex items-center justify-center">
                <div className="pointer-events-auto">
                  <Badge 
                    className=""
                    style={{ 
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    {room.name.replace(/^GH\s+/, '')}
                  </Badge>
                </div>
              </div>
            ))}
            {filteredLCEvents?.map((roomData: any) => (
              <div key={`label-${roomData.room_name}`} style={{ height: `${rowHeightPx}px` }} className="flex items-center justify-center">
                <div className="pointer-events-auto">
                  <Badge 
                    className=""
                    style={{ 
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    {roomData.room_name}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Absolutely positioned no-events message */}
      {(!filteredEvents || filteredEvents.length === 0) && !isLoading && (
        <NoEventsMessage />
      )}
      {/* Event Detail Modal as shadcn Dialog */}
      <Dialog open={Boolean(isEventDetailRoute && eventId)} onOpenChange={(open) => { if (!open) navigate(`/${date}`) }}>
        <DialogContent className="w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded-lg bg-transparent border-0 shadow-none p-0">
          <EventDetail />
        </DialogContent>
      </Dialog>
      </div> {/* Close main content area div */}

    </div>
  );
}

