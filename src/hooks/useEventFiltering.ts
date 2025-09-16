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
      
      return filteredEvents.filter(event => {
        if (!event.room_name) return false;
        
        // Handle merged rooms (e.g., "GH 1420&30")
        if (event.room_name.includes('&')) {
          const parts = event.room_name.split('&');
          if (parts.length === 2) {
            const baseRoom = parts[0].trim();
            
            // Merged room events should ONLY appear in the base room row
            // This prevents duplicate rendering in multiple room rows
            return baseRoom === roomName;
          }
        }
        
        // Direct room match
        return event.room_name === roomName;
      });
    };
  }, [filteredEvents]);

  return {
    filteredEvents,
    getFilteredEventsForRoom
  };
}; 