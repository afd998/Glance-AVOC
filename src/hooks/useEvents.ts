import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

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
    
    console.log(`📅 useEvents: Fetching events for ${targetDate.toISOString().split('T')[0]} (${daysDifference} days from today)`);
    
    // Query events for the target date
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_time', startOfDay.toISOString())
      .lt('start_time', endOfDay.toISOString())
      .order('start_time', { ascending: true });
      
    if (error) {
      console.error('❌ useEvents: Supabase error:', error);
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
  
  // Convert date to string for consistent query key
  const dateString = date.toISOString().split('T')[0];
  
  // Calculate days from today to determine if we should fetch
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const daysDifference = getDaysDifference(today, targetDate);
  const isOutsideWindow = daysDifference > 80;
  
  const { data: eventsData, isLoading, error, isFetching } = useQuery({
    queryKey: ['events', dateString],
    queryFn: () => fetchEvents({ queryKey: ['events', date, date] }),
    staleTime: 0, // Always consider data stale to force fresh fetch
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnReconnect: false, // Don't refetch when reconnecting
    placeholderData: undefined, // Don't show any placeholder data
    enabled: !isOutsideWindow, // Skip query if outside window
  });

  const [events, setEvents] = useState<Event[]>([]);

  // Clear events immediately when date changes
  useEffect(() => {
    setEvents([]);
  }, [dateString]);

  useEffect(() => {
    if (isOutsideWindow) {
      // If outside window, immediately set empty events and no loading
      setEvents([]);
      return;
    }
    
    // Only set events if we're not currently fetching and we have data
    if (!isFetching && eventsData) {
      // Cache each event individually by ID
      eventsData.forEach(event => {
        queryClient.setQueryData(['event', event.id], event);
      });
      
      // Set the events for the current view
      setEvents(eventsData);
    } else if (isFetching) {
      // Clear events while fetching to prevent showing old data
      setEvents([]);
    } else {
      // Clear events when no data (date changed)
      setEvents([]);
    }
  }, [eventsData, isLoading, isFetching, queryClient, isOutsideWindow]);

  // Return appropriate loading state - no loading if outside window
  const finalLoadingState = isOutsideWindow ? false : (isLoading || isFetching);

  return { events, isLoading: finalLoadingState, error };
} 