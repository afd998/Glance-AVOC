import React from 'react';
import Event from '../Event/Event';
import { Database } from '../../types/supabase';

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
}

export default function RoomRow({ room, roomEvents, startHour, pixelsPerMinute, rooms, isFloorBreak, onEventClick, isEvenRow = false }: RoomRowProps) {
  return (
    <div className={`flex h-24 border-b border-gray-200 dark:border-gray-700 ${
      isEvenRow 
        ? 'bg-gray-100 dark:bg-gray-800' 
        : 'bg-gray-200 dark:bg-gray-900'
    }`}>
      <div className="sticky left-0 w-24 h-24 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center" style={{ zIndex: 50 }}>
        <span className="text-gray-900 dark:text-white font-semibold">{room}</span>
      </div>
      <div className="flex-1 h-24 relative">
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