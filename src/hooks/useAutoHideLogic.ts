import { useEffect, useRef } from 'react';
import { useProfile } from './useProfile';
import useRoomStore from '../stores/roomStore';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

export const useAutoHideLogic = (events: Event[], selectedDate: Date) => {
  const { autoHide, currentFilter } = useProfile();
  const { selectedRooms, setSelectedRooms, allRooms } = useRoomStore();
  const previousSelection = useRef<string[]>([]);

  // Auto-hide empty rooms logic
  useEffect(() => {
    if (!events) return;

    // If a preset is currently loaded, don't override the room selection
    if (currentFilter) {
      return;
    }

    if (autoHide) {
      // Store current selection before applying auto-hide
      if (selectedRooms.length > 0 && selectedRooms.length !== allRooms.length) {
        previousSelection.current = [...selectedRooms];
      }

      // Get rooms that have events for the current day
      const roomsWithEvents = new Set();
      events.forEach(event => {
        const roomName = event.room_name;
        if (roomName) {
          roomsWithEvents.add(roomName);
        }
      });

      // When auto-hide is enabled, show only rooms with events
      const roomsToShow = allRooms.filter((room: string) => roomsWithEvents.has(room));
      setSelectedRooms(roomsToShow);
    } else {
      // When auto-hide is disabled, restore previous selection or show all rooms
      const roomsToShow = previousSelection.current.length > 0 
        ? previousSelection.current 
        : allRooms;
      setSelectedRooms(roomsToShow);
    }
  }, [events, selectedDate, autoHide, currentFilter, allRooms, setSelectedRooms]);

  return { autoHide };
}; 