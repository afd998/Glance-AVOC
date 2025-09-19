import { useEffect, useRef } from 'react';
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
  const targetRooms = (() => {
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
          // Add the room itself
          roomsWithEvents.add(roomName);
          
          // If this is a merged room event (contains &), also add the constituent rooms
          if (roomName.includes('&')) {
            const parts = roomName.split('&');
            if (parts.length === 2) {
              const baseRoom = parts[0].trim(); // e.g., "GH 1420"
              const suffix = parts[1].trim(); // e.g., "30", "B"
              
              roomsWithEvents.add(baseRoom);
              
              // Handle different merge patterns
              if (suffix === '30') {
                // 1420&30 case: show both 1420 and 1430
                const roomNumber = baseRoom.match(/GH (\d+)/)?.[1];
                if (roomNumber) {
                  const secondRoom = `GH ${parseInt(roomNumber) + 10}`;
                  roomsWithEvents.add(secondRoom);
                }
              } else if (suffix.length === 1 && /[AB]/.test(suffix)) {
                // A&B case: show both A and B variants
                const baseRoomWithoutSuffix = baseRoom.replace(/[AB]$/, '');
                roomsWithEvents.add(`${baseRoomWithoutSuffix}A`);
                roomsWithEvents.add(`${baseRoomWithoutSuffix}B`);
              }
            }
          }
        }
      });

      // When auto-hide is enabled, show only base rooms that have events
      return baseRooms.filter((room: string) => roomsWithEvents.has(room));
    } else {
      // When auto-hide is disabled, show all base rooms
      return baseRooms;
    }
  })();

  // Only update selectedRooms when targetRooms actually changes
  // But don't override when a filter is actively loaded (currentFilter is set)
  useEffect(() => {
    // If a filter is active, don't override the room store - let the filter control the rooms
    // Exception: "All Rooms" filter and "My Events" should be handled by auto-hide logic
    if (currentFilter && currentFilter !== 'My Events' && currentFilter !== 'All Rooms') {
      return;
    }
    
    // Don't sort - preserve the original order from useRooms
    // Use the original allRooms order to maintain priority sorting
    const sortedTargetRooms = allRooms.filter((room: string) => targetRooms.includes(room));
    const currentRoomsStr = [...selectedRooms].sort().join(',');
    const targetRoomsStr = [...sortedTargetRooms].sort().join(',');
    
    if (currentRoomsStr !== targetRoomsStr) {
      setSelectedRooms(sortedTargetRooms); // Keep original priority order
      setNotificationRooms(sortedTargetRooms); // Keep original priority order
    }
  }, [targetRooms, setSelectedRooms, setNotificationRooms, allRooms, currentFilter]);

  return { autoHide };
}; 