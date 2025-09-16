import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile } from './useProfile';
import { useFilters } from './useFilters';
import { useAuth } from '../contexts/AuthContext';
import { useAllShiftBlocks } from './useShiftBlocks';
import { filterEvents } from './useEvents';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

// Calculate days difference between two dates
const getDaysDifference = (date1: Date, date2: Date): number => {
  const oneDay = 1000 * 60 * 60 * 24;
  const diffTime = (date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / oneDay);
};

// Fetch events from the events table (same logic as useEvents)
const fetchEventsForDate = async (date: Date): Promise<Event[]> => {
  try {
    // Calculate days from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const daysDifference = getDaysDifference(today, targetDate);
    
    // If date is beyond 80 days, return no events
    if (daysDifference > 80) {
      console.log(`📅 Prefetch: Date ${targetDate.toISOString().split('T')[0]} is beyond 80 days (${daysDifference} days), returning no events`);
      return [];
    }
    
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
    console.error('❌ Prefetch: Error fetching events:', error);
    throw error;
  }
};

/**
 * Hook to prefetch events for previous and next day
 * This runs in the background and doesn't block the main useEvents hook
 * 
 * Uses React Query's prefetchQuery to properly cache data with the same
 * query key structure as useEvents, ensuring seamless integration.
 * 
 * Cache behavior: Data is cached with staleTime: Infinity, meaning it
 * will only be invalidated on page refresh, not on navigation.
 */
export function useEventsPrefetch(currentDate: Date) {
  const queryClient = useQueryClient();
  const { currentFilter } = useProfile();
  const { filters } = useFilters();
  const { user } = useAuth();
  const { data: allShiftBlocks = [] } = useAllShiftBlocks();
  const lastPrefetchedDate = useRef<string | null>(null);

  useEffect(() => {
    const currentDateString = currentDate.toISOString().split('T')[0];
    
    // Skip if we've already prefetched for this date
    if (lastPrefetchedDate.current === currentDateString) {
      return;
    }
    
    lastPrefetchedDate.current = currentDateString;
    const prefetchAdjacentDays = async () => {
      // Calculate previous and next day
      const previousDay = new Date(currentDate);
      previousDay.setDate(currentDate.getDate() - 1);
      previousDay.setHours(0, 0, 0, 0);

      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);

      // Check if dates are within the 80-day window
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const prevDaysDiff = getDaysDifference(today, previousDay);
      const nextDaysDiff = getDaysDifference(today, nextDay);

      const datesToPrefetch = [];
      
      if (prevDaysDiff <= 80) {
        datesToPrefetch.push(previousDay);
      }
      
      if (nextDaysDiff <= 80) {
        datesToPrefetch.push(nextDay);
      }

      // Prefetch each date using React Query's prefetchQuery
      for (const date of datesToPrefetch) {
        const dateString = date.toISOString().split('T')[0];
        
        // Create the same query key structure as useEvents
        const queryKey = [
          'events',
          dateString,
          currentFilter ?? 'null',
          user?.id ?? 'null',
          filters.map(f => `${f.name}-${f.display.join(',')}`).join('|'),
          allShiftBlocks.map(sb => sb.id).join(',')
        ];

        // Check if data is already cached
        const cachedData = queryClient.getQueryData(queryKey);
        
        if (!cachedData) {
          try {
            console.log(`🔄 Prefetching events for ${dateString}`);
            
            // Use React Query's prefetchQuery to properly cache the data
            await queryClient.prefetchQuery({
              queryKey,
              queryFn: async () => {
                // Fetch raw events data
                const rawEvents = await fetchEventsForDate(date);
                
                // Apply the same filtering logic as useEvents
                const safeCurrentFilter = currentFilter ?? null;
                const userId: string | null = user && user.id ? user.id : null;
                return filterEvents(rawEvents, safeCurrentFilter, filters, userId, allShiftBlocks);
              },
              staleTime: Infinity, // Same as useEvents - data never becomes stale
              gcTime: 1000 * 60 * 60 * 24, // Same as useEvents - 24 hours
            });
            
            console.log(`✅ Prefetched and cached events for ${dateString}`);
          } catch (error) {
            console.warn(`⚠️ Failed to prefetch events for ${dateString}:`, error);
          }
        } else {
          console.log(`📋 Events for ${dateString} already cached`);
        }
      }
    };

    // Run prefetching in the background
    // Use setTimeout to ensure it doesn't block the main render
    const timeoutId = setTimeout(() => {
      prefetchAdjacentDays().catch(error => {
        console.warn('⚠️ Prefetching failed:', error);
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [
    currentDate,
    queryClient,
    currentFilter,
    filters,
    user?.id,
    allShiftBlocks
  ]);
}
