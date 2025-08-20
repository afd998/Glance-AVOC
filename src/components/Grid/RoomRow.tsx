import React from 'react';
import Event from '../Event/Event';
import { Database } from '../../types/supabase';
import { useRoom } from '../../hooks/useRoom';

type Event = Database['public']['Tables']['events']['Row'];

interface RoomRowProps {
  room: string;
  roomEvents: Event[] | undefined;
  startHour: number;
  pixelsPerMinute: number;
  rooms: string[];
  isFloorBreak: boolean;
  onEventClick: (event: Event) => void;
  isEvenRow?: boolean; // Make optional with default
  isLastRow?: boolean; // Add prop for last row styling
}

export default function RoomRow({ room, roomEvents, startHour, pixelsPerMinute, rooms, isFloorBreak, onEventClick, isEvenRow = false, isLastRow = false }: RoomRowProps) {
  const roomText = room.replace(/^GH\s+/, '');
  // const roomSpelling = useRoom(room); // Commented out since we're not using spelling anymore
  
  // Dynamic font size based on room name length
  const fontSize = roomText.length > 4 ? 'text-md' : 'text-lg';
  


  return (
    <div className={`flex h-24 border-b border-white/60 dark:border-white/60 bg-blue-50/40 dark:bg-blue-900/40 ${isLastRow ? 'rounded-b-md' : ''}`}>
      <div className={`sticky left-0 w-24 h-24 backdrop-blur-sm border-r border-white/20 dark:border-white/10 flex flex-col items-center justify-center shadow-lg ${isLastRow ? 'rounded-bl-md' : ''}`} style={{ zIndex: 50 }}>
        <span 
          className={`font-smooth font-light ${fontSize}`} 
          style={{ 
            color: 'white',
            mixBlendMode: 'overlay', 
            textShadow: '0 0 40px rgba(255, 255, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.4)',
            filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2))'
          }}
        >
          {roomText}
        </span>
        {/* Room spelling code commented out - now just showing simple room name vertically */}
      </div>
      <div className={`flex-1 h-24 relative ${isLastRow ? 'rounded-br-md' : ''}`}>
        {roomEvents?.map((event) => (
          <Event
            key={event.id}
            event={event}
            startHour={startHour}
            pixelsPerMinute={pixelsPerMinute}
            rooms={rooms}
            onEventClick={onEventClick}
          />
        ))}
      </div>
      {isFloorBreak && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-600" />
      )}
    </div>
  );
} 