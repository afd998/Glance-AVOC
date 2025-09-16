import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from './useProfile';
import { useFilters } from './useFilters';
import { useMyEventsFilter } from './useMyEventsFilter';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

// Cached my events filter hook
export const useCachedMyEventsFilter = (
  events: Event[] | undefined, 
  date: Date, 
  currentFilter: string | null, 
  userId: string | null, 
  allShiftBlocks: any[]
) => {
  const dateString = date.toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['myEvents', dateString, currentFilter, userId],
    queryFn: () => {
      if (!events || events.length === 0 || currentFilter !== 'My Events' || !userId) {
        return events || [];
      }

      // Import the function dynamically to avoid circular dependency
      const { isUserEventOwner } = require('../utils/eventUtils');
      
      // Filter events to only show those where the current user is an owner
      return events.filter(event => {
        return isUserEventOwner(event, userId, allShiftBlocks);
      });
    },
    enabled: !!events && !!userId && currentFilter === 'My Events',
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};


// Legacy hook for backward compatibility
export const useEventFiltering = (events: Event[] | undefined) => {
  const { currentFilter } = useProfile();
  const { filters } = useFilters();
  const { myEvents } = useMyEventsFilter(events);

  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) {
      return events || [];
    }

    // Special case: MY_EVENTS filter - use the dedicated hook
    if (currentFilter === 'My Events') {
      return myEvents;
    }

    // If there's a current filter, filter events based on filter's display rooms
    if (currentFilter && filters.length > 0) {
      const currentFilterData = filters.find(filter => filter.name === currentFilter);
      if (currentFilterData && currentFilterData.display.length > 0) {
        // Only show events from rooms that are in the filter's display list
        return events.filter(event => {
          const eventRoomName = event.room_name;
          if (!eventRoomName) return false;
          return currentFilterData.display.includes(eventRoomName);
        });
      }
    }

    // No filter applied - show all events
    return events;
  }, [events, currentFilter, filters, myEvents]);

  const getFilteredEventsForRoom = useMemo(() => {
    return (roomName: string) => {
      if (!filteredEvents) return [];
      
      // Return events that match the exact room name, 
      // PLUS events from merged rooms that start with this room name + "&"
      return filteredEvents.filter(event => {
        if (event.room_name === roomName) {
          return true;
        }
        // Check if this is a merged room event that should appear in this base room
        // e.g., "GH 1420&30" events should appear in "GH 1420" row
        if (event.room_name?.startsWith(roomName + '&')) {
          return true;
        }
        return false;
      });
    };
  }, [filteredEvents]);

  return {
    filteredEvents,
    getFilteredEventsForRoom
  };
}; 