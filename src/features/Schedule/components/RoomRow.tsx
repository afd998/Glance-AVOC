import React, { useState } from 'react';
import Event from '../Event/components/Event';
import { Database } from '../../../types/supabase';
import { useRoom } from '../../../core/Rooms/useRoom';
import { useTheme } from '../../../contexts/ThemeContext';
import { Badge } from '../../../components/ui/badge';

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
  rowHeightPx?: number; // Numeric height in pixels
  hideLabel?: boolean; // When true, do not render left sticky label
}

export default function RoomRow({ 
  room, 
  roomEvents, 
  startHour, 
  pixelsPerMinute, 
 
  isLastRow,
  onEventClick, 
  isEvenRow = false, 
  rowHeightPx = 96,
  hideLabel = false,

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
  const fontSize = isHalloweenTheme ? 'text-3xl' : (roomText.length > 4 ? 'text-xl' : 'text-xl');
  
  // All rows share the provided numeric height; merged events span across rows naturally
  const rowHeightStyle = { height: `${rowHeightPx}px` } as const;
  


  return (
    <div 
      className={`pl-24 flex overflow-visible ${isLastRow ? 'rounded-b-md' : ''}`}
      style={{ 
        ...rowHeightStyle,
        backgroundColor: isDarkMode
          ? (isEvenRow ? 'rgba(55, 55, 55, 0.7)' : 'rgba(45, 45, 45, 0.75)')
          : (isEvenRow ? 'rgba(250, 250, 250, 0.9)' : 'rgba(255, 255, 255, 0.8)') // lighter colors
      }}
      onMouseEnter={() => setIsHoveringRow(true)}
      onMouseLeave={() => setIsHoveringRow(false)}
    >
      {!hideLabel && (
        <div 
          className={`sticky bg-backgroun/80 left-0 w-24 flex flex-col items-center justify-center  transition-all duration-300 ease-in-out cursor-pointer event-no-select ${isLastRow ? 'rounded-bl-md' : ''}`} 
          style={{ 
            zIndex: 100,
            ...rowHeightStyle,
          }}
          data-room-label="true"
        >
          <Badge 
            
            className={``}
            style={{ 
              // fontFamily: fontFamily,
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            {roomText}
          </Badge>
          {/* Room spelling code commented out - now just showing simple room name vertically */}
        </div>
      )}
      <div 
        className={`flex-1 relative transition-all duration-300 ease-in-out overflow-visible ${isLastRow ? 'rounded-br-md' : ''}`}
        style={{ ...rowHeightStyle }}
      >
        {roomEvents?.map((event) => (
          <Event
            key={event.id}
            event={event}
            startHour={startHour}
            pixelsPerMinute={pixelsPerMinute}
            onEventClick={onEventClick}
            rowHeightPx={rowHeightPx}
          />
        ))}
      </div>
     
    </div>
  );
} 