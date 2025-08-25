import { useEffect, useRef, useMemo } from 'react';
import { useProfile } from './useProfile';
import { useFilters } from './useFilters';
import useRoomStore from '../stores/roomStore';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

export const useAutoHideLogic = (filteredEvents: Event[], selectedDate: Date) => {
  const { autoHide, currentFilter } = useProfile();
  const { selectedRooms, setSelectedRooms, notificationRooms, setNotificationRooms, allRooms } = useRoomStore();
  const { filters } = useFilters();

  // Calculate what rooms should be displayed
  const targetRooms = useMemo(() => {
    if (!filteredEvents) return allRooms;

    // Determine the base rooms that should be shown (based on current filter)
    let baseRooms = allRooms;
    if (currentFilter && filters.length > 0) {
      const currentFilterData = filters.find(filter => filter.name === currentFilter);
      if (currentFilterData) {
        baseRooms = currentFilterData.display;
      } else if (currentFilter === 'My Events') {
        // For "My Events", we show all rooms since filtering is done by event ownership
        baseRooms = allRooms;
      }
    }

    if (autoHide) {
      // Get rooms that have filtered events for the current day
      const roomsWithEvents = new Set();
      filteredEvents.forEach(event => {
        const roomName = event.room_name;
        if (roomName) {
          roomsWithEvents.add(roomName);
        }
      });

      // When auto-hide is enabled, show only base rooms that have events
      return baseRooms.filter((room: string) => roomsWithEvents.has(room));
    } else {
      // When auto-hide is disabled, show all base rooms
      return baseRooms;
    }
  }, [filteredEvents, selectedDate, autoHide, currentFilter, filters, allRooms]);

  // Only update selectedRooms when targetRooms actually changes
  useEffect(() => {
    // Don't sort - preserve the original order from useRooms
    const currentRoomsStr = [...selectedRooms].sort().join(',');
    const targetRoomsStr = [...targetRooms].sort().join(',');
    
    if (currentRoomsStr !== targetRoomsStr) {
      setSelectedRooms(targetRooms); // Keep original order
      setNotificationRooms(targetRooms); // Keep original order
    }
  }, [targetRooms, selectedRooms, setSelectedRooms, setNotificationRooms]);

  return { autoHide };
}; 