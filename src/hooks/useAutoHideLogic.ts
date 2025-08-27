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
    console.log('=== AUTO-HIDE DEBUG START ===');
    console.log('autoHide:', autoHide);
    console.log('filteredEvents length:', filteredEvents?.length || 0);
    console.log('allRooms length:', allRooms.length);
    console.log('currentFilter:', currentFilter);
    
    if (!filteredEvents) {
      console.log('No filtered events, returning allRooms');
      return allRooms;
    }

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
    console.log('baseRooms length:', baseRooms.length);

    if (autoHide) {
      // Get rooms that have filtered events for the current day
      const roomsWithEvents = new Set();
      console.log('Processing events for auto-hide...');
      
      filteredEvents.forEach((event, index) => {
        const roomName = event.room_name;
        console.log(`Event ${index}: ${event.event_name} in room: ${roomName}`);
        
        if (roomName) {
          // Add the room itself
          roomsWithEvents.add(roomName);
          console.log(`Added room: ${roomName}`);
          
          // If this is a merged room event (contains &), also add the constituent rooms
          if (roomName.includes('&')) {
            console.log(`Found merged room event: ${roomName}`);
            const parts = roomName.split('&');
            if (parts.length === 2) {
              const baseRoom = parts[0].trim(); // e.g., "GH 1420"
              const suffix = parts[1].trim(); // e.g., "30", "B"
              
              roomsWithEvents.add(baseRoom);
              console.log(`Added base room: ${baseRoom}`);
              
              // Handle different merge patterns
              if (suffix === '30') {
                // 1420&30 case: show both 1420 and 1430
                const roomNumber = baseRoom.match(/GH (\d+)/)?.[1];
                if (roomNumber) {
                  const secondRoom = `GH ${parseInt(roomNumber) + 10}`;
                  roomsWithEvents.add(secondRoom);
                  console.log(`Added second room: ${secondRoom}`);
                }
              } else if (suffix.length === 1 && /[AB]/.test(suffix)) {
                // A&B case: show both A and B variants
                const baseRoomWithoutSuffix = baseRoom.replace(/[AB]$/, '');
                roomsWithEvents.add(`${baseRoomWithoutSuffix}A`);
                roomsWithEvents.add(`${baseRoomWithoutSuffix}B`);
                console.log(`Added A&B rooms: ${baseRoomWithoutSuffix}A, ${baseRoomWithoutSuffix}B`);
              }
            }
          }
        }
      });

      console.log('Final roomsWithEvents:', Array.from(roomsWithEvents));
      console.log('baseRooms sample:', baseRooms.slice(0, 10));
      
      // When auto-hide is enabled, show only base rooms that have events
      const result = baseRooms.filter((room: string) => roomsWithEvents.has(room));
      console.log('Final filtered result:', result);
      console.log('=== AUTO-HIDE DEBUG END ===');
      return result;
    } else {
      // When auto-hide is disabled, show all base rooms
      console.log('Auto-hide disabled, returning baseRooms');
      console.log('=== AUTO-HIDE DEBUG END ===');
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