import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';
import { parseEventResources, isUserEventOwner } from '../../../utils/eventUtils';
import { useProfile } from '../../../core/User/useProfile';
import { useFilters } from './useFilters';
import { useAuth } from '../../../contexts/AuthContext';
import { useShiftBlocks, ShiftBlock } from '../../SessionAssignments/hooks/useShiftBlocks';
import { useEvent } from '../../../core/event/hooks/useEvent';
import { useRooms } from '../../../core/Rooms/useRooms';
import { useLCRooms } from '../../../core/Rooms/useRooms';
type Event = Database['public']['Tables']['events']['Row'];


// Fetch events from the events table
const fetchEvents = async (date: Date): Promise<Event[]> => {

  try {
    // Query events for the target date using the new date column
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('date', date.toISOString().split('T')[0])
      .order('start_time', { ascending: true });
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ useEvents: Error fetching events:', error);
    throw error;
  }
};

// Utility function to update an individual event in the cache
export const updateEventInCache = (
  queryClient: any, 
  eventId: number, 
  updatedEvent: Event
) => {
  // Update the individual event cache
  queryClient.setQueryData(['event', eventId], updatedEvent);
  
  // Also update the event in any date-based caches that might contain it
  // This is a bit more complex, but we can invalidate the date cache
  // or update it if we have the date information
  queryClient.invalidateQueries({ queryKey: ['events'] });
};

export function useEvents(date: Date) {

  // Convert date to string for consistent query key
  const dateString = date.toISOString().split('T')[0];
  // ✅ Clean React Query pattern: Use select for transformations
  const { data: filteredEvents, isLoading, error, isFetching } = useQuery({
    queryKey: [
      'events',
      dateString,
    ],
    queryFn: () => fetchEvents(date),
    staleTime: Infinity, // Data never becomes stale - only invalidated on page refresh
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnReconnect: false, // Don't refetch when reconnecting
    placeholderData: undefined, // Don't show any placeholder data
  });

  return { data: filteredEvents, isLoading, error, isFetching };
}
export function useRoomRows(filteredEvents: Event[]) {
  const { autoHide, currentFilter } = useProfile();
  const { filters, isLoading: filtersLoading } = useFilters();
  const {rooms, isLoading: roomsLoading} = useRooms();
  if (filtersLoading) {
    return { data: [], isLoading: true };
  }
  
  if (currentFilter === 'My Events' || autoHide) {
    let filteredEventRooms = filteredEvents.map((event: Event) => event.room_name);
    for (let room of filteredEventRooms) {
      if (room.includes('&')) {
        let parts = room.split('&');
        let firstRoom = parts[0];
        let suffix = parts[1];
        let secondRoom;
        if (suffix === '30') {
        secondRoom = `1430`;
        }else{
        secondRoom = `${firstRoom.slice(0, -1)}${suffix}`;
        }
        filteredEventRooms.push(firstRoom)
        filteredEventRooms.push(secondRoom)
      }
    }
    // Remove aggregated entries containing '&' and de-duplicate by name
    const filteredNoAgg = filteredEventRooms.filter((name: string) => !name.includes('&'));
    const uniqueNames = Array.from(new Set(filteredNoAgg));

    // Sort uniqueNames based on the order they appear in rooms and dedupe by room.name
    const sortedRoomsRaw = rooms?.filter(room => uniqueNames.includes(room.name)) || [];
    const seen = new Set<string>();
    const sortedRooms = sortedRoomsRaw.filter(room => {
      if (!room?.name) return false;
      if (seen.has(room.name)) return false;
      seen.add(room.name);
      return true;
    });
    return { data: sortedRooms, isLoading: false };
  }
  
  else {
  let filterRooms = filters.find((filter: any) => filter.name === currentFilter)?.display;
  const filteredRooms = filterRooms?.filter((room: string) => !room.includes('&')) || [];

  // De-duplicate names, then sort and dedupe by room.name
  const uniqueNames = Array.from(new Set(filteredRooms));
  const sortedRoomsRaw = rooms?.filter(room => uniqueNames.includes(room.name)) || [];
  const seen = new Set<string>();
  const sortedRooms = sortedRoomsRaw.filter(room => {
    if (!room?.name) return false;
    if (seen.has(room.name)) return false;
    seen.add(room.name);
    return true;
  });
  return { data: sortedRooms, isLoading: false };
  }
}  


