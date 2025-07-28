import { useMemo } from 'react';
import { useProfile } from './useProfile';
import { useFilters } from './useFilters';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

export const useEventFiltering = (events: Event[] | undefined) => {
  const { currentFilter } = useProfile();
  const { filters } = useFilters();
  const { user } = useAuth();

  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) {
      return events || [];
    }



    // Special case: MY_EVENTS filter
    if (currentFilter === 'My Events') {
      if (!user) return [];
      // Filter events to only show those assigned to the current user
      return events.filter(event => {
        return event.owner === user.id;
      });
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
  }, [events, currentFilter, filters, user]);

  const getFilteredEventsForRoom = useMemo(() => {
    return (roomName: string) => {
      if (!filteredEvents) return [];
      return filteredEvents.filter(event => event.room_name === roomName);
    };
  }, [filteredEvents]);

  return {
    filteredEvents,
    getFilteredEventsForRoom
  };
}; 