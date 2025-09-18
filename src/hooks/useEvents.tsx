import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { parseEventResources, isUserEventOwner } from '../utils/eventUtils';
import { useProfile } from './useProfile';
import { useFilters } from './useFilters';
import { useAuth } from '../contexts/AuthContext';
import { useAllShiftBlocks, ShiftBlock } from './useShiftBlocks';

type Event = Database['public']['Tables']['events']['Row'];

// Calculate days difference between two dates
const getDaysDifference = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / oneDay);
};

// Fetch events from the events table
const fetchEvents = async ({ queryKey }: { queryKey: [string, Date, Date] }): Promise<Event[]> => {
  const [_, date] = queryKey;

  try {
    // Calculate days from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const daysDifference = getDaysDifference(today, targetDate);
    
    // If date is beyond 80 days, return no events
    if (daysDifference > 80) {
      console.log(`📅 useEvents: Date ${targetDate.toISOString().split('T')[0]} is beyond 80 days (${daysDifference} days), returning no events`);
      return [];
    }
    
    // Calculate date range for the target date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setDate(targetDate.getDate() + 1);
    
    
    // Query events for the target date using the new date column
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('date', targetDate.toISOString().split('T')[0])
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
  const queryClient = useQueryClient();
  const { currentFilter } = useProfile();
  const { filters } = useFilters();
  const { user } = useAuth();
  const { data: allShiftBlocks = [] } = useAllShiftBlocks();

  // Memoize shift blocks IDs to prevent unnecessary re-renders
  const shiftBlocksKey = useMemo(() => 
    allShiftBlocks.map(sb => sb.id).join(','), 
    [allShiftBlocks]
  );

  // Convert date to string for consistent query key
  const dateString = date.toISOString().split('T')[0];

  // Calculate days from today to determine if we should fetch
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const daysDifference = getDaysDifference(today, targetDate);
  const isOutsideWindow = daysDifference > 80;

  // ✅ Clean React Query pattern: Use select for transformations
  const { data: filteredEvents, isLoading, error, isFetching } = useQuery({
    queryKey: [
      'events',
      dateString,
      currentFilter ?? 'null', // Include current filter in key
      user?.id ?? 'null',      // Include user ID in key
      filters.map(f => `${f.name}-${f.display.join(',')}`).join('|'), // Include filters in key
      shiftBlocksKey // Use memoized shift blocks key
    ],
    queryFn: () => fetchEvents({ queryKey: ['events', date, date] }),
    staleTime: Infinity, // Data never becomes stale - only invalidated on page refresh
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnReconnect: false, // Don't refetch when reconnecting
    placeholderData: undefined, // Don't show any placeholder data
    enabled: !isOutsideWindow, // Skip query if outside window
    select: (data) => {
      // Filter events using React Query's select option
      const safeCurrentFilter = currentFilter ?? null;
      const userId: string | null = user && user.id ? user.id : null;
      return filterEvents(data, safeCurrentFilter, filters, userId, allShiftBlocks);
    }
  });

  // We no longer need local state since React Query handles everything


  // ✅ Clean React Query pattern - no useEffect needed!

  // Return the filtered events directly from React Query
  return { data: filteredEvents, isLoading, error, isFetching };
}

// Hook to get cached parsed event resources with computed flags
export function useEventResources(eventId: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['eventResources', eventId],
    queryFn: async () => {
      // Don't make queries for invalid event IDs
      if (!eventId || eventId <= 0) {
        return { resources: [], hasVideoRecording: false, hasStaffAssistance: false, hasHandheldMic: false, hasWebConference: false, hasClickers: false, hasAVNotes: false };
      }
      // First try to get the event from the individual event cache
      const cachedEvent = queryClient.getQueryData(['event', eventId]) as Event | undefined;
      
      if (cachedEvent) {
        // Parse resources from cached event
        const resourceData = parseEventResources(cachedEvent);
        return computeResourceFlags(resourceData);
      }
      
      // If not in cache, fetch the event from the database
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (!event) {
        throw new Error(`Event with id ${eventId} not found`);
      }
      
      // Cache the event for future use
      queryClient.setQueryData(['event', eventId], event);
      
      // Parse resources and compute flags
      const resourceData = parseEventResources(event);
      return computeResourceFlags(resourceData);
    },
    enabled: !!eventId && eventId > 0, // Only run query for valid event IDs
    staleTime: Infinity, // Data never becomes stale - only invalidated on page refresh
    gcTime: Infinity, // Keep in cache indefinitely
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Helper function to compute all resource flags
function computeResourceFlags(resourceData: { resources: any[] }) {
  const { resources } = resourceData;
  
  return {
    resources,
    // Computed boolean flags
    hasVideoRecording: resources.some(item => item.displayName?.includes('Recording')),
    hasStaffAssistance: resources.some(item => item.displayName === 'Staff Assistance'),
    hasHandheldMic: resources.some(item => item.displayName === 'Handheld Microphone'),
    hasWebConference: resources.some(item => item.displayName === 'Web Conference'),
    hasClickers: resources.some(item => item.displayName === 'Clickers (Polling)'),
    hasAVNotes: resources.some(item => item.displayName === 'AV Setup Notes'),
  };
}

// Hook to get cached event duration in hours
export function useEventDurationHours(eventId: number) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['eventDurationHours', eventId],
    queryFn: async (): Promise<number> => {
      // First try to get the event from the individual event cache
      const cachedEvent = queryClient.getQueryData(['event', eventId]) as Event | undefined;
      
      if (cachedEvent) {
        return computeEventDurationHours(cachedEvent);
      }
      
      // If not in cache, fetch the event from the database
      const { data: event, error } = await supabase
        .from('events')
        .select('start_time, end_time')
        .eq('id', eventId)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (!event) {
        throw new Error(`Event with id ${eventId} not found`);
      }
      
      return computeEventDurationHours(event);
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