export  function useFilteredEvents(date: Date) {
const { data: events, isLoading, error, isFetching } = useEvents(date);
const  { currentFilter } = useProfile();
const { filters } = useFilters();
const { user } = useAuth();
console.log("useFilteredEvents", currentFilter);
console.log("useFilteredEvents events", events);
  // Convert date to string for consistent query key
  const dateString = date.toISOString().split('T')[0];
  const { data: allShiftBlocks = [] } = useShiftBlocks(dateString);

// derived query — cached per combination
const filteredQ = useQuery({
  queryKey: ['events:filtered', dateString, currentFilter],
  // no network: read cached base data and compute
  queryFn: () => {
    
    const userId = user?.id ?? null;
    return filterEvents(events, currentFilter?? null, filters, userId, allShiftBlocks);
  },
  // keep it in memory so toggling days back/forward reuses it
  staleTime: Infinity,
  gcTime: 1000 * 60 * 60, // 1h (tune as you like)
  enabled: events !== undefined &&  events !== null && ((currentFilter === "My Events") ? (allShiftBlocks !== undefined) : true) && currentFilter !== undefined,
});

return {
  data: filteredQ.data,
  isLoading: filteredQ.isLoading || isLoading,
  error: filteredQ.error || error,
  isFetching: filteredQ.isFetching || isFetching
};
}


// Hook to get cached parsed event resources with computed flags
export function useEventResources(eventId: number) {
  const { data: event, isLoading, error } = useEvent(eventId);

  return useQuery({
    queryKey: ['eventResources', eventId],
    queryFn: () => {
      // Don't make queries for invalid event IDs
      if (!eventId || eventId <= 0) {
        return { resources: [], hasVideoRecording: false, hasStaffAssistance: false, hasHandheldMic: false, hasWebConference: false, hasClickers: false, hasAVNotes: false, hasNeatBoard: false };
      }
      
      if (!event) {
        return { resources: [], hasVideoRecording: false, hasStaffAssistance: false, hasHandheldMic: false, hasWebConference: false, hasClickers: false, hasAVNotes: false, hasNeatBoard: false };
      }
      
      // Parse resources and compute flags in one go
      return parseEventResources(event);
    },
    enabled: !!eventId && eventId > 0 && !!event, // Only run when we have valid event ID and event data
    staleTime: Infinity, // Data never becomes stale - only invalidated on page refresh
    gcTime: Infinity, // Keep in cache indefinitely
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}


// Hook to get cached event duration in hours
export function useEventDurationHours(eventId: number) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['eventDurationHours', eventId],
    queryFn: async (): Promise<number> => {
      // Get the event from the individual event cache (useEvent hook manages this)
      const cachedEvent = queryClient.getQueryData(['event', eventId]) as Event | undefined;
      
      if (!cachedEvent) {
        throw new Error(`Event with id ${eventId} not found in cache. Make sure to use useEvent hook first.`);
      }
      
      return computeEventDurationHours(cachedEvent);
    },
    staleTime: 1000 * 60 * 10, // Consider data fresh for 10 minutes (duration rarely changes)
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Helper function to compute event duration in hours
function computeEventDurationHours(event: { start_time: string | null; end_time: string | null }): number {
  if (!event.start_time || !event.end_time) return 0;
  
  try {
    const [startHours, startMinutes] = event.start_time.split(':').map(Number);
    const [endHours, endMinutes] = event.end_time.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    return durationMinutes / 60; // Convert to hours
  } catch (error) {
    return 0;
  }
}

// Helper function to filter events based on current filter and user
export const filterEvents = (
  events: Event[] | undefined,
  currentFilter: string | null,
  filters: any[],
  userId: string | null,
  allShiftBlocks: ShiftBlock[]
): Event[] => {
  if (!events || events.length === 0) {
    return events || [];
  }

  // Special case: MY_EVENTS filter - filter events where user is owner
  if (currentFilter === 'My Events' && userId) {
    // Filter events to only show those where the current user is an owner
    return events.filter((event: Event) => {
      return isUserEventOwner(event, userId, allShiftBlocks);
    });
  }

  // If there's a current filter, filter events based on filter's display rooms
  if (currentFilter && filters.length > 0) {
    const currentFilterData = filters.find(filter => filter.name === currentFilter);
    if (currentFilterData && currentFilterData.display.length > 0) {
      // Only show events from rooms that are in the filter's display list
      return events.filter((event: Event) => {
        const eventRoomName = event.room_name;
        if (!eventRoomName) return false;
        return currentFilterData.display.includes(eventRoomName);
      });
    }
  }

  // No filter applied - show all events
  return events;
};

// Simple prefetch function
export const prefetchEvents = async (queryClient: any, date: Date, currentFilter: string | null) => {
  const dateString = date.toISOString().split('T')[0];
  
  await queryClient.prefetchQuery({
    queryKey: ['events', dateString],
    queryFn: () => fetchEvents(date),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
};

// Simple prefetch hook
export function useEventsPrefetch(currentDate: Date) {
  const queryClient = useQueryClient();
  const { currentFilter } = useProfile();

  useEffect(() => {
    const prefetchAdjacentDays = async () => {
      // Prefetch previous day
      const previousDay = new Date(currentDate);
      previousDay.setDate(currentDate.getDate() - 1);
      await prefetchEvents(queryClient, previousDay, currentFilter ?? null);

      // Prefetch next day
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      await prefetchEvents(queryClient, nextDay, currentFilter ?? null);
    };

    // Run prefetching in the background
    setTimeout(prefetchAdjacentDays, 100);
  }, [currentDate, currentFilter]);
}
