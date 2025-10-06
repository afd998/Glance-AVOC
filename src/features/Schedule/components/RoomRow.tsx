import React, { useState } from 'react';
import Event from '../Event/components/Event';
import { Database } from '../../../types/supabase';
import { useRoom } from '../../../core/Rooms/useRoom';
import { useTheme } from '../../../contexts/ThemeContext';

type Event = Database['public']['Tables']['events']['Row'];

interface RoomRowProps {
  room: string;
  roomEvents: Event[] | undefined;
  startHour: number;
  pixelsPerMinute: number;
  isFloorBreak: boolean;
  onEventClick: (event: Event) => void;
  isEvenRow?: boolean; // Make optional with default
  isLastRow?: boolean; // Add prop for last row styling
}

export default function RoomRow({ 
  room, 
  roomEvents, 
  startHour, 
  pixelsPerMinute, 
 
  isLastRow,
  onEventClick, 
  isEvenRow = false, 

}: RoomRowProps) {
  const { currentTheme, isDarkMode } = useTheme();
  const [isHoveringRow, setIsHoveringRow] = useState(false);
  const roomText = room.replace(/^GH\s+/, '');
  // const roomSpelling = useRoom(room); // Commented out since we're not using spelling anymore
  
  // Check if this room has any merged room events
  const hasMergedRoomEvents = roomEvents?.some(event => 
    event.room_name?.includes('&') || 
    (event.event_type === 'CMC' && (event.room_name === 'GH 2410A' || event.room_name === 'GH 2410B' || 
     event.room_name?.includes('2410A') || event.room_name?.includes('2410B')))
  ) || false;
  
  // Use Halloween font and larger size if Halloween theme is active
  const isHalloweenTheme = currentTheme.name === 'Halloween';
  const fontFamily = isHalloweenTheme ? 'HalloweenInline' : 'Prokofiev';
  const fontSize = isHalloweenTheme ? 'text-7xl' : (roomText.length > 4 ? 'text-xl' : 'text-3xl');
  
  // All rows have the same height - merged events span across multiple rows naturally
  const rowHeight = 'h-24'; // Fixed height for all room rows
  


  return (
    <div 
      className={`flex ${rowHeight} overflow-visible ${isLastRow ? 'rounded-b-md' : ''}`}
      style={{ 
        backgroundColor: isDarkMode
          ? (isEvenRow ? 'rgba(28, 28, 28, 0.7)' : 'rgba(18, 18, 18, 0.75)')
          : (isEvenRow ? 'rgba(200, 200, 200, 0.5)' : 'rgba(220, 220, 220, 0.55)') // more transparent
      }}
      onMouseEnter={() => setIsHoveringRow(true)}
      onMouseLeave={() => setIsHoveringRow(false)}
    >
      <div 
        className={`sticky left-0 w-24 ${rowHeight} bg-white/95 dark:bg-gray-900/95 flex flex-col items-center justify-center shadow-lg transition-all duration-300 ease-in-out cursor-pointer event-no-select ${isLastRow ? 'rounded-bl-md' : ''}`} 
        style={{ 
          zIndex: 100,
          backgroundColor: isHoveringRow ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
          boxShadow: isHoveringRow ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}
        data-room-label="true"
      >
        <span 
          className={`font-light ${fontSize}`} 
          style={{ 
            fontFamily: fontFamily,
           
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          {roomText}
        </span>
        {/* Room spelling code commented out - now just showing simple room name vertically */}
      </div>
      <div 
        className={`flex-1 ${rowHeight} relative transition-all duration-300 ease-in-out overflow-visible ${isLastRow ? 'rounded-br-md' : ''}`}
      >
        {roomEvents?.map((event) => (
          <Event
            key={event.id}
            event={event}
            startHour={startHour}
            pixelsPerMinute={pixelsPerMinute}
            onEventClick={onEventClick}
          />
        ))}
      </div>
     
    </div>
  );
} 